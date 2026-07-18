import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Plus, Search, X, Check, 
  RefreshCw, DollarSign, Calendar, User, FileText, AlertCircle
} from 'lucide-react';
import { listEntity, createEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Treatments() {
  const { showToast } = useToast();
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Treatment Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [treatmentName, setTreatmentName] = useState('Dental Cleaning');
  const [cost, setCost] = useState('1500');
  const [doctorName, setDoctorName] = useState('Dr. Chaitanya');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const fetchTreatmentsAndPatients = async () => {
    try {
      setLoading(true);
      const data = await listEntity('Treatment');
      const pats = await listEntity('Patient');
      setTreatments(data.success ? (data.data || []) : []);
      setPatients(pats.success ? (pats.data || []) : []);
    } catch (err) {
      console.warn("Failed fetching treatments:", err.message);
      setTreatments([]); // Fallback starts empty
      setPatients([
        { id: 'P-000231', full_name: 'Rahul Sharma' },
        { id: 'P-000232', full_name: 'Priya Patel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentsAndPatients();
  }, []);

  const validateTreatmentForm = () => {
    const errors = {};
    if (!selectedPatientId) {
      errors.patient = "Please select a patient";
    }
    if (!cost || isNaN(cost) || parseFloat(cost) <= 0) {
      errors.cost = "Cost must be a valid positive number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTreatment = async (e) => {
    e.preventDefault();
    if (!validateTreatmentForm()) {
      showToast("Please correct the form errors", "warning");
      return;
    }
    try {
      setSubmitting(true);
      const patientObj = patients.find(p => p.id === selectedPatientId);
      
      const payload = {
        patient_id: selectedPatientId,
        patient_name: patientObj ? (patientObj.full_name || patientObj.name) : 'Unknown',
        name: treatmentName,
        cost: parseFloat(cost),
        doctor_name: doctorName,
        notes,
        status: 'Completed',
        created_date: new Date().toISOString()
      };

      const res = await createEntity('Treatment', payload);
      if (res.success) {
        showToast("Treatment record added successfully!", "success");
        
        // Auto-generate linked invoice
        const invNum = `INV-${String(Math.floor(100000 + Math.random() * 900000))}`;
        const todayStr = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
        
        const invoicePayload = {
          patientId: selectedPatientId,
          patientName: patientObj ? (patientObj.full_name || patientObj.name) : 'Unknown',
          doctorName: doctorName,
          treatmentName: treatmentName,
          invoiceNumber: invNum,
          invoiceDate: todayStr,
          dueDate: nextWeek,
          totalAmount: parseFloat(cost),
          amountPaid: 0,
          remainingBalance: parseFloat(cost),
          paymentStatus: 'Unpaid',
          treatmentCharges: parseFloat(cost),
          notes: `Auto-generated from completed treatment: ${treatmentName}`
        };
        
        try {
          await createEntity('Invoice', invoicePayload);
          console.log("[Treatments Billing Sync] Linked invoice generated automatically.");
        } catch (invErr) {
          console.error("[Treatments Billing Sync Error] Failed generating automatic invoice:", invErr);
        }

        setIsModalOpen(false);
        // Reset form
        setSelectedPatientId('');
        setNotes('');
        setCost('1500');
        setFormErrors({});
        fetchTreatmentsAndPatients();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTreatments = treatments.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Treatments</h2>
            <p className="text-xs text-slate-500 mt-1">{treatments.length} treatment records</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Treatment</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Main card panel */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-blue-50 shadow-sm">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTreatments.length === 0 ? (
        /* Empty State replicating Screenshot 4 */
        <div className="bg-white py-24 text-center rounded-2xl border border-blue-50 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No treatments</h3>
          <p className="text-xs text-slate-400 mt-1">Create your first treatment record</p>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase bg-slate-50/50">
                  <th className="p-4">Patient</th>
                  <th className="p-4">Treatment</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {filteredTreatments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 text-slate-800 font-bold">{t.patient_name}</td>
                    <td className="p-4 text-blue-700 font-semibold">{t.name}</td>
                    <td className="p-4 text-slate-500">{t.doctor_name}</td>
                    <td className="p-4 text-slate-850">₹{parseFloat(t.cost || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-slate-400">{new Date(t.created_date || Date.now()).toLocaleDateString()}</td>
                    <td className="p-4 text-xs text-slate-400 truncate max-w-[200px]" title={t.notes}>{t.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Record Treatment</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTreatment} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    if (formErrors.patient) setFormErrors({ ...formErrors, patient: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 bg-white ${formErrors.patient ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
                  ))}
                </select>
                {formErrors.patient && (
                  <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> {formErrors.patient}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Treatment</label>
                <select
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Dental Cleaning">Dental Cleaning</option>
                  <option value="Cavity Restoration">Cavity Restoration</option>
                  <option value="Orthodontic Consultation">Orthodontic Consultation</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Root Canal Treatment">Root Canal Treatment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cost (INR)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => {
                      setCost(e.target.value);
                      if (formErrors.cost) setFormErrors({ ...formErrors, cost: null });
                    }}
                    className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${formErrors.cost ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                  />
                  {formErrors.cost && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> {formErrors.cost}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dentist</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Dr. Chaitanya">Dr. Chaitanya</option>
                    <option value="Dr. Anusha">Dr. Anusha</option>
                    <option value="Dr. Vikram">Dr. Vikram</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Tooth numbers annotated, diagnostic findings, etc..."
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
                  disabled={submitting || !selectedPatientId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
