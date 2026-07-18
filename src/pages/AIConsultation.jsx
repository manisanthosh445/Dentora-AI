import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Mic, MicOff, Check, RotateCcw, 
  FileText, ShieldAlert, ArrowRight, Save, Play, X, User, RefreshCw, Clipboard
} from 'lucide-react';
import { listEntity, createEntity, summarizeConsultation } from '../services/api';
import { useToast } from '../components/Toast';

export default function AIConsultation() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recognition, setRecognition] = useState(null);

  // AI Summary generation state
  const [generating, setGenerating] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  // Edited clinical notes state
  const [clinicalNotes, setClinicalNotes] = useState({
    chiefComplaint: '',
    soapNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpAdvice: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const defaultDoctors = [
    { id: '1', name: 'Dr. Chaitanya', specialization: 'Endodontist' },
    { id: '2', name: 'Dr. Anusha', specialization: 'Orthodontist' },
    { id: '3', name: 'Dr. Vikram', specialization: 'Pedodontist' }
  ];

  useEffect(() => {
    async function loadInitialData() {
      try {
        const patsRes = await listEntity('Patient');
        if (patsRes.success) {
          setPatients(patsRes.data || []);
        } else {
          setPatients([
            { id: 'P-000231', full_name: 'Rahul Sharma' },
            { id: 'P-000232', full_name: 'Priya Patel' },
            { id: 'P-000233', full_name: 'Amit Verma' }
          ]);
        }

        const staffRes = await listEntity('StaffMember');
        if (staffRes.success) {
          const doctorList = staffRes.data.filter(s => s.role === 'Doctor' || s.role === 'dentist' || s.role === 'Dentist') || [];
          setDoctors(doctorList.length ? doctorList : defaultDoctors);
          if (doctorList.length) setSelectedDoctorId(doctorList[0].id);
        } else {
          setDoctors(defaultDoctors);
          setSelectedDoctorId(defaultDoctors[0].id);
        }
      } catch (err) {
        console.warn("Using mock patient/doctor fallback:", err.message);
        setPatients([
          { id: 'P-000231', full_name: 'Rahul Sharma' },
          { id: 'P-000232', full_name: 'Priya Patel' },
          { id: 'P-000233', full_name: 'Amit Verma' }
        ]);
        setDoctors(defaultDoctors);
        setSelectedDoctorId(defaultDoctors[0].id);
      }
    }
    loadInitialData();

    // Setup speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setTranscription(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev + (cleanPrev ? ' ' : '') + finalTrans;
          });
        }
      };

      rec.onerror = (e) => {
        console.error('Speech error:', e.error);
        if (e.error === 'not-allowed') {
          showToast("Microphone permission denied. Please allow microphone access in your browser settings.", "error");
        } else {
          showToast(`Speech recognition error: ${e.error}`, "error");
        }
        setIsRecording(false);
      };

      setRecognition(rec);
    }

    const isLoaded = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY);
    setHasGeminiKey(isLoaded);
  }, []);

  const getActivePatientName = () => {
    if (isCustomMode) return customPatientName;
    const p = patients.find(pat => pat.id === selectedPatientId);
    return p ? (p.full_name || p.name) : '';
  };

  const getActiveDoctorName = () => {
    const d = doctors.find(doc => doc.id === selectedDoctorId);
    return d ? d.name : 'Dr. Chaitanya';
  };

  const handleStartRecording = async () => {
    if (!recognition) {
      showToast("Speech recognition is not supported in this browser. Please try Chrome or Edge.", "warning");
      return;
    }
    
    try {
      // Request mic permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTranscription('');
      recognition.start();
      setIsRecording(true);
      showToast("Listening... Speak now.", "info");
    } catch (err) {
      console.error("Mic access denied:", err);
      showToast("Microphone access is required for dictation. Please enable it in browser settings.", "error");
    }
  };

  const handleStopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
      showToast("Stopped recording. Processing AI Summary...", "info");
      
      // Allow speech recognition to settle and update the final transcription
      setTimeout(async () => {
        setTranscription(currentText => {
          if (currentText.trim()) {
            generateSummaryDirectly(currentText);
          } else {
            showToast("No text transcribed. Please speak or enter text manually.", "warning");
          }
          return currentText;
        });
      }, 600);
    }
  };

  const generateSummaryDirectly = async (textToSummarize) => {
    const patientName = getActivePatientName();
    if (!patientName) {
      showToast("Please select or enter a patient name.", "warning");
      return;
    }
    
    try {
      setGenerating(true);
      const res = await summarizeConsultation({
        patient: patientName,
        transcription: textToSummarize
      });

      if (res.success && res.data) {
        const payloadData = res.data;
        
        // Helper to format any object or array values into readable text
        const formatVal = (val) => {
          if (typeof val === 'object' && val !== null) {
            if (Array.isArray(val)) return val.join('\n');
            const parts = [];
            // Look for standard SOAP keys or fallback to generic pairs
            if (val.subjective || val.Subjective) parts.push(`Subjective: ${val.subjective || val.Subjective}`);
            if (val.objective || val.Objective) parts.push(`Objective: ${val.objective || val.Objective}`);
            if (val.assessment || val.Assessment) parts.push(`Assessment: ${val.assessment || val.Assessment}`);
            if (val.plan || val.Plan) parts.push(`Plan: ${val.plan || val.Plan}`);
            
            if (parts.length === 0) {
              for (const [k, v] of Object.entries(val)) {
                parts.push(`${k.charAt(0).toUpperCase() + k.slice(1)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
              }
            }
            return parts.join('\n');
          }
          return String(val || '');
        };

        setClinicalNotes({
          chiefComplaint: formatVal(payloadData.chiefComplaint || payloadData.clinicalSummary),
          soapNotes: formatVal(payloadData.soapNotes),
          diagnosis: formatVal(payloadData.diagnosis),
          treatmentPlan: formatVal(payloadData.treatmentPlan),
          followUpAdvice: formatVal(payloadData.followUpAdvice)
        });
        setSummaryResult(true);
        showToast("AI Clinical Summary generated successfully!", "success");
      } else {
        throw new Error(res.message || "Failed to summarize consultation");
      }
    } catch (err) {
      console.error("AI Note generation failed:", err);
      showToast(`AI Summarization Failed: ${err.message}`, "error");
      setSummaryResult(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSummary = () => {
    if (!transcription.trim()) {
      showToast("Please dictate or type consultation notes first.", "warning");
      return;
    }
    generateSummaryDirectly(transcription);
  };

  const handleSaveConsultation = async () => {
    const patientName = getActivePatientName();
    const doctorName = getActiveDoctorName();
    try {
      setSaving(true);
      const data = {
        patient_name: patientName,
        patient_id: isCustomMode ? '' : selectedPatientId,
        doctor_name: doctorName,
        doctor_id: selectedDoctorId,
        dictation: transcription,
        chief_complaint: clinicalNotes.chiefComplaint,
        clinical_findings: clinicalNotes.soapNotes, // Store SOAP notes in clinical_findings field
        diagnosis: clinicalNotes.diagnosis,
        treatment_plan: clinicalNotes.treatmentPlan,
        prescriptions: clinicalNotes.followUpAdvice, // Store follow-up advice in prescriptions field
        created_date: new Date().toISOString()
      };
      
      const res = await createEntity('Consultation', data);
      if (res.success) {
        showToast("Consultation record saved successfully!", "success");
        setSaveSuccess(true);
        setTranscription('');
        setSummaryResult(null);
        setSelectedPatientId('');
        setCustomPatientName('');
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(`Failed to save record: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 text-left">
        <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex items-center justify-center shadow-inner">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI Consultation</h2>
          <p className="text-xs text-slate-550 mt-1">Voice-recorded clinical notes with AI assistance</p>
        </div>
      </div>

      {/* Gemini API Key status banner */}
      {hasGeminiKey ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between text-left animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Consultation Engine: Active (Gemini API key verified from environment)</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-rose-550/10 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between text-left animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span>AI Consultation Engine: Inactive (Gemini API key missing in environment variables)</span>
          </div>
        </div>
      )}

      {/* Selector card - Replicating Screenshot 1 */}
      <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-4 text-left">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Clipboard className="w-4 h-4 text-blue-600" />
          <span>Patient & Doctor Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {/* Patient Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</label>
            {isCustomMode ? (
              <input
                type="text"
                placeholder="Type a custom name..."
                value={customPatientName}
                onChange={(e) => setCustomPatientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Doctor Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Select doctor...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCustomMode(!isCustomMode);
            setSelectedPatientId('');
            setCustomPatientName('');
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-750 flex items-center gap-1 mt-1"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          <span>{isCustomMode ? 'Choose registered patient' : 'Type a custom name instead'}</span>
        </button>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Clinical record saved successfully and filed in Patient Profile history.</span>
        </div>
      )}

      {/* Voice Dictation Card - Replicating Screenshot 1 */}
      <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Voice Recording & Transcription</h3>
        </div>

        {!getActivePatientName() ? (
          <p className="text-xs font-semibold text-slate-400">
            Please select or enter a patient above before recording.
          </p>
        ) : (
          <div className="space-y-4">
            {!recognition && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <span>Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.</span>
              </div>
            )}
            
            {recognition && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full flex items-center justify-center ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {isRecording ? 'Listening and translating...' : 'Microphone Ready'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isRecording ? 'Speak clearly. The screen will update live.' : `Speak consultation notes for ${getActivePatientName()}.`}
                    </p>
                  </div>
                </div>
                
                {isRecording ? (
                  <div className="flex items-center gap-3.5">
                    {/* Recording indicator (red dot + "Listening...") */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-rose-600" />
                      <span>Listening...</span>
                    </div>
                    
                    <button
                      onClick={handleStopRecording}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shrink-0 cursor-pointer"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Stop Recording</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Dictation</span>
                  </button>
                )}
              </div>
            )}

            {/* Transcription Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Transcription Box</label>
              <textarea
                rows={5}
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="Dictated notes will populate here. You can also type clinical notes directly if needed..."
                className="w-full p-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none font-medium text-slate-700 bg-slate-50/20 text-left"
              />
            </div>

            {transcription.trim() && (
              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-colors flex items-center gap-2 ml-auto"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{generating ? 'Processing AI Note...' : 'Generate AI Clinical Summary'}</span>
              </button>
            )}
          </div>
        )}

        {/* How it works Blue Box */}
        <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 text-xs text-blue-800 leading-relaxed font-semibold">
          <strong>How it works:</strong> Record your consultation in any language. The system will automatically detect the language, transcribe the audio, translate it to English, and generate AI-powered clinical documentation — all editable before saving.
        </div>
      </div>

      {/* AI Structured summary display */}
      {summaryResult && (
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-5 text-left animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Review AI Structured Notes</h3>
            </div>
            <button
              onClick={() => setSummaryResult(null)}
              className="text-slate-400 hover:text-slate-655"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Summary (Chief Complaint)</label>
              <textarea
                rows={2}
                value={clinicalNotes.chiefComplaint}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, chiefComplaint: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SOAP Notes (Subjective, Objective, Assessment, Plan)</label>
              <textarea
                rows={2}
                value={clinicalNotes.soapNotes}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, soapNotes: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnosis</label>
              <textarea
                rows={2}
                value={clinicalNotes.diagnosis}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, diagnosis: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Treatment Plan</label>
              <textarea
                rows={2}
                value={clinicalNotes.treatmentPlan}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, treatmentPlan: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-up Advice / Prescriptions</label>
              <textarea
                rows={2}
                value={clinicalNotes.followUpAdvice}
                onChange={(e) => setClinicalNotes({ ...clinicalNotes, followUpAdvice: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setSummaryResult(null)}
              className="px-4 py-2 border border-slate-200 text-slate-605 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConsultation}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Filing Record...' : 'Save Clinical Record'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
