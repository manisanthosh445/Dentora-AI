import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Pill, Plus, Search, X, Check, 
  RefreshCw, User, Clipboard, Calendar,
  Mic, MicOff, Image, ShieldAlert, Sparkles, Receipt, Trash2,
  ChevronDown, ChevronUp, Clock, Activity, FileText, AlertTriangle,
  TrendingUp, UserCheck
} from 'lucide-react';
import { listEntity, createEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Prescriptions() {
  const { showToast } = useToast();
  
  // Base entities fetched from Supabase
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterMedicine, setFilterMedicine] = useState('');
  const [filterReturning, setFilterReturning] = useState(false);

  // Expanded patient cards tracking
  const [expandedPatients, setExpandedPatients] = useState({});

  // Add Prescription modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Chaitanya');
  
  // Single prescription items list in form
  const [meds, setMeds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // AI Assistant States
  const [aiMode, setAiMode] = useState('manual'); // manual, voice, ocr
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [ocrScanning, setOcrScanning] = useState(false);
  const transcriptionRef = useRef('');

  // Drug warnings state
  const [drugWarnings, setDrugWarnings] = useState([]);

  const fetchERPData = async () => {
    try {
      setLoading(true);
      const prescRes = await listEntity('Prescription');
      const patsRes = await listEntity('Patient');
      const apptsRes = await listEntity('Appointment');
      const consultRes = await listEntity('Consultation');
      const treatsRes = await listEntity('Treatment');
      
      if (prescRes.success) setPrescriptions(prescRes.data || []);
      if (patsRes.success) setPatients(patsRes.data || []);
      if (apptsRes.success) setAppointments(apptsRes.data || []);
      if (consultRes.success) setConsultations(consultRes.data || []);
      if (treatsRes.success) setTreatments(treatsRes.data || []);

    } catch (err) {
      console.warn("Failed fetching EMR logs, utilizing local default profiles:", err.message);
      setPrescriptions(defaultPrescriptions);
      setPatients([
        { id: '1', full_name: 'Rahul Sharma', age: 24, gender: 'Male', blood_group: 'O+', phone: '9876543210', allergies: 'Penicillin' },
        { id: '2', full_name: 'Priya Patel', age: 31, gender: 'Female', blood_group: 'A+', phone: '9812345678', allergies: 'None Known' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchERPData();
  }, []);

  const defaultPrescriptions = [
    {
      id: 'pr-1',
      patient_id: '1',
      patient_name: 'Rahul Sharma',
      doctor_name: 'Dr. Chaitanya',
      medicines: [
        { name: 'Brufen', dosage: '400mg', frequency: 'Twice daily', duration: '3 Days', notes: 'Take after meals' },
        { name: 'Calcium', dosage: '500mg', frequency: 'Once a day', duration: '10 Days', notes: 'Take before sleep' }
      ],
      created_date: '2026-07-18T10:00:00.000Z'
    },
    {
      id: 'pr-2',
      patient_id: '1',
      patient_name: 'Rahul Sharma',
      doctor_name: 'Dr. Vikram',
      medicines: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Thrice a day', duration: '5 Days', notes: 'Take after meals' },
        { name: 'Paracetamol', dosage: '650mg', frequency: 'As needed', duration: '3 Days', notes: 'For fever' }
      ],
      created_date: '2026-07-17T09:30:00.000Z'
    },
    {
      id: 'pr-3',
      patient_id: '1',
      patient_name: 'Rahul Sharma',
      doctor_name: 'Dr. Chaitanya',
      medicines: [
        { name: 'Dolo 650', dosage: '650mg', frequency: 'Once a day', duration: '3 Days', notes: 'For body pain' }
      ],
      created_date: '2026-07-12T08:00:00.000Z'
    }
  ];

  // AI Drug Interaction checks
  useEffect(() => {
    const warnings = [];
    const names = meds.map(m => m.name.toLowerCase().trim());

    // Check duplication of NSAIDs
    const isMultipleNsaids = names.filter(n => n.includes('paracetamol') || n.includes('ibuprofen') || n.includes('diclofenac') || n.includes('brufen') || n.includes('dolo')).length > 1;
    
    if (isMultipleNsaids) {
      warnings.push("Duplicate NSAID warning: Multiple pain relievers prescribed. Consider consolidating to avoid toxicity.");
    }

    if (names.some(n => n.includes('amoxicillin')) && names.some(n => n.includes('doxycycline'))) {
      warnings.push("Antibiotic combination notice: Amoxicillin and Doxycycline are both active; verify therapeutic requirements.");
    }

    setDrugWarnings(warnings);
  }, [meds]);

  // Voice dictation triggers
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Web Speech API is not supported in this browser.", "error");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    
    transcriptionRef.current = '';
    
    rec.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' ';
        }
      }
      if (final) {
        transcriptionRef.current += final;
        setVoiceTranscript(transcriptionRef.current);
      }
    };
    
    rec.onend = async () => {
      setIsRecording(false);
      const textToParse = transcriptionRef.current.trim();
      console.log(`[VOICE AI PRESCRIPTION] Finished recording. Transcript to parse: "${textToParse}"`);
      
      if (textToParse) {
        showToast("Formatting speech transcript via Gemini AI...", "info");
        try {
          const res = await fetch('/api/parse-prescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcription: textToParse })
          });
          const jsonRes = await res.json();
          
          console.log("[VOICE AI PRESCRIPTION] Gemini API Raw Response:", JSON.stringify(jsonRes));

          if (jsonRes.success && jsonRes.data?.medicines) {
            const parsedMedicines = jsonRes.data.medicines;
            console.log("[VOICE AI PRESCRIPTION] Parsed JSON Medicines:", JSON.stringify(parsedMedicines));
            
            if (!Array.isArray(parsedMedicines) || parsedMedicines.length === 0) {
              throw new Error("AI returned an empty medicines array. Please speak again clearly.");
            }
            
            const formatted = parsedMedicines.map(m => ({
              name: m.name || m.medicineName || m.medicine || "",
              dosage: m.dosage || m.strength || m.dose || "",
              frequency: m.frequency || m.timing || "Once a day",
              reminder_time: m.reminder_time || (m.times && m.times.length > 0 ? m.times.join(', ') : ""),
              duration: m.duration || "5 Days",
              notes: m.notes || m.instructions || ""
            }));

            // Execute state update immediately
            setMeds(formatted);
            showToast("AI dictation successfully populated into table!", "success");
            setAiMode('manual');
          } else {
            throw new Error(jsonRes.message || "No medicines could be structured from your voice instructions.");
          }
        } catch (err) {
          showToast(`Voice AI parsing failed: ${err.message}`, "error");
          console.error("[VOICE AI PRESCRIPTION ERROR]:", err.message);
        }
      } else {
        showToast("No voice input captured. Please speak again.", "warning");
      }
    };

    rec.start();
    setRecognition(rec);
    setIsRecording(true);
    setVoiceTranscript('');
    showToast("Microphone active. Start dictating medicines...", "info");
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  // Vision OCR scan triggers
  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const setMedicines = setMeds; // Setter alias (Requirement 7)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      setOcrScanning(true);
      showToast("Analyzing handwritten prescription via Gemini Vision...", "info");
      
      try {
        const res = await fetch('/api/ocr-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, mimeType: 'image/png' })
        });
        const ocrData = await res.json();
        if (ocrData.success && ocrData.data?.medicines) {
          const parsed = ocrData.data;
          const mapped = parsed.medicines.map(m => ({
            name: m.name || '',
            dosage: m.dosage || m.strength || '',
            frequency: m.frequency || 'Once a day',
            reminder_time: m.reminder_time || (m.times && m.times.length > 0 ? m.times.join(', ') : ''),
            duration: m.duration || '5 Days',
            notes: m.notes || m.instructions || ''
          }));
          setMedicines(mapped); // Set parsed list (Requirement 7)
          showToast("OCR prescription scan successfully completed!", "success");
          setAiMode('manual');
        } else {
          throw new Error("Could not parse structured medicines array.");
        }
      } catch (err) {
        showToast(`OCR Scan Failed: ${err.message}`, "error");
        setMedicines([]); // Clear to avoid hardcoded default medicines! (Requirement 9)
      } finally {
        setOcrScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedRow = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: 'Once a day', reminder_time: '', duration: '5 Days', notes: '' }]);
  };

  const handleRemoveMedRow = (idx) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx, field, val) => {
    const updated = meds.map((med, i) => {
      if (i === idx) {
        return { ...med, [field]: val };
      }
      return med;
    });
    setMeds(updated);
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    console.log("[PRESCRIPTION PRE-SAVE] Current medicines state before submit:", JSON.stringify(meds));
    if (!selectedPatientId || meds.length === 0) {
      showToast("Please choose a patient and add medicines.", "warning");
      return;
    }
    
    try {
      setSubmitting(true);
      const patientObj = patients.find(p => p.id === selectedPatientId);
      const patientName = patientObj ? (patientObj.full_name || patientObj.name) : 'Unknown';

      const payload = {
        patient_id: selectedPatientId,
        patient_name: patientName,
        doctor_name: doctorName,
        medicines: meds,
        created_date: new Date().toISOString()
      };

      // 1. Create prescription
      const res = await createEntity('Prescription', payload);
      if (!res.success) throw new Error(res.message);

      // 2. Automatic reminder generation is handled dynamically inside createEntity('Prescription')
      // in the database service layer (api.js) to keep creation, updates, and deletions fully synchronized.

      // 3. Automatically calculate billing invoice
      const medicineCost = meds.length * 120;
      const consultationFee = 500;
      const baseTotal = medicineCost + consultationFee;
      const totalAmount = Math.round(baseTotal * 1.18); // base + 18% GST

      await createEntity('Invoice', {
        patient_id: selectedPatientId,
        patient_name: patientName,
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: totalAmount,
        status: 'Unpaid',
        due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

      showToast("Prescription issued, medicine reminders saved, and invoice generated!", "success");
      setIsModalOpen(false);
      
      // Reset forms
      setSelectedPatientId('');
      setMeds([]);
      fetchERPData();
    } catch (err) {
      showToast(`Submission failed: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Grouping prescriptions by Patient using React useMemo (Requirement 13)
  const EMRRecords = useMemo(() => {
    const groups = {};

    // Sort all prescriptions in descending order (Requirement 4)
    const sortedPresc = [...prescriptions].sort((a, b) => {
      const dateA = a.created_date || a.created_at || '';
      const dateB = b.created_date || b.created_at || '';
      return dateB.localeCompare(dateA);
    });

    sortedPresc.forEach(p => {
      const key = p.patient_id || p.patient_name || 'unknown';
      if (!groups[key]) {
        const profile = patients.find(pat => pat.id === p.patient_id || pat.patient_id === p.patient_id || pat.full_name === p.patient_name) || {};
        
        groups[key] = {
          patientId: p.patient_id,
          patientName: p.patient_name || profile.full_name || profile.name || 'Unknown Patient',
          age: profile.age || 24,
          gender: profile.gender || 'Male',
          bloodGroup: profile.blood_group || 'O+',
          phone: profile.phone || '9876543210',
          allergies: profile.allergies || 'None Known',
          lastVisitDate: p.created_date || p.created_at,
          currentDoctor: p.doctor_name,
          totalVisits: 0,
          prescriptions: [],
          allMedicines: []
        };
      }

      groups[key].totalVisits += 1;
      groups[key].prescriptions.push(p);

      if (Array.isArray(p.medicines)) {
        p.medicines.forEach(m => {
          groups[key].allMedicines.push({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            date: p.created_date || p.created_at
          });
        });
      }
    });

    return Object.values(groups);
  }, [prescriptions, patients]);

  // Compile timeline events dynamically
  const getTimelineForPatient = (patientName) => {
    const list = [];
    appointments.filter(a => a.patient_name === patientName).forEach(a => {
      list.push({ type: 'Appointment', title: `Appointment: ${a.treatment_type || 'General Consultation'}`, date: a.appointment_date || a.created_at });
    });
    consultations.filter(c => c.patient_name === patientName).forEach(c => {
      list.push({ type: 'Consultation', title: `Consultation: ${c.diagnosis || 'Diagnosis'}`, date: c.created_at });
    });
    treatments.filter(t => t.patient_name === patientName).forEach(t => {
      list.push({ type: 'Treatment', title: `Treatment: ${t.treatment_name}`, date: t.created_at });
    });
    prescriptions.filter(p => p.patient_name === patientName).forEach(p => {
      list.push({ type: 'Prescription', title: `Prescription issued`, date: p.created_date || p.created_at });
    });

    return list.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  };

  // Compile specific medicine checkups
  const getMedicineHistory = (patient) => {
    const medHist = {};
    patient.allMedicines.forEach(m => {
      const name = m.name;
      if (!medHist[name]) {
        medHist[name] = [];
      }
      medHist[name].push(new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    });
    return Object.entries(medHist);
  };

  // Generate automated AI insights badges
  const getAIInsights = (patient) => {
    const badges = [];

    // Returning patient status
    if (patient.totalVisits > 1) {
      badges.push({ text: "Returning Patient", type: "returning", icon: "⭐" });
    }

    // Gap analysis since last visit
    const lastVisitDate = new Date(patient.lastVisitDate);
    const diffTime = Math.abs(new Date() - lastVisitDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      badges.push({ text: "Latest Visit", type: "latest", icon: "🟢" });
    } else if (diffDays > 30) {
      badges.push({ text: "Long Gap Since Last Visit", type: "gap", icon: "⚠" });
    }

    // Allergy audit
    if (patient.allergies && patient.allergies !== 'None Known') {
      const latestPresc = patient.prescriptions[0];
      if (latestPresc && Array.isArray(latestPresc.medicines)) {
        const names = latestPresc.medicines.map(m => m.name.toLowerCase());
        const allergStr = patient.allergies.toLowerCase();
        
        names.forEach(name => {
          if (allergStr.includes(name) || (name.includes('amoxicillin') && allergStr.includes('penicillin'))) {
            badges.push({ text: `Allergy Warning: ${name}`, type: "allergy", icon: "⚠" });
          }
        });
      }
    }

    // Duplicate check
    const latestPresc = patient.prescriptions[0];
    if (latestPresc && Array.isArray(latestPresc.medicines)) {
      const names = latestPresc.medicines.map(m => m.name.toLowerCase());
      const isMultipleNsaids = names.filter(n => n.includes('paracetamol') || n.includes('ibuprofen') || n.includes('brufen') || n.includes('dolo')).length > 1;
      if (isMultipleNsaids) {
        badges.push({ text: "Duplicate NSAID Painkillers", type: "duplicate", icon: "⚠" });
      }
    }

    // Frequently prescribed medicine (if matches count > 2)
    const medCounts = {};
    patient.allMedicines.forEach(m => {
      const name = m.name.toLowerCase();
      medCounts[name] = (medCounts[name] || 0) + 1;
    });
    const frequentlyPrescribed = Object.keys(medCounts).filter(k => medCounts[k] > 2);
    if (frequentlyPrescribed.length > 0) {
      badges.push({ text: `Frequently Prescribed: ${frequentlyPrescribed[0]}`, type: "frequent", icon: "⚠" });
    }

    return badges;
  };

  // Searching and Filtering Logics
  const processedEMR = useMemo(() => {
    let result = [...EMRRecords];

    // Search query: patient name, doctor, medicine, or date
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(patient => {
        const matchesName = patient.patientName.toLowerCase().includes(q);
        const matchesDoctor = patient.prescriptions.some(p => p.doctor_name.toLowerCase().includes(q));
        const matchesMed = patient.allMedicines.some(m => m.name.toLowerCase().includes(q));
        const matchesDate = patient.prescriptions.some(p => {
          const dateStr = new Date(p.created_date || p.created_at).toLocaleDateString();
          return dateStr.includes(q);
        });
        return matchesName || matchesDoctor || matchesMed || matchesDate;
      });
    }

    // Time filters
    if (filterPeriod !== 'all') {
      const now = new Date();
      result = result.filter(patient => {
        const lastVisit = new Date(patient.lastVisitDate);
        const diffTime = Math.abs(now - lastVisit);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (filterPeriod === 'today') return diffDays <= 1;
        if (filterPeriod === 'week') return diffDays <= 7;
        if (filterPeriod === 'month') return diffDays <= 30;
        return true;
      });
    }

    // Doctor filters
    if (filterDoctor) {
      result = result.filter(patient => patient.currentDoctor === filterDoctor);
    }

    // Medicine filters
    if (filterMedicine.trim()) {
      const medQ = filterMedicine.toLowerCase();
      result = result.filter(patient => 
        patient.allMedicines.some(m => m.name.toLowerCase().includes(medQ))
      );
    }

    // Returning status filters
    if (filterReturning) {
      result = result.filter(patient => patient.totalVisits > 1);
    }

    return result;
  }, [EMRRecords, searchQuery, filterPeriod, filterDoctor, filterMedicine, filterReturning]);

  const toggleExpand = (patientId) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex items-center justify-center shadow-inner">
            <Pill className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Hospital EMR Dashboard</h2>
            <p className="text-xs text-slate-500 mt-1">Sleek patient history, AI safety insights, and visual timelines</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write Prescription</span>
        </button>
      </div>

      {/* Filter and Search Bar Options */}
      <div className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient, Doctor, Medicine or Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Time periods */}
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-655 focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">All Visits Timeframes</option>
            <option value="today">Visited Today</option>
            <option value="week">Visited This Week</option>
            <option value="month">Visited This Month</option>
          </select>

          {/* Doctor Selector */}
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-655 focus:outline-none bg-white cursor-pointer"
          >
            <option value="">Filter by Doctor</option>
            <option value="Dr. Chaitanya">Dr. Chaitanya</option>
            <option value="Dr. Anusha">Dr. Anusha</option>
            <option value="Dr. Vikram">Dr. Vikram</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-50 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={filterReturning}
                onChange={(e) => setFilterReturning(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Returning Patients Only</span>
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter by drug name..."
              value={filterMedicine}
              onChange={(e) => setFilterMedicine(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main EMR grouped cards list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : processedEMR.length === 0 ? (
        <div className="bg-white p-12 text-center border border-blue-50 rounded-2xl shadow-sm text-xs text-slate-500">
          No matching EMR records found.
        </div>
      ) : (
        <div className="space-y-4">
          {processedEMR.map((record) => {
            const isExpanded = expandedPatients[record.patientId || record.patientName];
            const insights = getAIInsights(record);
            const latestPresc = record.prescriptions[0]; // newest is first
            const medHistory = getMedicineHistory(record);
            const timelineEvents = getTimelineForPatient(record.patientName);

            return (
              <div 
                key={record.patientId || record.patientName} 
                className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Collapsed view header summary */}
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  
                  {/* Patient profile basics */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100 shadow-inner shrink-0">
                      {record.patientName?.[0] || 'P'}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-slate-805 text-base leading-tight">{record.patientName}</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Age: {record.age}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Blood Group: {record.bloodGroup}</span>
                      </div>
                      
                      <div className="text-xs text-slate-450 font-medium">
                        <span>Gender: {record.gender}</span>
                        <span className="mx-2">•</span>
                        <span>Phone: {record.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary visit indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold md:border-l border-slate-100 pl-0 md:pl-6 flex-1 max-w-xl text-left">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Last Visit</span>
                      <span className="text-slate-800 font-bold">{new Date(record.lastVisitDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Doctor</span>
                      <span className="text-blue-700 font-bold">{record.currentDoctor}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Visits</span>
                      <span className="text-slate-800 font-bold">{record.totalVisits}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Unique Drugs</span>
                      <span className="text-slate-850 font-bold">{record.allMedicines.length}</span>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button 
                    onClick={() => toggleExpand(record.patientId || record.patientName)}
                    className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer select-none shrink-0"
                  >
                    <span>{isExpanded ? 'Collapse EMR' : 'View Full History'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* AI Insights badges list */}
                <div className="px-6 pb-4 flex flex-wrap items-center gap-2 border-b border-slate-50">
                  {insights.map((ins, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${
                        ins.type === 'latest' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        ins.type === 'allergy' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        ins.type === 'duplicate' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        ins.type === 'returning' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}
                    >
                      <span>{ins.icon}</span>
                      <span>{ins.text}</span>
                    </span>
                  ))}

                  {/* Latest prescription medicines chip list */}
                  {latestPresc && Array.isArray(latestPresc.medicines) && (
                    <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                      <span className="text-[10px] text-slate-400 font-bold">Latest Medicines:</span>
                      {latestPresc.medicines.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50/50 border border-blue-100 rounded text-[9px] font-bold text-blue-655">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded Detailed history container */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-xs">
                    
                    {/* Left 4 columns: Timeline */}
                    <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-blue-50/60 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>EMR Patient Timeline</span>
                      </h4>
                      
                      <div className="relative pl-5 border-l border-slate-200 ml-2 space-y-4 py-1 text-left">
                        {timelineEvents.map((ev, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
                            <span className="text-[9px] text-slate-400 block font-bold">{new Date(ev.date).toLocaleDateString()}</span>
                            <span className="font-semibold text-slate-800 leading-normal block">{ev.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle 4 columns: Medicine history tracker */}
                    <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-blue-50/60 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span>Medicine History Tracker</span>
                      </h4>
                      
                      {medHistory.length === 0 ? (
                        <p className="text-slate-450 italic p-2">No past medications cataloged.</p>
                      ) : (
                        <div className="space-y-3">
                          {medHistory.map(([name, dates], i) => (
                            <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                              <span className="font-bold text-slate-800">{name}</span>
                              <div className="flex gap-1.5 flex-wrap pt-1 text-[9px] text-slate-450">
                                <span>Prescribed:</span>
                                {dates.map((d, j) => (
                                  <span key={j} className="px-1.5 py-0.2 bg-white border border-slate-200/50 rounded font-bold">{d}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right 4 columns: Prescriptions Archive list */}
                    <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-blue-50/60 shadow-sm space-y-4 max-h-[380px] overflow-y-auto">
                      <h4 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Prescriptions Ledger</span>
                      </h4>

                      <div className="space-y-3">
                        {record.prescriptions.map((presc) => (
                          <div key={presc.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-100 pb-1.5">
                              <span>Dr. {presc.doctor_name}</span>
                              <span>{new Date(presc.created_date || presc.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="space-y-1 font-semibold">
                              {Array.isArray(presc.medicines) ? (
                                presc.medicines.map((m, i) => (
                                  <div key={i} className="flex justify-between text-slate-700">
                                    <span>• {m.name}</span>
                                    <span className="text-[10px] text-slate-450">{m.dosage}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="italic text-slate-400">{presc.medicines}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-650 animate-pulse" />
                <h3 className="font-bold text-slate-850 text-base">Write Clinical Prescription</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Patient and general settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Patient</label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Choose patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Prescribing Doctor</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Dr. Chaitanya">Dr. Chaitanya</option>
                    <option value="Dr. Anusha">Dr. Anusha</option>
                    <option value="Dr. Vikram">Dr. Vikram</option>
                  </select>
                </div>
              </div>

              {/* ERP Assistant mode controls */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  onClick={() => setAiMode('manual')}
                  className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${aiMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Standard Form
                </button>
                <button
                  onClick={() => setAiMode('voice')}
                  className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${aiMode === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice AI Dictation</span>
                </button>
                <button
                  onClick={() => setAiMode('ocr')}
                  className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${aiMode === 'ocr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>OCR Vision Upload</span>
                </button>
              </div>

              {/* Drug interaction notifications */}
              {drugWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
                    <span>AI Drug Safety Audit:</span>
                  </div>
                  <ul className="list-disc pl-5 font-medium space-y-1 mt-1">
                    {drugWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Mode-specific panels */}
              {aiMode === 'voice' && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-5 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${isRecording
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-blue-600 text-white hover:bg-blue-750'
                        }`}
                    >
                      {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">
                      {isRecording ? 'Listening to transcription...' : 'Click mic to dictate'}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1 max-w-md mx-auto leading-relaxed">
                      Say the medicines clearly. Gemini parses details like "Prescribe Paracetamol 500mg twice a day for 5 days after food."
                    </p>
                  </div>
                  {voiceTranscript && (
                    <div className="p-3 bg-white border border-slate-150 rounded-xl text-left text-xs font-semibold text-slate-655 max-h-24 overflow-y-auto">
                      {voiceTranscript}
                    </div>
                  )}
                </div>
              )}

              {aiMode === 'ocr' && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
                  {ocrScanning ? (
                    <div className="py-8 space-y-2">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Gemini Vision is scanning handwriting layers...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white/70 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 transition-all flex flex-col items-center justify-center cursor-pointer relative py-8">
                        <Image className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-705">Upload handwritten prescription image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOcrUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-slate-450 max-w-sm mx-auto leading-relaxed">
                        Drag and drop a clear snapshot of paper prescriptions. The AI extracts chemical formulas, doses, and schedules directly.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Grid Form list (Editable Table) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Medicines Sheet</span>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500">
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Strength</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Reminder Time</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Instructions</th>
                        <th className="p-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-655 bg-white">
                      {meds.map((med, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Paracetamol"
                              value={med.name}
                              onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 500mg"
                              value={med.dosage}
                              onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={med.frequency}
                              onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-205 text-xs bg-slate-50/30 focus:outline-none"
                            >
                              <option value="Once a day">Once a day</option>
                              <option value="Twice daily">Twice daily</option>
                              <option value="Thrice a day">Thrice a day</option>
                              <option value="As needed">As needed</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. 09:00 AM, 09:00 PM"
                              value={med.reminder_time || ''}
                              onChange={(e) => handleMedChange(idx, 'reminder_time', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 5 Days"
                              value={med.duration}
                              onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. After food"
                              value={med.notes}
                              onChange={(e) => handleMedChange(idx, 'notes', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedRow(idx)}
                              disabled={meds.length === 1}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Invoice calculates automatically upon submission.</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-655 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrescription}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Issuing Prescription...' : 'Approve & Issue Prescription'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
