import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, Plus, Search, 
  Filter, X, User, Check, Trash2, CalendarCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { listEntity, createEntity, updateEntity, deleteEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Appointments() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenNew = searchParams.get('new') === 'true';

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(autoOpenNew);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [useCustomPatient, setUseCustomPatient] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Chaitanya');
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [treatmentType, setTreatmentType] = useState('General Checkup');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const fetchAppointmentsAndPatients = async () => {
    try {
      setLoading(true);
      const apptsRes = await listEntity('Appointment');
      const patsRes = await listEntity('Patient');
      setAppointments(apptsRes.success ? (apptsRes.data || []) : []);
      setPatients(patsRes.success ? (patsRes.data || []) : []);
    } catch (err) {
      console.warn("Failed fetching appointments/patients:", err.message);
      setAppointments(defaultAppointments);
      setPatients(defaultPatients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsAndPatients();
  }, []);

  useEffect(() => {
    if (autoOpenNew) {
      setIsModalOpen(true);
      // Remove parameter from URL to prevent reopening on reload
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams);
    }
  }, [autoOpenNew]);

  const defaultPatients = [
    { id: '1', full_name: 'Rahul Sharma', phone: '9876543210' },
    { id: '2', full_name: 'Priya Patel', phone: '9812345678' },
    { id: '3', full_name: 'Amit Verma', phone: '9988776655' }
  ];

  const defaultAppointments = [
    { id: '1', patient_name: 'Rahul Sharma', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '10:30 AM', treatment_type: 'Cavity Filling', doctor_name: 'Dr. Chaitanya', status: 'In Progress' },
    { id: '2', patient_name: 'Priya Patel', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '11:15 AM', treatment_type: 'Orthodontic Checkup', doctor_name: 'Dr. Anusha', status: 'Scheduled' },
    { id: '3', patient_name: 'Amit Verma', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '12:00 PM', treatment_type: 'Dental Cleaning', doctor_name: 'Dr. Chaitanya', status: 'Scheduled' },
    { id: '4', patient_name: 'Sneha Reddy', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '02:30 PM', treatment_type: 'Root Canal Therapy', doctor_name: 'Dr. Chaitanya', status: 'Scheduled' },
    { id: '5', patient_name: 'Vikram Singh', appointment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], appointment_time: '04:00 PM', treatment_type: 'Consultation', doctor_name: 'Dr. Vikram', status: 'Completed' },
  ];

  const validateBookingForm = () => {
    const errors = {};
    if (!useCustomPatient && !selectedPatientId) {
      errors.patient = "Please select a registered patient";
    }
    if (useCustomPatient && !newPatientName.trim()) {
      errors.patientName = "Patient name is required";
    }
    if (!apptDate) {
      errors.date = "Appointment date is required";
    }
    if (!apptTime) {
      errors.time = "Appointment time is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!validateBookingForm()) {
      showToast("Please correct form validations before saving", "warning");
      return;
    }

    try {
      setSubmitting(true);
      
      let pName = newPatientName;
      let pId = '';

      if (!useCustomPatient && selectedPatientId) {
        const pObj = patients.find(p => p.id === selectedPatientId);
        pName = pObj ? (pObj.full_name || pObj.name) : '';
        pId = selectedPatientId;
      }

      const apptDataPayload = {
        patient_id: pId,
        patient_name: pName,
        appointment_date: apptDate,
        appointment_time: apptTime,
        treatment_type: treatmentType,
        doctor_name: doctorName,
        notes,
        status: 'Scheduled',
        created_date: new Date().toISOString()
      };

      const res = await createEntity('Appointment', apptDataPayload);
      if (res.success) {
        showToast("Appointment booked successfully!", "success");
        setIsModalOpen(false);
        // Reset form
        setSelectedPatientId('');
        setNewPatientName('');
        setNotes('');
        setFormErrors({});
        fetchAppointmentsAndPatients();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      const res = await updateEntity('Appointment', apptId, { status: newStatus });
      if (res.success) {
        showToast(`Status updated to ${newStatus}`, "success");
        fetchAppointmentsAndPatients();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await deleteEntity('Appointment', apptId);
      if (res.success) {
        showToast("Appointment canceled successfully!", "success");
        fetchAppointmentsAndPatients();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Filter logic
  const filteredAppointments = appointments.filter(appt => {
    const matchesDate = filterDate ? appt.appointment_date === filterDate : true;
    const matchesStatus = filterStatus ? appt.status === filterStatus : true;
    return matchesDate && matchesStatus;
  });

  const timeslots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointments Schedule</h2>
          <p className="text-sm text-slate-500 mt-1">Book, review, and adjust clinic sessions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter bar / View toggler */}
      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          {(filterDate || filterStatus) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterStatus('');
              }}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
            >
              Show All
            </button>
          )}
        </div>

        {/* View Mode toggler */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Timeline View
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-20">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800">No appointments scheduled</h3>
              <p className="text-sm text-slate-400 mt-1">Try changing filters or book a session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Time Slot</th>
                    <th className="p-4">Treatment</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 text-slate-800 font-semibold">
                        {appt.patient_id ? (patients.find(p => p.id === appt.patient_id)?.full_name || appt.patient_name) : appt.patient_name}
                      </td>
                      <td className="p-4 text-slate-500">{appt.appointment_date}</td>
                      <td className="p-4 text-slate-500">{appt.appointment_time}</td>
                      <td className="p-4">{appt.treatment_type}</td>
                      <td className="p-4 text-slate-500">{appt.doctor_name}</td>
                      <td className="p-4">
                        <select
                          value={appt.status}
                          onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold border focus:outline-none ${
                            appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                            appt.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-250' :
                            appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-250' :
                            'bg-amber-50 text-amber-700 border-amber-250'
                          }`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-50 transition-colors"
                          title="Cancel session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Timeline for {filterDate || 'Today'}</span>
          </h3>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {timeslots.map((slot) => {
              // Find appt at this slot. Fuzzy match the start hour
              const slotHour = slot.split(':')[0];
              const slotAmPm = slot.split(' ')[1];
              
              const apptsAtSlot = filteredAppointments.filter(a => {
                if (!a.appointment_time) return false;
                const apptHour = a.appointment_time.split(':')[0];
                const apptAmPm = a.appointment_time.split(' ')[1];
                return apptHour === slotHour && apptAmPm === slotAmPm;
              });

              return (
                <div key={slot} className="flex py-5 gap-4 min-h-[90px]">
                  <div className="w-20 text-xs font-bold text-slate-400 uppercase tracking-wider pt-1 shrink-0">
                    {slot}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    {apptsAtSlot.length > 0 ? (
                      apptsAtSlot.map((appt) => (
                        <div 
                          key={appt.id} 
                          className={`flex-1 p-3 rounded-xl border flex justify-between items-center ${
                            appt.status === 'Completed' ? 'bg-emerald-50/50 border-emerald-100/60' :
                            appt.status === 'In Progress' ? 'bg-blue-50/50 border-blue-100/60' :
                            'bg-slate-50 border-slate-200/50'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {appt.patient_id ? (patients.find(p => p.id === appt.patient_id)?.full_name || appt.patient_name) : appt.patient_name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{appt.treatment_type} • {appt.doctor_name}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            appt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 border border-dashed border-slate-100 rounded-xl flex items-center pl-4 text-[11px] text-slate-350 font-semibold select-none">
                        No bookings
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Schedule New Session</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Patient Selection Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Select</label>
                  <button
                    type="button"
                    onClick={() => setUseCustomPatient(!useCustomPatient)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {useCustomPatient ? 'Select Registered Patient' : 'Type Custom Name'}
                  </button>
                </div>
                
                {useCustomPatient ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Enter patient full name..."
                      value={newPatientName}
                      onChange={(e) => {
                        setNewPatientName(e.target.value);
                        if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: null });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${formErrors.patientName ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                    />
                    {formErrors.patientName && (
                      <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3" /> {formErrors.patientName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={selectedPatientId}
                      onChange={(e) => {
                        setSelectedPatientId(e.target.value);
                        if (formErrors.patient) setFormErrors({ ...formErrors, patient: null });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 bg-white ${formErrors.patient ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                    >
                      <option value="">Choose patient...</option>
                      {patients.map(pat => (
                        <option key={pat.id} value={pat.id}>
                          {pat.full_name || pat.name} ({pat.phone || 'No phone'})
                        </option>
                      ))}
                    </select>
                    {formErrors.patient && (
                      <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3" /> {formErrors.patient}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Doctor / Practitioner</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Dr. Chaitanya">Dr. Chaitanya (General)</option>
                    <option value="Dr. Anusha">Dr. Anusha (Orthodontist)</option>
                    <option value="Dr. Vikram">Dr. Vikram (Pedodontist)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Treatment Type</label>
                  <select
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="General Checkup">General Checkup</option>
                    <option value="Cavity Filling">Cavity Filling</option>
                    <option value="Orthodontic Checkup">Orthodontic Checkup</option>
                    <option value="Dental Cleaning">Dental Cleaning</option>
                    <option value="Root Canal Therapy">Root Canal Therapy</option>
                    <option value="Teeth Whitening">Teeth Whitening</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time Slot</label>
                  <select
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {timeslots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes & Symptoms (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Details of complaint or clinical notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Book Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
