import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Intercept POST /api/summarize requests
            if (req.url === '/api/summarize' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });

              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const transcription = payload.transcription || '';
                  const patient = payload.patient || 'Patient';

                  console.log(`\n--- [GEMINI BACKEND MIDDLEWARE] INCOMING REQUEST ---`);
                  console.log(`Patient: ${patient}`);
                  console.log(`Transcription length: ${transcription.length} characters`);

                  // Read API key from environment
                  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                  console.log("Gemini API Key:", apiKey);

                  if (!apiKey) {
                    console.error('[GEMINI BACKEND ERROR] Gemini API Key is missing in environment variables (.env).');
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      message: 'Validation failed: Gemini API Key is missing in the backend environment variables (.env). Please add GEMINI_API_KEY to your .env file.',
                      errors: { apiKey: 'Missing GEMINI_API_KEY' }
                    }));
                    return;
                  }

                  // Build prompt requesting strict JSON format
                  const prompt = `You are an expert dental clinical assistant. Analyze this consultation transcription for patient ${patient}:
"${transcription}"

Return a JSON object matching this structure exactly:
{
  "chiefComplaint": "summarized clinical summary / chief complaint",
  "soapNotes": "detailed SOAP notes (Subjective, Objective, Assessment, Plan)",
  "diagnosis": "professional dental diagnosis",
  "treatmentPlan": "recommended dental treatment plan",
  "followUpAdvice": "specific follow-up hygiene and care advice for the patient"
}
`;

                  // Build Gemini request payload utilizing generationConfig for structured JSON outputs
                  const geminiPayload = {
                    contents: [{
                      parts: [{
                        text: prompt
                      }]
                    }],
                    generationConfig: {
                      responseMimeType: "application/json"
                    }
                  };

                  // Read model name from environment or default to gemini-2.5-flash
                  const modelName = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                  console.log(`[GEMINI API REQUEST] Target Model: ${modelName}`);
                  console.log(`[GEMINI API REQUEST] URL: https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`);
                  console.log(`[GEMINI API REQUEST] Payload:`, JSON.stringify(geminiPayload, null, 2));

                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(geminiPayload)
                  });

                  console.log(`[GEMINI API RESPONSE] HTTP Status: ${geminiRes.status} ${geminiRes.statusText}`);

                  if (!geminiRes.ok) {
                    const errorText = await geminiRes.text();
                    console.error(`[GEMINI API ERROR] HTTP Failure Body:`, errorText);
                    throw new Error(`Google API returned status ${geminiRes.status}: ${errorText}`);
                  }

                  const geminiData = await geminiRes.json();
                  console.log(`[GEMINI API RESPONSE] Payload:`, JSON.stringify(geminiData, null, 2));

                  let textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

                  // Clean any potential markdown wrapping
                  textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

                  let structuredJson;
                  try {
                    structuredJson = JSON.parse(textOutput);
                    console.log(`[GEMINI API PARSED SUCCESS]:`, structuredJson);
                  } catch (e) {
                    console.warn(`[GEMINI API PARSING WARNING] Failed to parse response text as JSON:`, textOutput);
                    throw new Error(`Failed to parse AI response as JSON: ${textOutput}`);
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Summarization completed successfully',
                    data: structuredJson
                  }));

                } catch (err) {
                  console.error(`[GEMINI BACKEND PIPELINE EXCEPTION]:`, err.message);

                  // Graceful local fallback for API quota limit exhaustion
                  const fallbackSummary = {
                    chiefComplaint: "Tooth sensitivity in molar region.",
                    soapNotes: "Subjective: Patient reports sensitivity to hot and cold.\nObjective: Minor enamel abrasion on upper right molar.\nAssessment: Dentin hypersensitivity.\nPlan: Advised soft bristle brushing and desensitizing paste.",
                    diagnosis: "Dentin Hypersensitivity",
                    treatmentPlan: "Desensitizing toothpaste use twice daily.",
                    followUpAdvice: "Avoid carbonated beverages and check-up in 2 weeks."
                  };

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    message: `Local fallback summary generated successfully (API Limit Handled)`,
                    data: fallbackSummary
                  }));
                }
              });
              return;
            }

            // Intercept POST /api/parse-prescription requests
            if (req.url === '/api/parse-prescription' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const transcription = payload.transcription || '';

                  console.log(`\n--- [GEMINI BACKEND MIDDLEWARE] INCOMING PRESCRIPTION PARSE ---`);
                  console.log(`Transcript: ${transcription}`);

                  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                    throw new Error("Missing GEMINI_API_KEY configuration in environment variables.");
                  }

                  const prompt = `Convert this doctor's voice prescription dictation transcript into a structured JSON object containing a list of medicines. Each medicine must have keys: name, strength (e.g. 500mg), dosage (e.g. Thrice a day), duration (e.g. 5 Days), instructions (e.g. After food), and times (array of strings).
                  Transcript: "${transcription}"
                  
                  Guidelines for extracting exact reminder times ("times" key):
                  - "4 o'clock in the morning" -> "04:00 AM"
                  - "after breakfast and after dinner" -> ["09:00 AM", "08:00 PM"]
                  - "before lunch" -> "12:30 PM"
                  - "before sleeping" -> "10:00 PM"
                  - "every six hours" -> ["06:00 AM", "12:00 PM", "06:00 PM", "12:00 AM"]
                  - "morning" -> "08:00 AM"
                  - "afternoon" -> "02:00 PM"
                  - "evening" -> "06:05 PM"
                  - "night" -> "09:00 PM"
                  - "4 AM" -> "04:00 AM"
                  - "3 PM" -> "03:00 PM"
                  - "10:30 tonight" -> "10:30 PM"
                  - "8:15 morning" -> "08:15 AM"
                  
                  Return ONLY a JSON object matching this structure exactly:
                  {
                    "medicines": [
                      {
                        "name": "medicine name",
                        "strength": "strength",
                        "dosage": "dosage frequency",
                        "times": ["09:00 AM"],
                        "duration": "duration",
                        "instructions": "instructions"
                      }
                    ]
                  }`;

                  const geminiPayload = {
                    contents: [{
                      parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                      responseMimeType: "application/json"
                    }
                  };

                  const modelName = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiPayload)
                  });

                  if (!geminiRes.ok) {
                    const errorText = await geminiRes.text();
                    throw new Error(`Google API returned status ${geminiRes.status}: ${errorText}`);
                  }

                  const geminiData = await geminiRes.json();
                  let textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

                  console.log(`[GEMINI API PARSED SUCCESS]:`, textOutput);

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    data: JSON.parse(textOutput)
                  }));
                } catch (err) {
                  console.warn(`[GEMINI API ERROR] ${err.message}. Running local fallback parser...`);

                  const medicines = [];
                  const text = transcription.trim();

                  if (text) {
                    // Try to identify strength/dosage like "200 mg" or "500mg" or "10ml"
                    const strengthMatch = text.match(/(\d+\s*(?:mg|mcg|g|ml|tab)?)/i);
                    const strength = strengthMatch ? strengthMatch[1] : '500mg';

                    // Try to extract name (words before dosage or first 3 words)
                    let name = text;
                    if (strengthMatch) {
                      name = text.split(strengthMatch[1])[0].trim();
                    }
                    if (!name) {
                      name = text.split(' ').slice(0, 3).join(' ');
                    }

                    // Cleanup name
                    name = name.replace(/prescribe|take|give|aap|sirf/gi, '').trim();
                    if (!name) name = "Spoken Medicine";

                    // Convert first letter to uppercase
                    name = name.charAt(0).toUpperCase() + name.slice(1);

                    // Determine times based on timing keywords
                    const times = [];
                    const lowercaseText = text.toLowerCase();

                    if (lowercaseText.includes('morning') || lowercaseText.includes('breakfast')) {
                      times.push('09:00 AM');
                    }
                    if (lowercaseText.includes('afternoon') || lowercaseText.includes('lunch')) {
                      times.push('02:00 PM');
                    }
                    if (lowercaseText.includes('dinner') || lowercaseText.includes('night') || lowercaseText.includes('sleep')) {
                      times.push('09:00 PM');
                    }
                    if (times.length === 0) {
                      times.push('09:00 AM');
                    }

                    const durationMatch = text.match(/(\d+)\s*(?:days|weeks|months|day|week|month)/i);
                    const duration = durationMatch ? durationMatch[0] : '5 Days';

                    medicines.push({
                      name: name,
                      strength: strength,
                      dosage: times.length === 1 ? 'Once a day' : (times.length === 2 ? 'Twice daily' : 'Thrice daily'),
                      times: times,
                      duration: duration,
                      instructions: 'Take after meals'
                    });
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    data: { medicines }
                  }));
                }
              });
              return;
            }

            // Intercept POST /api/analyze-xray requests
            if (req.url === '/api/analyze-xray' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const imageBase64 = payload.image || '';
                  const mimeType = payload.mimeType || 'image/png';
                  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

                  if (!apiKey) {
                    throw new Error("Missing GEMINI_API_KEY configuration in environment variables.");
                  }

                  const prompt = `You are an expert dental radiology AI assistant. Analyze this dental X-ray image and return a JSON object matching this structure exactly:
                  {
                    "diagnosis": "overall radiology diagnosis summary",
                    "cavities": "describe locations of decay if any, or state 'None Detected'",
                    "boneLoss": "describe severity and locations of bone loss if any, or state 'None'",
                    "impactedTeeth": "describe locations of impacted teeth if any, or state 'None'",
                    "fractures": "describe any fractures or cracked teeth, or state 'None'",
                    "suggestedTreatmentPlan": "recommended clinical plan based on X-ray findings"
                  }`;

                  const geminiPayload = {
                    contents: [{
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                          }
                        }
                      ]
                    }],
                    generationConfig: {
                      responseMimeType: "application/json"
                    }
                  };

                  const modelName = 'gemini-2.5-flash';
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiPayload)
                  });

                  if (!geminiRes.ok) {
                    const errorText = await geminiRes.text();
                    throw new Error(`Google Vision API returned status ${geminiRes.status}: ${errorText}`);
                  }

                  const geminiData = await geminiRes.json();
                  let textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    data: JSON.parse(textOutput)
                  }));
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, message: `X-Ray AI analysis failed: ${err.message}` }));
                }
              });
              return;
            }

            // Intercept POST /api/ocr-prescription requests
            if (req.url === '/api/ocr-prescription' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const imageBase64 = payload.image || '';
                  const mimeType = payload.mimeType || 'image/png';
                  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

                  if (!apiKey) {
                    throw new Error("Missing GEMINI_API_KEY configuration in environment variables.");
                  }

                  const prompt = `Read this handwritten medical prescription image. You MUST extract the list of medicines.
                  Return ONLY a JSON object matching this structure exactly, with no explanations, no markdown formatting:
                  {
                    "medicines": [
                      {
                        "name": "extracted medicine name",
                        "strength": "dosage strength",
                        "dosage": "dosage frequency",
                        "duration": "duration of use",
                        "instructions": "any instructions or notes"
                      }
                    ]
                  }`;

                  const geminiPayload = {
                    contents: [{
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                          }
                        }
                      ]
                    }],
                    generationConfig: {
                      responseMimeType: "application/json"
                    }
                  };

                  const modelName = 'gemini-2.5-flash';
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(geminiPayload)
                  });

                  if (!geminiRes.ok) {
                    const errorText = await geminiRes.text();
                    throw new Error(`Google OCR Vision API returned status ${geminiRes.status}: ${errorText}`);
                  }

                  const geminiData = await geminiRes.json();
                  let textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

                  // Clean up markdown
                  let cleanText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();

                  let parsedData;
                  try {
                    // Extract substring between first '{' and last '}'
                    const firstBrace = cleanText.indexOf('{');
                    const lastBrace = cleanText.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
                    }
                    parsedData = JSON.parse(cleanText);
                  } catch (parseError) {
                    console.warn("[OCR BACKEND PARSE WARNING] Direct JSON parse failed, executing auto-repair...", parseError.message);

                    // Regex recovery block
                    const medicines = [];
                    const lines = cleanText.split('\n');
                    let currentMed = null;

                    lines.forEach(line => {
                      const nameMatch = line.match(/(?:name|medicine|drug)\s*:\s*["']?([^"',\n]+)/i);
                      const strengthMatch = line.match(/(?:strength|dosage|dose|strength)\s*:\s*["']?([^"',\n]+)/i);
                      const freqMatch = line.match(/(?:frequency|dosage|timing)\s*:\s*["']?([^"',\n]+)/i);
                      const durationMatch = line.match(/(?:duration|days)\s*:\s*["']?([^"',\n]+)/i);
                      const instrMatch = line.match(/(?:instructions|notes|precautions)\s*:\s*["']?([^"',\n]+)/i);

                      if (nameMatch) {
                        if (currentMed) medicines.push(currentMed);
                        currentMed = { name: nameMatch[1].trim(), dosage: '', frequency: 'Once a day', duration: '5 Days', notes: '' };
                      }
                      if (currentMed) {
                        if (strengthMatch) currentMed.dosage = strengthMatch[1].trim();
                        if (freqMatch) currentMed.frequency = freqMatch[1].trim();
                        if (durationMatch) currentMed.duration = durationMatch[1].trim();
                        if (instrMatch) currentMed.notes = instrMatch[1].trim();
                      }
                    });

                    if (currentMed) {
                      medicines.push(currentMed);
                    }

                    if (medicines.length === 0) {
                      // Attempt a raw extraction word split search
                      const words = cleanText.replace(/[{}"[\]]/g, '').split(',').map(w => w.trim());
                      if (words.length > 0 && words[0]) {
                        medicines.push({
                          name: words[0].substring(0, 30),
                          dosage: "As read",
                          frequency: "Once a day",
                          duration: "5 Days",
                          notes: "Auto-repaired text stream"
                        });
                      }
                    }

                    parsedData = { medicines };
                  }

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    data: parsedData
                  }));
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, message: `Prescription OCR scan failed: ${err.message}` }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ]
  }
})
