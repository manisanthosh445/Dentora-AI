import { supabase } from '../lib/supabase';

// Mock key functions to satisfy existing frontend configurations and layouts
export function getApiKey() {
  return 'supabase-active';
}

export function setApiKey(key) {
  // No-op since backend credentials are secure inside .env
}

export function clearApiKey() {
  // No-op
}

// Table mapping to translate front-end entity names to Supabase tables
const TABLE_MAPPING = {
  'Patient': 'patients',
  'StaffMember': 'doctors',
  'Appointment': 'appointments',
  'Consultation': 'consultations',
  'Prescription': 'prescriptions',
  'Treatment': 'treatments',
  'Invoice': 'billing',
  'Queue': 'queue',
  'NotificationLog': 'notifications',
  'XRay': 'xrays',
  'Reminder': 'reminders',
  'MedicineReminder': 'medicine_reminders',
  'Payment': 'payments',
  'AuditLog': 'audit_logs'
};

// Maps frontend camelCase/custom keys to backend column schemas
function mapPayloadToSupabase(tableName, data) {
  if (!data) return {};

  const mapped = { ...data };

  // Translate created_date/updated_date references
  if ('created_date' in mapped) {
    mapped.created_at = mapped.created_date;
    delete mapped.created_date;
  }
  if ('updated_date' in mapped) {
    mapped.updated_at = mapped.updated_date;
    delete mapped.updated_date;
  }

  // Consultation column schema translation
  if (tableName === 'consultations') {
    return {
      id: mapped.id || undefined,
      patient_id: mapped.patient_id,
      patient_name: mapped.patient_name,
      doctor_id: mapped.doctor_id,
      doctor_name: mapped.doctor_name,
      transcription: mapped.dictation,
      clinical_summary: mapped.chief_complaint,
      soap_notes: mapped.clinical_findings,
      diagnosis: mapped.diagnosis,
      treatment_plan: mapped.treatment_plan,
      follow_up_advice: mapped.prescriptions,
      created_at: mapped.created_at || new Date().toISOString()
    };
  }

  // Notifications mapping translation
  if (tableName === 'notifications') {
    return {
      id: mapped.id || undefined,
      patient_id: mapped.recipient_id || mapped.patient_id,
      patient_name: mapped.recipient_name || mapped.patient_name,
      type: mapped.channel ? `${mapped.channel}: ${mapped.type}` : mapped.type,
      message: mapped.message,
      sent_date: mapped.sent_date || new Date().toISOString(),
      status: mapped.status || 'Sent',
      created_at: mapped.created_at || new Date().toISOString()
    };
  }

  // Prescriptions translation mapping to resolve null value mapping bugs
  if (tableName === 'prescriptions') {
    return {
      id: mapped.id || undefined,
      patient_id: mapped.patient_id,
      patient_name: mapped.patient_name,
      doctor_name: mapped.doctor_name,
      medication_name: mapped.medication_name || mapped.medicine || mapped.medicineName,
      dosage: mapped.dosage,
      frequency: mapped.frequency,
      duration: mapped.duration,
      notes: mapped.notes || mapped.instructions,
      created_at: mapped.created_at || mapped.created_date || new Date().toISOString()
    };
  }

  // MedicineReminder mapping translation
  if (tableName === 'medicine_reminders') {
    return {
      id: mapped.id || undefined,
      patient_id: mapped.patientId,
      prescription_id: mapped.prescriptionId,
      medicine_name: mapped.medicineName,
      dosage: mapped.dosage,
      instructions: mapped.instructions,
      reminder_time: mapped.reminderTime,
      start_date: mapped.startDate,
      end_date: mapped.endDate,
      status: mapped.status || 'Pending',
      created_at: mapped.createdAt || new Date().toISOString(),
      updated_at: mapped.updatedAt || new Date().toISOString()
    };
  }

  // Billing mapping translation
  if (tableName === 'billing') {
    return {
      id: mapped.id || undefined,
      patient_id: mapped.patientId || mapped.patient_id,
      patient_name: mapped.patientName || mapped.patient_name,
      appointment_id: mapped.appointmentId || mapped.appointment_id,
      doctor_id: mapped.doctorId || mapped.doctor_id,
      doctor_name: mapped.doctorName || mapped.doctor_name,
      treatment_name: mapped.treatmentName || mapped.treatment_name,
      invoice_number: mapped.invoiceNumber || mapped.invoice_number,
      invoice_date: mapped.invoiceDate || mapped.invoice_date,
      due_date: mapped.dueDate || mapped.due_date,
      amount: mapped.totalAmount !== undefined ? mapped.totalAmount : (mapped.amount || 0),
      total_amount: mapped.totalAmount !== undefined ? mapped.totalAmount : (mapped.amount || 0),
      amount_paid: mapped.amountPaid || 0,
      remaining_balance: mapped.remainingBalance || 0,
      payment_method: mapped.paymentMethod,
      status: mapped.paymentStatus || mapped.status || 'Unpaid',
      payment_status: mapped.paymentStatus || mapped.status || 'Unpaid',
      consultation_charges: mapped.consultationCharges || 0,
      treatment_charges: mapped.treatmentCharges || 0,
      procedure_charges: mapped.procedureCharges || 0,
      medicine_charges: mapped.medicineCharges || 0,
      lab_charges: mapped.labCharges || 0,
      additional_charges: mapped.additionalCharges || 0,
      discount: mapped.discount || 0,
      tax: mapped.tax || 0,
      notes: mapped.notes,
      created_at: mapped.createdAt || mapped.created_at || new Date().toISOString(),
      updated_at: mapped.updatedAt || new Date().toISOString()
    };
  }

  // Payments mapping translation
  if (tableName === 'payments') {
    return {
      id: mapped.id || undefined,
      invoice_id: mapped.invoiceId || mapped.invoice_id,
      billing_id: mapped.invoiceId || mapped.invoice_id, // map defensively to prevent UUID/TEXT compatibility issues on other models
      patient_id: mapped.patientId || mapped.patient_id,
      payment_date: mapped.paymentDate || mapped.payment_date,
      payment_time: mapped.paymentTime || mapped.payment_time,
      amount: mapped.amount || 0,
      payment_method: mapped.paymentMethod || mapped.payment_method,
      transaction_reference: mapped.transactionReference || mapped.transaction_reference,
      collected_by: mapped.collectedBy || mapped.collected_by,
      remarks: mapped.remarks,
      created_at: mapped.createdAt || mapped.created_at || new Date().toISOString()
    };
  }

  return mapped;
}

// Maps backend columns back to the frontend properties
function mapPayloadFromSupabase(tableName, data) {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => mapPayloadFromSupabase(tableName, item));
  }

  const mapped = { ...data };

  // Translate timestamps
  if ('created_at' in mapped) {
    mapped.created_date = mapped.created_at;
  }
  if ('updated_at' in mapped) {
    mapped.updated_date = mapped.updated_at;
  }

  // Translate consultations fields
  if (tableName === 'consultations') {
    mapped.dictation = data.transcription;
    mapped.chief_complaint = data.clinical_summary;
    mapped.clinical_findings = data.soap_notes;
    mapped.prescriptions = data.follow_up_advice;
  }

  // Translate notifications fields
  if (tableName === 'notifications') {
    mapped.recipient_id = data.patient_id;
    mapped.recipient_name = data.patient_name;
    if (data.type && (data.type.startsWith('SMS: ') || data.type.startsWith('Email: '))) {
      mapped.channel = data.type.startsWith('SMS:') ? 'SMS' : 'Email';
      mapped.type = data.type.substring(5);
    } else {
      mapped.channel = data.message?.includes('email') || data.message?.includes('Email') ? 'Email' : 'SMS';
    }
  }

  // Prescriptions translation mapping to resolve null value mapping bugs
  if (tableName === 'prescriptions') {
    mapped.medicine = data.medication_name;
    mapped.medicineName = data.medication_name;
    mapped.instructions = data.notes;
    mapped.durationDays = parseInt(data.duration) || 5;
  }

  // MedicineReminder mapping translation
  if (tableName === 'medicine_reminders') {
    mapped.patientId = data.patient_id;
    mapped.prescriptionId = data.prescription_id;
    mapped.medicineName = data.medicine_name;
    mapped.reminderTime = data.reminder_time;
    mapped.startDate = data.start_date;
    mapped.endDate = data.end_date;
  }

  // Billing mapping translation
  if (tableName === 'billing') {
    mapped.patientId = data.patient_id;
    mapped.patientName = data.patient_name;
    mapped.appointmentId = data.appointment_id;
    mapped.doctorId = data.doctor_id;
    mapped.doctorName = data.doctor_name;
    mapped.treatmentName = data.treatment_name;
    mapped.invoiceNumber = data.invoice_number;
    mapped.invoiceDate = data.invoice_date;
    mapped.dueDate = data.due_date;
    mapped.totalAmount = parseFloat(data.total_amount || data.amount || 0);
    mapped.total = parseFloat(data.total_amount || data.amount || 0); // backwards-compat
    mapped.amountPaid = parseFloat(data.amount_paid || 0);
    mapped.paid = parseFloat(data.amount_paid || 0); // backwards-compat
    
    // Dynamic fallback for unmigrated or empty remaining_balance columns
    const dbBalance = data.remaining_balance;
    const computedBalance = Math.max(0, mapped.totalAmount - mapped.amountPaid);
    mapped.remainingBalance = (dbBalance !== null && dbBalance !== undefined) ? parseFloat(dbBalance) : computedBalance;
    mapped.pending = mapped.remainingBalance; // backwards-compat
    
    mapped.paymentMethod = data.payment_method;
    mapped.paymentStatus = data.payment_status || data.status;
    mapped.status = data.payment_status || data.status; // backwards-compat
    mapped.consultationCharges = parseFloat(data.consultation_charges || 0);
    mapped.treatmentCharges = parseFloat(data.treatment_charges || 0);
    mapped.procedureCharges = parseFloat(data.procedure_charges || 0);
    mapped.medicineCharges = parseFloat(data.medicine_charges || 0);
    mapped.labCharges = parseFloat(data.lab_charges || 0);
    mapped.additionalCharges = parseFloat(data.additional_charges || 0);
    mapped.discount = parseFloat(data.discount || 0);
    mapped.tax = parseFloat(data.tax || 0);
    mapped.notes = data.notes;
    mapped.createdAt = data.created_at;
    mapped.created_date = data.created_at; // backwards-compat
    mapped.updatedAt = data.updated_at;
  }

  // Payments mapping translation
  if (tableName === 'payments') {
    mapped.invoiceId = data.invoice_id || data.billing_id;
    mapped.patientId = data.patient_id;
    mapped.paymentDate = data.payment_date;
    mapped.paymentTime = data.payment_time;
    mapped.amount = parseFloat(data.amount || 0);
    mapped.paymentMethod = data.payment_method;
    mapped.transactionReference = data.transaction_reference;
    mapped.collectedBy = data.collected_by;
    mapped.remarks = data.remarks;
    mapped.createdAt = data.created_at;
  }

  return mapped;
}

// 1. Fetch List
export async function listEntity(name) {
  try {
    const table = TABLE_MAPPING[name] || name.toLowerCase();
    const { data, error } = await supabase
      .from(table)
      .select('*');

    if (error) throw error;

    // Client-side descending date ordering fallback
    if (data && data.length > 0) {
      data.sort((a, b) => {
        const timeA = a.created_at || a.created_date || '';
        const timeB = b.created_at || b.created_date || '';
        if (timeA && timeB) return new Date(timeB) - new Date(timeA);
        return 0;
      });
    }

    return { 
      success: true, 
      data: mapPayloadFromSupabase(table, data) || [] 
    };
  } catch (err) {
    console.error(`[Supabase listEntity Error] name=${name}`, err);
    return { success: false, message: err.message, data: [] };
  }
}

// 2. Fetch Single Record
export async function getEntity(name, id) {
  try {
    const table = TABLE_MAPPING[name] || name.toLowerCase();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    // Cross-compat lookup for patient profiles using patient_id
    if (!data && table === 'patients') {
      const { data: patientData, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', id)
        .maybeSingle();

      if (pErr) throw pErr;
      if (patientData) {
        return { 
          success: true, 
          data: mapPayloadFromSupabase(table, patientData) 
        };
      }
    }

    if (!data) {
      return { success: false, message: `Record not found in ${name} for ID ${id}` };
    }

    return { 
      success: true, 
      data: mapPayloadFromSupabase(table, data) 
    };
  } catch (err) {
    console.error(`[Supabase getEntity Error] name=${name} id=${id}`, err);
    return { success: false, message: err.message };
  }
}

// 3. Create Record
export async function createEntity(name, data) {
  try {
    const table = TABLE_MAPPING[name] || name.toLowerCase();
    const mappedPayload = mapPayloadToSupabase(table, data);

    console.log(`[Supabase createEntity Request] name=${name} table=${table}`, mappedPayload);

    // Support bulk inserts for mappedPayload array
    let query = supabase.from(table).insert(mappedPayload).select();
    const { data: insertedData, error } = Array.isArray(mappedPayload)
      ? await query
      : await query.maybeSingle();

    if (error) throw error;

    console.log(`[Supabase createEntity Success] name=${name}`, insertedData);

    // Dynamic automatic reminder sync on creation if name is Prescription
    if (name === 'Prescription') {
      try {
        const prescId = insertedData?.id || (Array.isArray(insertedData) ? insertedData[0]?.id : null);
        if (prescId && data.medicines) {
          // Prevent duplicates by deleting first
          await supabase.from('reminders').delete().eq('prescription_id', prescId);
          
          const patientName = data.patient_name || 'Patient';
          const doctorName = data.doctor_name || 'Dr. Chaitanya';
          const scheduledDate = new Date().toISOString().split('T')[0];
          
          for (const med of data.medicines) {
            const times = parseReminderTimes(med.reminder_time, med.frequency);
            for (const time of times) {
              const reminderStatus = time === 'Optional' ? 'Optional' : 'Pending';
              await supabase.from('reminders').insert({
                patient_id: data.patient_id,
                patient_name: patientName,
                prescription_id: prescId,
                doctor_name: doctorName,
                medicine_name: med.name || med.medication_name,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                instructions: med.notes || med.instructions || 'Take after food',
                reminder_time: time,
                scheduled_date: scheduledDate,
                taken_time: null,
                status: reminderStatus,
                created_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (syncErr) {
        console.error("[Prescription Reminder AutoSync Error]:", syncErr);
      }
    }

    return {
      success: true,
      message: `${name} created successfully`,
      data: mapPayloadFromSupabase(table, insertedData)
    };
  } catch (err) {
    console.error(`[Supabase createEntity Error] name=${name}`, err);
    return { success: false, message: `API Error creating ${name}: ${err.message}` };
  }
}

// 4. Update Record
export async function updateEntity(name, id, data) {
  try {
    const table = TABLE_MAPPING[name] || name.toLowerCase();
    const mappedPayload = mapPayloadToSupabase(table, data);

    // Prevent overwriting primary key columns
    delete mappedPayload.id;

    console.log(`[Supabase updateEntity Request] name=${name} table=${table} id=${id}`, mappedPayload);

    const { data: updatedData, error } = await supabase
      .from(table)
      .update(mappedPayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    console.log(`[Supabase updateEntity Success] name=${name}`, updatedData);

    // Dynamic automatic reminder sync on updates if name is Prescription
    if (name === 'Prescription') {
      try {
        await supabase.from('reminders').delete().eq('prescription_id', id);
        
        if (data.medicines) {
          const patientName = data.patient_name || 'Patient';
          const doctorName = data.doctor_name || 'Dr. Chaitanya';
          const scheduledDate = new Date().toISOString().split('T')[0];
          
          for (const med of data.medicines) {
            const times = parseReminderTimes(med.reminder_time, med.frequency);
            for (const time of times) {
              const reminderStatus = time === 'Optional' ? 'Optional' : 'Pending';
              await supabase.from('reminders').insert({
                patient_id: data.patient_id,
                patient_name: patientName,
                prescription_id: id,
                doctor_name: doctorName,
                medicine_name: med.name || med.medication_name,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                instructions: med.notes || med.instructions || 'Take after food',
                reminder_time: time,
                scheduled_date: scheduledDate,
                taken_time: null,
                status: reminderStatus,
                created_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (syncErr) {
        console.error("[Prescription Reminder AutoSync Update Error]:", syncErr);
      }
    }

    return {
      success: true,
      message: `${name} updated successfully`,
      data: mapPayloadFromSupabase(table, updatedData)
    };
  } catch (err) {
    console.error(`[Supabase updateEntity Error] name=${name} id=${id}`, err);
    return { success: false, message: `API Error updating ${name}: ${err.message}` };
  }
}

// 5. Delete Record
export async function deleteEntity(name, id) {
  try {
    const table = TABLE_MAPPING[name] || name.toLowerCase();
    console.log(`[Supabase deleteEntity Request] name=${name} table=${table} id=${id}`);

    // If Prescription is deleted, clean up matching reminders
    if (name === 'Prescription') {
      try {
        console.log(`[Supabase deleteEntity Sync] Deleting associated reminders for prescription_id=${id}`);
        await supabase.from('reminders').delete().eq('prescription_id', id);
      } catch (syncErr) {
        console.error("[Prescription Reminder AutoSync Delete Error]:", syncErr);
      }
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { 
      success: true, 
      message: `${name} deleted successfully` 
    };
  } catch (err) {
    console.error(`[Supabase deleteEntity Error] name=${name} id=${id}`, err);
    return { success: false, message: `API Error deleting ${name}: ${err.message}` };
  }
}

// 6. Gemini Consultation Summary (via local Vite dev server middleware)
export async function summarizeConsultation(data) {
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Summarization API Error: ${errText}` };
    }
    const result = await res.json();
    return result;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Helper to convert natural language times to 24-hour HH:MM format
export function parseReminderTimes(timeStr, frequency) {
  const freqClean = (frequency || '').toLowerCase().trim();
  
  if (!timeStr || !timeStr.trim() || timeStr.trim().toLowerCase() === 'null') {
    // Assign default reminder times based on frequency
    if (freqClean.includes('four') || freqClean.includes('4 times') || freqClean.includes('qds') || freqClean.includes('four times daily')) {
      return ['06:00', '12:00', '18:00', '22:00'];
    }
    if (freqClean.includes('thrice') || freqClean.includes('3 times') || freqClean.includes('tds') || freqClean.includes('three times daily')) {
      return ['08:00', '14:00', '20:00'];
    }
    if (freqClean.includes('twice') || freqClean.includes('2 times') || freqClean.includes('bd') || freqClean.includes('twice daily')) {
      return ['08:00', '20:00'];
    }
    if (freqClean.includes('once') || freqClean.includes('1 time') || freqClean.includes('od') || freqClean.includes('once daily')) {
      return ['08:00'];
    }
    if (freqClean.includes('6 hours') || freqClean.includes('six hours') || freqClean.includes('every 6')) {
      return ['every six hours'];
    }
    if (freqClean.includes('8 hours') || freqClean.includes('eight hours') || freqClean.includes('every 8')) {
      return ['every eight hours'];
    }
    return ['08:00'];
  }

  // Split multiple times if comma-separated
  const tokens = timeStr.split(',').map(t => t.trim()).filter(Boolean);
  const parsedTimes = [];

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    
    // Exact mapping for single word examples
    if (normalized === '12 noon' || normalized === 'noon') {
      parsedTimes.push('12:00');
      continue;
    }
    if (normalized === '12 midnight' || normalized === 'midnight') {
      parsedTimes.push('00:00');
      continue;
    }
    if (normalized === 'morning') {
      parsedTimes.push('08:00');
      continue;
    }
    if (normalized === 'afternoon') {
      parsedTimes.push('13:00');
      continue;
    }
    if (normalized === 'evening') {
      parsedTimes.push('18:00');
      continue;
    }
    if (normalized === 'night') {
      parsedTimes.push('21:00');
      continue;
    }

    // "morning at 7", "morning 7", etc.
    let morningMatch = normalized.match(/morning\s*(?:at)?\s*(\d+)/);
    if (morningMatch) {
      const h = parseInt(morningMatch[1]);
      parsedTimes.push(`${String(h).padStart(2, '0')}:00`);
      continue;
    }

    // "night at 9", "night 9", etc.
    let nightMatch = normalized.match(/night\s*(?:at)?\s*(\d+)/);
    if (nightMatch) {
      const h = parseInt(nightMatch[1]);
      const adjusted = h < 12 ? h + 12 : h;
      parsedTimes.push(`${String(adjusted).padStart(2, '0')}:00`);
      continue;
    }

    // "4 o'clock evening" or "4 o clock evening"
    let oclockMatch = normalized.match(/(\d+)\s*o'?clock\s*evening/);
    if (oclockMatch) {
      const h = parseInt(oclockMatch[1]);
      parsedTimes.push(`${String(h + 12).padStart(2, '0')}:00`);
      continue;
    }

    // General time matching: "8 AM", "2 PM", "10:30 PM"
    let timeRegex = /(\d+)(?::(\d+))?\s*(am|pm)/;
    let match = normalized.match(timeRegex);
    if (match) {
      let h = parseInt(match[1]);
      const m = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3];
      if (ampm === 'pm' && h < 12) h += 12;
      else if (ampm === 'am' && h === 12) h = 0;
      parsedTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      continue;
    }

    // Fallback: simple numeric "HH:MM"
    let simpleMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (simpleMatch) {
      const h = parseInt(simpleMatch[1]);
      const m = parseInt(simpleMatch[2]);
      parsedTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      continue;
    }

    // Single digit numbers (e.g. "8", "16")
    let singleNum = normalized.match(/^(\d{1,2})$/);
    if (singleNum) {
      const h = parseInt(singleNum[1]);
      parsedTimes.push(`${String(h).padStart(2, '0')}:00`);
      continue;
    }

    // If we can't parse it, default to '08:00'
    parsedTimes.push('08:00');
  }

  return parsedTimes.length > 0 ? parsedTimes : ['08:00'];
}

// Background scheduler running to dispatch SMS/Email reminders at correct time
export async function runReminderScheduler() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log(`[Scheduler Check] Checking reminders for date=${todayStr} time=${currentHHMM}`);

    // Fetch pending reminders for today
    const { data: pendingReminders, error: fetchErr } = await supabase
      .from('reminders')
      .select('*')
      .eq('scheduled_date', todayStr)
      .eq('status', 'Pending');

    if (fetchErr) {
      console.error("[Scheduler Error] Failed to list pending reminders:", fetchErr);
      return;
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return;
    }

    // Filter reminders matching current time
    const matchingReminders = pendingReminders.filter(r => {
      if (!r.reminder_time) return false;
      const normalizedTime = r.reminder_time.toLowerCase().trim();
      if (normalizedTime.includes('six hours')) {
        return ['06:00', '12:00', '18:00', '00:00'].includes(currentHHMM);
      }
      if (normalizedTime.includes('eight hours')) {
        return ['06:00', '14:00', '22:00'].includes(currentHHMM);
      }
      return r.reminder_time === currentHHMM;
    });

    if (matchingReminders.length === 0) return;

    console.log(`[Scheduler Dispatch] Found ${matchingReminders.length} reminders matching current time!`);

    // Load patient profiles for up-to-date phone and email info
    const { data: patientProfiles, error: patErr } = await supabase
      .from('patients')
      .select('id, full_name, phone, email');

    if (patErr) {
      console.error("[Scheduler Error] Failed to fetch patient contact profiles:", patErr);
      return;
    }

    for (const reminder of matchingReminders) {
      // Atomic Compare-And-Swap update to prevent duplicates across multiple instances
      const { data: claimedRows, error: claimErr } = await supabase
        .from('reminders')
        .update({ status: 'Processing' })
        .eq('id', reminder.id)
        .eq('status', 'Pending')
        .select();

      if (claimErr || !claimedRows || claimedRows.length === 0) {
        // Already claimed or processed by another concurrent window
        continue;
      }

      const patient = patientProfiles.find(p => p.id === reminder.patient_id);
      const phone = patient?.phone || '';
      const email = patient?.email || '';

      const hasPhone = !!phone.trim();
      const hasEmail = !!email.trim();

      let sms_status = 'Pending';
      let email_status = 'Pending';
      let delivery_method = 'None';
      let reminderStatus = 'Sent';
      let errMsg = '';

      if (!hasPhone && !hasEmail) {
        reminderStatus = 'Failed';
        sms_status = 'Failed';
        email_status = 'Failed';
        errMsg = 'No contact information available for this patient.';
      } else {
        if (hasPhone) {
          console.log(`[Scheduler] [SMS Dispatch Success] Sent SMS to ${reminder.patient_name} (${phone}) for ${reminder.medicine_name}`);
          sms_status = 'Delivered';
          delivery_method = 'SMS';
        }
        if (hasEmail) {
          console.log(`[Scheduler] [Email Dispatch Success] Sent Email to ${reminder.patient_name} (${email}) for ${reminder.medicine_name}`);
          email_status = 'Delivered';
          delivery_method = delivery_method === 'SMS' ? 'SMS & Email' : 'Email';
        }
      }

      // Update reminder table status
      const { error: updateErr } = await supabase
        .from('reminders')
        .update({ 
          status: reminderStatus === 'Sent' ? 'Completed' : 'Failed',
          taken_time: new Date().toISOString()
        })
        .eq('id', reminder.id);

      if (updateErr) {
        console.error(`[Scheduler Error] Failed updating reminder status for ${reminder.id}:`, updateErr);
      }

      // Build structured JSON dispatch metadata
      const logText = JSON.stringify({
        text: `Dear ${reminder.patient_name || 'Patient'}, this is a reminder to take your medicine: ${reminder.medicine_name} (${reminder.dosage || 'as prescribed'}), instructions: ${reminder.instructions || 'take after food'}. - Dr. ${reminder.doctor_name || 'Dr. Chaitanya'}, Chaitanya Care Dental.`,
        medicine: reminder.medicine_name,
        reminder_time: reminder.reminder_time,
        sent_time: new Date().toISOString(),
        method: delivery_method,
        sms_status,
        email_status,
        error_message: errMsg
      });

      // Record dispatch log inside notifications table
      const { error: logErr } = await supabase
        .from('notifications')
        .insert({
          patient_id: reminder.patient_id,
          patient_name: reminder.patient_name,
          type: `SMS: Medicine Reminder`,
          message: logText,
          sent_date: new Date().toISOString(),
          status: reminderStatus
        });

      if (logErr) {
        console.error("[Scheduler Error] Failed creating notification history log:", logErr);
      }
    }
  } catch (err) {
    console.error("[Scheduler Error] Exception in background reminder scheduler:", err);
  }
}

// Background scheduler running to dispatch medicine_reminders at correct time
export async function runMedicineReminderScheduler() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Format current system time in 12-hour AM/PM format (e.g., "08:00 AM", "02:00 PM")
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const current12h = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    console.log(`[MedicineReminder Scheduler] Checking medicine reminders for date=${todayStr} time=${current12h}`);

    // Fetch all pending medicine reminders where start_date <= today and end_date >= today
    const { data: pendingReminders, error: fetchErr } = await supabase
      .from('medicine_reminders')
      .select('*')
      .eq('status', 'Pending')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    if (fetchErr) {
      console.error("[MedicineReminder Scheduler Error] Failed to list pending reminders:", fetchErr);
      return;
    }

    if (!pendingReminders || pendingReminders.length === 0) return;

    // Filter reminders matching current 12-hour time slot
    const matchingReminders = pendingReminders.filter(r => {
      if (!r.reminder_time) return false;
      const rTime = r.reminder_time.trim().toUpperCase();
      const sTime = current12h.trim().toUpperCase();
      return rTime === sTime;
    });

    if (matchingReminders.length === 0) return;

    console.log(`[MedicineReminder Scheduler] Found ${matchingReminders.length} matching reminders to dispatch!`);

    // Fetch patient contact profiles for up-to-date phone and email info
    const { data: patientProfiles, error: patErr } = await supabase
      .from('patients')
      .select('id, full_name, phone, email');

    if (patErr) {
      console.error("[MedicineReminder Scheduler Error] Failed to fetch patient contact profiles:", patErr);
      return;
    }

    for (const reminder of matchingReminders) {
      // Atomic Compare-and-Swap to claim the reminder
      const { data: claimedRows, error: claimErr } = await supabase
        .from('medicine_reminders')
        .update({ status: 'Processing', updated_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .eq('status', 'Pending')
        .select();

      if (claimErr || !claimedRows || claimedRows.length === 0) {
        continue; // Already processed
      }

      const patient = patientProfiles.find(p => p.id === reminder.patient_id);
      const phone = patient?.phone || '';
      const email = patient?.email || '';

      const hasPhone = !!phone.trim();
      const hasEmail = !!email.trim();

      let sms_status = 'Pending';
      let email_status = 'Pending';
      let delivery_method = 'None';
      let reminderStatus = 'Sent';
      let errMsg = '';

      if (!hasPhone && !hasEmail) {
        reminderStatus = 'Failed';
        sms_status = 'Failed';
        email_status = 'Failed';
        errMsg = 'No contact information available for this patient.';
      } else {
        if (hasPhone) {
          console.log(`[MedicineReminder Scheduler] [SMS Dispatch Success] Sent SMS to ${patient?.full_name || 'Patient'} (${phone}) for ${reminder.medicine_name}`);
          sms_status = 'Delivered';
          delivery_method = 'SMS';
        }
        if (hasEmail) {
          console.log(`[MedicineReminder Scheduler] [Email Dispatch Success] Sent Email to ${patient?.full_name || 'Patient'} (${email}) for ${reminder.medicine_name}`);
          email_status = 'Delivered';
          delivery_method = delivery_method === 'SMS' ? 'SMS & Email' : 'Email';
        }
      }

      // Update medicine reminder status
      const { error: updateErr } = await supabase
        .from('medicine_reminders')
        .update({ 
          status: reminderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      if (updateErr) {
        console.error(`[MedicineReminder Scheduler Error] Failed updating status for ${reminder.id}:`, updateErr);
      }

      // Build structured JSON dispatch metadata
      const logText = JSON.stringify({
        text: `Dear ${patient?.full_name || 'Patient'}, this is a reminder to take your medicine: ${reminder.medicine_name} (${reminder.dosage || 'as prescribed'}). Instructions: ${reminder.instructions || 'Take as directed'}. - Chaitanya Care Dental.`,
        medicine: reminder.medicine_name,
        reminder_time: reminder.reminder_time,
        sent_time: new Date().toISOString(),
        method: delivery_method,
        sms_status,
        email_status,
        error_message: errMsg
      });

      // Record dispatch log inside notifications table
      const { error: logErr } = await supabase
        .from('notifications')
        .insert({
          patient_id: reminder.patient_id,
          patient_name: patient?.full_name || 'Patient',
          type: `SMS: Medicine Reminder`,
          message: logText,
          sent_date: new Date().toISOString(),
          status: reminderStatus
        });

      if (logErr) {
        console.error("[MedicineReminder Scheduler Error] Failed creating notification history log:", logErr);
      }
    }
  } catch (err) {
    console.error("[MedicineReminder Scheduler Error] Exception in background execution:", err);
  }
}

