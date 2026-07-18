import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Calendar, Pill, Receipt, ShieldAlert, Sparkles, Check, Clock, 
  ArrowRight, Phone, Mail, Plus, X, CalendarDays, Bell, LogOut, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { listEntity, createEntity, updateEntity, deleteEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function PatientPortal() {
  const { showToast } = useToast();
  
  // Navigation tab inside mobile app frame
  const [activeTab, setActiveTab] = useState('home'); // home, reminders, appointments, records
  
  // Supabase stores
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00 AM');
  const [bookDoctor, setBookDoctor] = useState('Dr. Chaitanya');
  const [bookTreatment, setBookTreatment] = useState('General Checkup');
  const [submitting, setSubmitting] = useState(false);

  const patientName = 'Rahul Sharma';

  const fetchPatientRecords = async () => {
    try {
      setLoading(true);
      const apptsRes = await listEntity('Appointment');
      const prescsRes = await listEntity('Prescription');
      const billingRes = await listEntity('Invoice');
      const remindersRes = await listEntity('Reminder');

      if (apptsRes.success) {
        setAppointments(apptsRes.data.filter(a => a.patient_name === patientName || a.patient_id === '1') || []);
      }
      if (prescsRes.success) {
        setPrescriptions(prescsRes.data.filter(p => p.patient_name === patientName || p.patient_id === '1') || []);
      }
      if (billingRes.success) {
        setBills(billingRes.data.filter(b => b.patient_name === patientName || b.patient_id === '1') || []);
      }
      if (remindersRes.success) {
        setReminders(remindersRes.data.filter(r => r.patient_name === patientName || r.patient_id === '1') || []);
      }
    } catch (err) {
      console.warn("Failed loading patient EMR details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientRecords();
  }, []);

  // Request browser notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Dynamic status evaluation (Requirement 18 & 19)
  const processedReminders = useMemo(() => {
    const now = new Date();
    
    return reminders.map(r => {
      // Retain Completed, Optional, or manually marked statuses
      if (r.status === 'Completed' || r.status === 'Optional') {
        return r;
      }

      // Parse time components (e.g. "09:00 AM" or "10:30 PM")
      const match = r.reminder_time ? r.reminder_time.match(/(\d+):(\d+)\s*(AM|PM)/i) : null;
      if (!match) {
        return r;
      }

      let hrs = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const isPm = match[3].toUpperCase() === 'PM';
      if (isPm && hrs < 12) hrs += 12;
      if (!isPm && hrs === 12) hrs = 0;

      const scheduledDate = new Date(r.scheduled_date || new Date().toISOString().split('T')[0]);
      scheduledDate.setHours(hrs, mins, 0, 0);

      const diffMinutes = (now - scheduledDate) / 60000;

      let evaluatedStatus = r.status;
      if (diffMinutes >= 60) {
        evaluatedStatus = 'Missed';
      } else if (diffMinutes >= 0) {
        evaluatedStatus = 'Pending';
      } else {
        evaluatedStatus = 'Upcoming';
      }

      // Update in Supabase if status changed
      if (evaluatedStatus !== r.status) {
        updateEntity('Reminder', r.id, { status: evaluatedStatus });
      }

      return { ...r, status: evaluatedStatus };
    });
  }, [reminders]);

  // Background Minute Checker (Requirement 24)
  useEffect(() => {
    const checkScheduleClock = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const currentTimeStr = `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;

      processedReminders.forEach(r => {
        if (r.status === 'Pending' && r.scheduled_date === currentDate && r.reminder_time === currentTimeStr) {
          triggerLiveNotification(r);
        }
      });
    }, 60000); // 1 minute

    return () => clearInterval(checkScheduleClock);
  }, [processedReminders]);

  const triggerLiveNotification = (reminder) => {
    const title = `💊 Medicine Time`;
    const message = `Take ${reminder.medicine_name} ${reminder.dosage || ''} (${reminder.instructions || 'After Food'}). Doctor: ${reminder.doctor_name || 'Dr. Chaitanya'}`;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    } else {
      // In-app popup fallback (Requirement 22)
      showToast(`${title}: ${message}`, "info");
    }
  };

  // Mark medicine as Taken (Requirement 20)
  const handleMarkAsTaken = async (reminderId) => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const res = await updateEntity('Reminder', reminderId, {
        status: 'Completed',
        taken_time: timeStr
      });

      if (res.success) {
        showToast("Medicine logged as taken!", "success");
        // Reload list
        fetchPatientRecords();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showToast(`Action failed: ${err.message}`, "error");
    }
  };

  // Calculate consecutive missed doses (Requirement 23)
  const consecutiveMissedDoses = useMemo(() => {
    const pastReminders = [...processedReminders]
      .filter(r => r.status === 'Missed' || r.status === 'Completed')
      .sort((a, b) => {
        const datetimeA = `${a.scheduled_date} ${a.reminder_time}`;
        const datetimeB = `${b.scheduled_date} ${b.reminder_time}`;
        return datetimeB.localeCompare(datetimeA); // Newest first
      });

    let missedCount = 0;
    for (const r of pastReminders) {
      if (r.status === 'Missed') {
        missedCount++;
      } else {
        break; // Stop at first Completed
      }
    }
    return missedCount;
  }, [processedReminders]);

  // Today's Medicines (Requirement 21)
  const todayReminders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return processedReminders.filter(r => r.scheduled_date === todayStr);
  }, [processedReminders]);

  const completedCountToday = useMemo(() => {
    return todayReminders.filter(r => r.status === 'Completed').length;
  }, [todayReminders]);

  const totalCountToday = todayReminders.length;

  // Group today's medicines by timing slots (Morning, Afternoon, Night)
  const todayGrouped = useMemo(() => {
    const groups = { Morning: [], Afternoon: [], Night: [] };
    
    todayReminders.forEach(r => {
      const time = r.reminder_time || '';
      // Map based on hours
      if (time.includes('AM')) {
        const hr = parseInt(time.split(':')[0]);
        if (hr >= 5 && hr < 12) groups.Morning.push(r);
        else groups.Night.push(r); // e.g. 12:00 AM
      } else { // PM
        const hr = parseInt(time.split(':')[0]);
        if (hr === 12 || (hr >= 1 && hr < 4)) groups.Afternoon.push(r);
        else groups.Night.push(r);
      }
    });

    return groups;
  }, [todayReminders]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookDate) return;

    try {
      setSubmitting(true);
      const payload = {
        patient_id: '1',
        patient_name: patientName,
        doctor_name: bookDoctor,
        appointment_date: bookDate,
        appointment_time: bookTime,
        treatment_type: bookTreatment,
        notes: 'Booked via Patient Mobile Web Portal',
        status: 'Scheduled',
        created_at: new Date().toISOString()
      };

      const res = await createEntity('Appointment', payload);
      if (res.success) {
        showToast("Appointment booked successfully!", "success");
        setIsBookingOpen(false);
        fetchPatientRecords();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showToast(`Booking failed: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await deleteEntity('Appointment', apptId);
      if (res.success) {
        showToast("Appointment cancelled successfully.", "info");
        fetchPatientRecords();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showToast(`Cancellation failed: ${err.message}`, "error");
    }
  };

  const handleDownloadPdf = (type, id) => {
    showToast(`Downloading PDF for ${type} #${id}...`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('chaitanya_erp_user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4 text-left font-sans select-none">
      
      {/* Smartphone frame mock wrapper */}
      <div className="w-full max-w-md bg-white min-h-[92vh] sm:rounded-[40px] sm:shadow-2xl sm:border-[10px] sm:border-slate-800 flex flex-col relative overflow-hidden h-screen sm:h-[840px]">
        
        {/* Phone Top Notch */}
        <div className="hidden sm:block h-6 bg-slate-800 text-white relative text-center text-[10px] select-none font-bold py-0.5 z-40">
          <div className="absolute left-6 top-1">09:41</div>
          <div className="w-20 h-4 bg-slate-900 mx-auto rounded-b-xl" />
          <div className="absolute right-6 top-1">📶 🔋</div>
        </div>

        {/* Portal Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-650 p-6 text-white shrink-0 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-350" />
              <h1 className="font-bold text-base">Dentora Mobile Patient</h1>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/35">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{patientName}</h2>
              <span className="text-[10px] text-blue-150 font-bold block mt-0.5">Age: 28 • Blood: O+ (Positive)</span>
            </div>
          </div>
        </header>

        {/* Dynamic content tab body */}
        <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
          
          {/* AI Insights alerts */}
          {consecutiveMissedDoses >= 5 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-rose-950">High Risk Compliance Alert</h4>
                <p className="font-medium mt-0.5">Patient missed {consecutiveMissedDoses} consecutive doses. Recommend clinical follow-up check.</p>
              </div>
            </div>
          )}

          {/* Tab 1: Home */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              {/* Today's progress ring card (Requirement 21) */}
              <div className="p-5 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-150 rounded-2xl flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="16" 
                      fill="none" 
                      stroke="#2563eb" 
                      strokeWidth="3" 
                      strokeDasharray="100" 
                      strokeDashoffset={totalCountToday > 0 ? 100 - (completedCountToday / totalCountToday) * 100 : 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-blue-800">
                    {completedCountToday}/{totalCountToday}
                  </span>
                </div>
                <div className="text-xs">
                  <h3 className="font-bold text-slate-800">Today's Medicines Progress</h3>
                  <p className="text-slate-500 mt-0.5">{completedCountToday} of {totalCountToday} medicines completed today.</p>
                </div>
              </div>

              {/* Today's timing blocks list */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-855 text-xs uppercase tracking-wider">Today's Schedule</h3>
                
                {totalCountToday === 0 ? (
                  <p className="text-xs text-slate-450 italic bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">No pills scheduled for today.</p>
                ) : (
                  <div className="space-y-4">
                    {['Morning', 'Afternoon', 'Night'].map(slot => {
                      const list = todayGrouped[slot];
                      if (list.length === 0) return null;
                      return (
                        <div key={slot} className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{slot}</span>
                          <div className="space-y-2">
                            {list.map(r => (
                              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-slate-800">{r.medicine_name}</p>
                                  <span className="text-[9px] text-slate-400 font-bold">{r.reminder_time} • {r.instructions}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  r.status === 'Missed' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                                  r.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {r.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* General Health info */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 space-y-2.5">
                <h3 className="font-bold text-slate-855 text-xs uppercase tracking-wider">Allergies & Medical File</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Drug Allergies</span>
                    <p className="font-semibold text-rose-600 mt-0.5">Penicillin, Dust</p>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-100 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Registered Email</span>
                    <p className="font-semibold text-slate-700 mt-0.5 truncate">rahul.sharma@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Reminders (Requirement 17) */}
          {activeTab === 'reminders' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Medicine Reminders</h3>
              
              {processedReminders.length === 0 ? (
                <div className="p-8 text-center text-slate-450 italic bg-slate-50 border border-slate-150 rounded-2xl">
                  No medicine reminders configured.
                </div>
              ) : (
                <div className="space-y-3">
                  {processedReminders.map((rem) => {
                    const isCompleted = rem.status === 'Completed';
                    const isMissed = rem.status === 'Missed';
                    const isUpcoming = rem.status === 'Upcoming';
                    const isOptional = rem.status === 'Optional';

                    return (
                      <div 
                        key={rem.id} 
                        className={`p-4 border rounded-2xl shadow-sm flex flex-col gap-3 transition-all bg-white ${
                          isCompleted ? 'border-emerald-100/50 bg-emerald-50/10' : 'border-slate-150'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${
                              isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              isMissed ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className={`font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {rem.medicine_name}
                              </h4>
                              <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                                Scheduled: {rem.reminder_time}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            isMissed ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            isUpcoming ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            isOptional ? 'bg-slate-50 text-slate-500 border-slate-200' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {rem.status}
                          </span>
                        </div>

                        {/* Timing and dosage overview */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[10px] font-bold text-slate-500">
                          <div>
                            <span className="block text-[8px] text-slate-400">DOSAGE & INSTRUCTIONS</span>
                            <span className="text-slate-700">{rem.dosage} • {rem.instructions}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-400">FREQUENCY & DURATION</span>
                            <span className="text-slate-700">{rem.frequency} • {rem.duration}</span>
                          </div>
                          {rem.taken_time && (
                            <div className="col-span-2 border-t border-slate-200/50 pt-1.5 flex justify-between items-center text-[9px] text-emerald-700">
                              <span>Taken Time:</span>
                              <span className="font-extrabold">{rem.taken_time}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isCompleted && !isOptional && (
                          <button
                            onClick={() => handleMarkAsTaken(rem.id)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-sm text-center"
                          >
                            Mark as Taken
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Appointments */}
          {activeTab === 'appointments' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Book Check-up</h3>
              </div>
              
              <div className="bg-white p-5 border border-slate-150 rounded-2xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Select Practitioner</label>
                  <select 
                    value={bookDoctor}
                    onChange={(e) => setBookDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 text-xs bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Dr. Chaitanya">Dr. Chaitanya (Endodontist)</option>
                    <option value="Dr. Anusha">Dr. Anusha (Orthodontist)</option>
                    <option value="Dr. Vikram">Dr. Vikram (Pedodontist)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Date</label>
                    <input 
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500 transition-colors bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Time Slot</label>
                    <select
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wide block">Treatment Type</label>
                  <select 
                    value={bookTreatment}
                    onChange={(e) => setBookTreatment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 text-xs bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="General Checkup">General Checkup</option>
                    <option value="Teeth Cleaning">Teeth Cleaning</option>
                    <option value="Cavity Filling">Cavity Filling</option>
                    <option value="Root Canal Treatment">Root Canal Treatment</option>
                    <option value="Braces Adjustment">Braces Adjustment</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer text-center"
                >
                  {submitting ? 'Booking Slot...' : 'Approve Appointment Slot'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Records */}
          {activeTab === 'records' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Prescriptions & Invoices</h3>
              
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-855 text-xs">Rx Prescription Sheet</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Doctor: {p.doctor_name || 'Dr. Chaitanya'}</p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">Issued: {new Date(p.created_date || p.created_at).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => handleDownloadPdf('Prescription', p.id)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}

                {bills.map((b) => (
                  <div key={b.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-805 text-xs">{b.invoice_number}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">Amount: ₹{b.amount}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ml-2 ${b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {b.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDownloadPdf('Invoice', b.id)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      PDF Bill
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Mobile Navigation bottom bar */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 flex items-center justify-around z-45 shrink-0 px-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1.5 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-blue-650' : 'text-slate-400 hover:text-slate-655'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Portal</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reminders')}
            className={`flex flex-col items-center gap-1 py-1.5 transition-colors cursor-pointer ${activeTab === 'reminders' ? 'text-blue-655' : 'text-slate-400 hover:text-slate-655'}`}
          >
            <Pill className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Reminders</span>
          </button>

          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex flex-col items-center gap-1 py-1.5 transition-colors cursor-pointer ${activeTab === 'appointments' ? 'text-blue-655' : 'text-slate-400 hover:text-slate-655'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Book Visit</span>
          </button>

          <button 
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center gap-1 py-1.5 transition-colors cursor-pointer ${activeTab === 'records' ? 'text-blue-655' : 'text-slate-400 hover:text-slate-655'}`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight">Records</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
