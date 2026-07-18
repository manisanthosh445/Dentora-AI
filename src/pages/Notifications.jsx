import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Mail, MessageSquare, ShieldAlert, 
  Check, RefreshCw, Eye, EyeOff, X, Plus, Pill, 
  Calendar, Clock, Receipt, Sparkles, Trash2, 
  Search, AlertCircle, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import { listEntity, createEntity, updateEntity, deleteEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Notifications() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [medicineReminders, setMedicineReminders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Send Alert Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [channel, setChannel] = useState('SMS');
  const [alertType, setAlertType] = useState('Medicine Reminder');
  const [messageText, setMessageText] = useState('Dear Patient, this is a reminder for your upcoming dental consultation at Chaitanya Care Dental.');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Selected patient reminder schedule editing state
  const [medicineSchedule, setMedicineSchedule] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  // Fallback dev mock data
  const defaultLogs = [
    { id: '1', recipient_name: 'Rahul Sharma', channel: 'SMS', type: 'Appointment Reminder', message: 'Dear Rahul Sharma, your appointment with Dr. Chaitanya is scheduled for tomorrow at 10:30 AM.', status: 'Sent', sent_date: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', recipient_name: 'Priya Patel', channel: 'Email', type: 'Invoice Paid Receipt', message: 'Dear Priya Patel, thank you for your payment of INR 2000.00 for treatment invoice INV-255010.', status: 'Read', sent_date: new Date(Date.now() - 7200000).toISOString() }
  ];

  const defaultMedicineReminders = [
    { id: 'rem-1', patientId: '1', medicineName: 'Amoxicillin', dosage: '500mg', instructions: 'After Food', reminderTime: '08:00 AM', startDate: '2026-07-18', endDate: '2026-07-23', status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'rem-2', patientId: '1', medicineName: 'Amoxicillin', dosage: '500mg', instructions: 'After Food', reminderTime: '08:00 PM', startDate: '2026-07-18', endDate: '2026-07-23', status: 'Sent', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const getAutoTimesForFrequency = (frequency) => {
    const f = (frequency || '').toLowerCase();
    if (f.includes('four') || f.includes('4 times') || f.includes('qds') || f.includes('four times daily')) {
      return ['06:00 AM', '12:00 PM', '06:00 PM', '10:00 PM'];
    }
    if (f.includes('three') || f.includes('thrice') || f.includes('3 times') || f.includes('tds') || f.includes('three times daily')) {
      return ['08:00 AM', '02:00 PM', '08:00 PM'];
    }
    if (f.includes('two') || f.includes('twice') || f.includes('2 times') || f.includes('bd') || f.includes('twice daily')) {
      return ['08:00 AM', '08:00 PM'];
    }
    if (f.includes('once') || f.includes('1 time') || f.includes('od') || f.includes('once daily')) {
      return ['08:00 AM'];
    }
    return ['08:00 AM'];
  };

  const generateSMSBody = (patientName, doctorName, medicines) => {
    if (!medicines || medicines.length === 0) {
      return `Dear ${patientName}, this is a reminder from Chaitanya Care Dental.`;
    }
    
    if (medicines.length === 1) {
      const med = medicines[0];
      return `Dear ${patientName},

This is a reminder to take:

${med.medicineName} ${med.dosage || ''}

Dose:
${med.dose || '1 Tablet'}

Instructions:
${med.instructions || 'After Food'}

Prescribed by ${doctorName || 'Dr. Chaitanya'}

- Chaitanya Care Dental`;
    }

    // Multiple medicines
    let body = `Dear ${patientName},

Medicine Reminder

`;

    medicines.forEach((med, idx) => {
      body += `${idx + 1}. ${med.medicineName} ${med.dosage || ''}\nDose: ${med.dose || '1 Tablet'}\n\n`;
    });

    body += `Please take as prescribed.\n\n- Chaitanya Care Dental`;
    return body;
  };

  const fetchAllData = async () => {
    try {
      setError(null);
      console.log("[Notifications Center] Fetching database entities...");

      const logRes = await listEntity('NotificationLog');
      const patRes = await listEntity('Patient');
      const prescRes = await listEntity('Prescription');
      const medRemRes = await listEntity('MedicineReminder');

      if (logRes.success && patRes.success && prescRes.success && medRemRes.success) {
        setLogs(logRes.data || []);
        setPatients(patRes.data || []);
        setPrescriptions(prescRes.data || []);
        setMedicineReminders(medRemRes.data || []);
      } else {
        const errorMsg = logRes.message || patRes.message || prescRes.message || medRemRes.message || "Failed to load database entities";
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.warn("[Notifications Center] API error, loading fallbacks:", err.message);
      setError(err.message || "Failed to establish database connection.");
      
      setLogs(defaultLogs);
      setMedicineReminders(defaultMedicineReminders);
      setPatients([
        { id: '1', full_name: 'Rahul Sharma', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@gmail.com' },
        { id: '2', full_name: 'Priya Patel', name: 'Priya Patel', phone: '9812345678', email: 'priya@gmail.com' },
        { id: '3', full_name: 'Amit Verma', name: 'Amit Verma', phone: '', email: '' }
      ]);
      setPrescriptions([
        { id: 'p1', patient_id: '1', patient_name: 'Rahul Sharma', doctor_name: 'Dr. Chaitanya', medication_name: 'Amoxicillin', dosage: '500mg', frequency: 'Three Times Daily', duration: '5 Days', notes: 'After Food', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllData();

    // 30-seconds auto-refresh loop
    const pollingInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(pollingInterval);
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handlePatientChange = (patientId) => {
    setSelectedPatientId(patientId);
    setSelectedPrescriptionId('');
    
    const patientObj = patients.find(p => p.id === patientId);
    if (!patientId) {
      setMedicineSchedule([]);
      setMessageText('Dear Patient, this is a reminder for your upcoming dental consultation at Chaitanya Care Dental.');
      return;
    }

    // Load prescriptions for selected patient (matches patient_id or patient_name)
    const patientPrescs = prescriptions.filter(p => 
      p.patient_id === patientId || p.patient_name === (patientObj?.full_name || patientObj?.name)
    );

    if (patientPrescs.length === 0) {
      setMedicineSchedule([]);
      setMessageText(`Dear ${patientObj?.full_name || patientObj?.name || 'Patient'}, thank you for choosing Chaitanya Care Dental.`);
      return;
    }

    // Find the latest prescription session based on timestamp
    const latestTime = patientPrescs.reduce((max, p) => {
      const t = new Date(p.created_at || p.created_date || 0).getTime();
      return t > max ? t : max;
    }, 0);

    const latestRows = patientPrescs.filter(p => {
      const t = new Date(p.created_at || p.created_date || 0).getTime();
      return Math.abs(t - latestTime) < 5000;
    });

    console.log("[Notifications Sync] Patient selected, loaded medicines:", latestRows);

    // Auto set the prescription ID
    if (latestRows.length > 0) {
      setSelectedPrescriptionId(latestRows[0].id);
    }

    // Map rows to the editable MedicineReminder Schedule
    const initialSchedule = latestRows.map(row => {
      const durationDays = parseInt(row.duration) || 5;
      const freq = row.frequency || 'Once Daily';
      const autoTimes = getAutoTimesForFrequency(freq);
      
      return {
        medicineName: row.medication_name || row.medicine || '',
        dosage: row.dosage || '',
        dose: '1 Tablet',
        reminderTimes: autoTimes.join(', '),
        durationDays: durationDays,
        instructions: row.notes || row.instructions || 'After Food',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * durationDays).toISOString().split('T')[0]
      };
    });

    setMedicineSchedule(initialSchedule);

    // Auto generate clean SMS body
    const doctorName = latestRows[0]?.doctor_name || 'Dr. Chaitanya';
    const text = generateSMSBody(patientObj?.full_name || patientObj?.name || 'Patient', doctorName, initialSchedule);
    setMessageText(text);
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...medicineSchedule];
    updated[index] = { ...updated[index], [field]: value };
    
    // Automatically recalculate end date if startDate or durationDays changes
    if (field === 'startDate' || field === 'durationDays') {
      const days = parseInt(updated[index].durationDays) || 5;
      const start = new Date(updated[index].startDate || Date.now());
      const end = new Date(start.getTime() + 86400000 * days);
      updated[index].endDate = end.toISOString().split('T')[0];
    }

    setMedicineSchedule(updated);

    // Regenerate SMS body
    const patientObj = patients.find(p => p.id === selectedPatientId);
    const doctorName = prescriptions.find(p => p.id === selectedPrescriptionId)?.doctor_name || 'Dr. Chaitanya';
    const text = generateSMSBody(patientObj?.full_name || patientObj?.name || 'Patient', doctorName, updated);
    setMessageText(text);
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    
    try {
      setSending(true);
      const patientObj = patients.find(p => p.id === selectedPatientId);
      const patientName = patientObj ? (patientObj.full_name || patientObj.name) : 'Unknown';

      // 1. Save scheduled reminders in medicine_reminders table
      for (const med of medicineSchedule) {
        const times = med.reminderTimes.split(',').map(t => t.trim()).filter(Boolean);
        for (const time of times) {
          const reminderPayload = {
            patientId: selectedPatientId,
            prescriptionId: selectedPrescriptionId || 'manual',
            medicineName: med.medicineName,
            dosage: med.dosage,
            instructions: med.instructions,
            reminderTime: time,
            startDate: med.startDate,
            endDate: med.endDate,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const remRes = await createEntity('MedicineReminder', reminderPayload);
          if (!remRes.success) {
            console.error("Failed saving medicine reminder:", remRes.message);
          }
        }
      }

      // 2. Queue standard notification log
      const payload = {
        recipient_id: selectedPatientId,
        recipient_name: patientName,
        channel,
        type: alertType,
        message: messageText,
        status: 'Sent',
        sent_date: new Date().toISOString()
      };

      const res = await createEntity('NotificationLog', payload);
      if (res.success) {
        setSendSuccess(true);
        setSelectedPatientId('');
        setMedicineSchedule([]);
        setMessageText('Dear Patient, this is a reminder for your upcoming dental consultation at Chaitanya Care Dental.');
        
        showToast('Reminder schedule saved and SMS alert queued successfully!', 'success');
        await fetchAllData();
        setTimeout(() => setSendSuccess(false), 4000);
      } else {
        showToast(`Failed to save reminders: ${res.message}`, 'error');
      }
    } catch (err) {
      showToast(`Error dispatching alert: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine reminder?")) return;
    try {
      const res = await deleteEntity('MedicineReminder', id);
      if (res.success) {
        setMedicineReminders(prev => prev.filter(r => r.id !== id));
        showToast('Medicine reminder slot deleted successfully.', 'success');
      } else {
        showToast('Failed to delete reminder slot.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`Error deleting reminder: ${err.message}`, 'error');
    }
  };

  // Filtered medicine reminders for history log
  const filteredMedicineReminders = medicineReminders.filter(rem => {
    const patientName = (rem.patientName || patients.find(p => p.id === rem.patientId)?.full_name || '').toLowerCase();
    const medicine = (rem.medicineName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = patientName.includes(query) || medicine.includes(query);
    const matchesStatus = historyStatusFilter === 'All' || rem.status === historyStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Bell className="w-6 h-6 animate-pulse-once" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500 mt-1">
              Automated medicine reminders and patient alert notifications center.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl shadow-sm transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Dashboard</span>
        </button>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start justify-between gap-3 text-left">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-800">Backend Connection Error</h4>
              <p className="text-xs text-rose-650 mt-1 leading-relaxed">{error}</p>
              <p className="text-[10px] text-slate-400 mt-2">Running with local fallbacks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Send Alert form - Column 1 */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm h-fit space-y-4 text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Alert Dispatch Center</h3>
          </div>
          
          {sendSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>Reminder Schedule saved and SMS queued successfully!</span>
            </div>
          )}

          <form onSubmit={handleSendAlert} className="space-y-4">
            
            {/* Recipient Patient */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recipient Patient</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => handlePatientChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Choose Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
                ))}
              </select>
              
              {/* Display phone / email info and warnings */}
              {selectedPatient && (
                <div className="space-y-1.5 mt-1">
                  {(!selectedPatient.phone && !selectedPatient.email) ? (
                    <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>No contact information available for this patient.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.phone && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          SMS: Prepared ({selectedPatient.phone})
                        </span>
                      )}
                      {selectedPatient.email && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          Email: Prepared ({selectedPatient.email})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medicine Reminder Schedule Section */}
            {selectedPatient && medicineSchedule.length > 0 && (
              <div className="space-y-3.5 p-4 bg-slate-50/50 border border-slate-150 rounded-xl animate-fade-in text-xs">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Medicine Reminder Schedule</span>
                </div>
                
                {medicineSchedule.map((med, index) => (
                  <div key={index} className="space-y-2 pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                    <div className="font-bold text-slate-800">{med.medicineName} {med.dosage}</div>
                    
                    {/* Dose input */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold">Dose:</span>
                      <input 
                        type="text" 
                        value={med.dose} 
                        onChange={(e) => handleScheduleChange(index, 'dose', e.target.value)} 
                        className="col-span-2 px-2 py-1 rounded border border-slate-250 bg-white text-xs" 
                      />
                    </div>

                    {/* Reminder times input */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold">Reminder Times:</span>
                      <input 
                        type="text" 
                        value={med.reminderTimes} 
                        onChange={(e) => handleScheduleChange(index, 'reminderTimes', e.target.value)} 
                        className="col-span-2 px-2 py-1 rounded border border-slate-250 bg-white text-xs" 
                      />
                    </div>

                    {/* Start Date */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold">Start Date:</span>
                      <input 
                        type="date" 
                        value={med.startDate} 
                        onChange={(e) => handleScheduleChange(index, 'startDate', e.target.value)} 
                        className="col-span-2 px-2 py-1 rounded border border-slate-250 bg-white text-xs" 
                      />
                    </div>

                    {/* End Date */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold">End Date:</span>
                      <input 
                        type="date" 
                        value={med.endDate} 
                        onChange={(e) => handleScheduleChange(index, 'endDate', e.target.value)} 
                        className="col-span-2 px-2 py-1 rounded border border-slate-250 bg-white text-xs" 
                      />
                    </div>

                    {/* Instructions display */}
                    <div className="text-[10px] text-slate-500">
                      <span className="font-bold text-slate-600">Instructions: </span>
                      {med.instructions}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Channel selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dispatch Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="SMS">SMS Message (Mobile Msg)</option>
                <option value="Email">Email Message</option>
              </select>
            </div>

            {/* Alert Type selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alert Category / Type</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Medicine Reminder">Medicine Reminder</option>
                <option value="Appointment Reminder">Appointment Reminder</option>
                <option value="Billing Invoice Summary">Billing Invoice Summary</option>
                <option value="Follow-up Call">Follow-up Call</option>
              </select>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">SMS/Email Body</label>
              <textarea
                rows={5}
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none font-medium text-slate-700 bg-slate-50/30"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>SMS segments: {Math.ceil(messageText.length / 160)}</span>
                <span>{messageText.length} chars</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || !selectedPatientId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Processing...' : 'Send Notification Alert'}</span>
            </button>
          </form>
        </div>

        {/* History log - Column 2 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm overflow-hidden flex flex-col h-[750px] text-left">
          
          {/* Section title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Medicine Reminder Logs</h3>
          </div>

          {/* Search and Status Filters */}
          <div className="space-y-3.5 mb-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by patient name, medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'Pending', 'Sent', 'Failed'].map((status) => {
                const count = medicineReminders.filter(rem => status === 'All' || rem.status === status).length;
                const isSelected = historyStatusFilter === status;
                
                return (
                  <button
                    key={status}
                    onClick={() => setHistoryStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-650 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{status === 'All' ? 'All Reminders' : `${status} status`}</span>
                    <span className={`ml-1.5 px-1 py-0.2 rounded-full text-[9px] ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/60 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Reminders Table Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-semibold">Loading reminder history...</p>
              </div>
            ) : filteredMedicineReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <div className="p-3 bg-slate-50 rounded-full text-slate-400 mb-3">
                  <Bell className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No notifications available yet</h4>
                <p className="text-xs text-slate-450 mt-1 max-w-sm">
                  Scheduled medicine reminders and alert dispatches will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wide">
                      <th className="p-3">Reminder Time</th>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Delivery Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMedicineReminders.map(rem => {
                      const patientName = rem.patientName || patients.find(p => p.id === rem.patientId)?.full_name || 'Patient';
                      
                      // Format the delivery time beautifully if Sent
                      const deliveryTime = (rem.status === 'Sent' || rem.status === 'Failed')
                        ? (rem.updatedAt ? new Date(rem.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A')
                        : 'N/A';
                      
                      return (
                        <tr key={rem.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3 font-semibold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {rem.reminderTime}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {rem.medicineName} {rem.dosage ? `(${rem.dosage})` : ''}
                          </td>
                          <td className="p-3 text-slate-600 font-semibold">{patientName}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                              rem.status === 'Sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              rem.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {rem.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-semibold">{deliveryTime}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Reminder Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
