import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Filter, X, Eye, 
  Phone, Calendar, Info, AlertCircle, RefreshCw, Clipboard
} from 'lucide-react';
import { listEntity, createEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Patients() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const { showToast } = useToast();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState(urlSearch);
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Add Patient Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    phone: '',
    date_of_birth: '',
    blood_group: 'O+',
    allergies: 'None Known',
    chief_complaint: '',
    medical_history: 'None'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await listEntity('Patient');
      if (res.success) {
        setPatients(res.data || []);
      } else {
        showToast(res.message, 'error');
        setPatients(defaultPatients);
      }
    } catch (err) {
      console.warn("Failed fetching patients: ", err.message);
      setPatients(defaultPatients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const defaultPatients = [
    { id: 'P-000231', full_name: 'Rahul Sharma', age: 28, gender: 'Male', phone: '9876543210', date_of_birth: '1996-05-12', blood_group: 'O+', allergies: 'None Known', chief_complaint: 'Toothache in upper right molar', medical_history: 'Hypertension controlled' },
    { id: 'P-000232', full_name: 'Priya Patel', age: 34, gender: 'Female', phone: '9812345678', date_of_birth: '1991-09-15', blood_group: 'A+', allergies: 'Penicillin', chief_complaint: 'Routine cleaning and checkup', medical_history: 'None' },
    { id: 'P-000233', full_name: 'Amit Verma', age: 45, gender: 'Male', phone: '9988776655', date_of_birth: '1980-03-22', blood_group: 'B+', allergies: 'Sulfa Drugs', chief_complaint: 'Bleeding gums and sensitivity', medical_history: 'Type 2 diabetes' },
    { id: 'P-000234', full_name: 'Sneha Reddy', age: 29, gender: 'Female', phone: '9012345678', date_of_birth: '1996-11-04', blood_group: 'O-', allergies: 'None Known', chief_complaint: 'Wisdom tooth discomfort', medical_history: 'None' },
    { id: 'P-000235', full_name: 'Vikram Singh', age: 50, gender: 'Male', phone: '9543210987', date_of_birth: '1975-07-30', blood_group: 'AB+', allergies: 'None Known', chief_complaint: 'Root canal check', medical_history: 'Mild asthma' },
  ];

  const validateForm = () => {
    const errors = {};
    if (!newPatient.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!newPatient.age) {
      errors.age = "Age is required";
    } else {
      const parsedAge = parseInt(newPatient.age, 10);
      if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        errors.age = "Please enter a valid age (1-120)";
      }
    }

    if (!newPatient.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(newPatient.phone.trim())) {
      errors.phone = "Phone must be a valid 10-digit number";
    }

    if (!newPatient.date_of_birth) {
      errors.date_of_birth = "Date of birth is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please fix the validation errors before submitting", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const patientId = `P-${String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6)}`;
      const payload = {
        full_name: newPatient.full_name.trim(),
        age: parseInt(newPatient.age, 10),
        gender: newPatient.gender,
        phone: newPatient.phone.trim(),
        date_of_birth: newPatient.date_of_birth,
        blood_group: newPatient.blood_group,
        allergies: newPatient.allergies.trim(),
        chief_complaint: newPatient.chief_complaint.trim() || 'None',
        medical_history: newPatient.medical_history.trim() || 'None',
        patient_id: patientId,
        created_date: new Date().toISOString()
      };
      
      console.log("Outgoing Patient Registration Payload:", payload);
      const res = await createEntity('Patient', payload);
      console.log("Patient Registration Response:", res);
      
      if (res.success) {
        showToast("Patient registered successfully!", "success");
        setIsModalOpen(false);
        setNewPatient({
          full_name: '',
          age: '',
          gender: 'Male',
          phone: '',
          date_of_birth: '',
          blood_group: 'O+',
          allergies: 'None Known',
          chief_complaint: '',
          medical_history: 'None'
        });
        setFormErrors({});
        fetchPatients();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredPatients = patients.filter(patient => {
    const nameStr = patient.full_name || patient.name || '';
    const matchesSearch = 
      nameStr.toLowerCase().includes(search.toLowerCase()) || 
      patient.phone?.includes(search) || 
      patient.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      patient.id?.toLowerCase().includes(search.toLowerCase());
      
    const matchesBlood = bloodGroupFilter ? patient.blood_group === bloodGroupFilter : true;
    const matchesGender = genderFilter ? patient.gender === genderFilter : true;

    return matchesSearch && matchesBlood && matchesGender;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patients Directory</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and access all patient records</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-650 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="">All Blood Groups</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
          {(search || bloodGroupFilter || genderFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setBloodGroupFilter('');
                setGenderFilter('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Patients List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm animate-pulse h-52 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/6" />
              </div>
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white py-16 text-center rounded-2xl border border-blue-50 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No patients found</h3>
          <p className="text-sm text-slate-400 mt-1">Try resetting your filter criteria or register a new patient.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                    {patient.patient_id || patient.id}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{patient.blood_group} Blood</span>
                </div>
                <h3 className="text-base font-bold text-slate-850 truncate">{patient.full_name || patient.name}</h3>
                <div className="space-y-2 mt-4 text-xs font-medium text-slate-500">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.phone || 'No phone record'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{patient.age} Years • {patient.gender}</span>
                  </p>
                  {patient.allergies && patient.allergies !== 'None Known' && (
                    <p className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100/50 w-fit mt-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[200px]">Allergy: {patient.allergies}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                  {patient.chief_complaint || 'No complaint listed'}
                </p>
                <button
                  onClick={() => navigate(`/patients/${patient.id || patient.patient_id}`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden my-8 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Register New Patient</h3>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormErrors({});
                }}
                disabled={submitting}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name *</label>
                  <input
                    type="text"
                    disabled={submitting}
                    placeholder="e.g. Rahul Sharma"
                    value={newPatient.full_name}
                    onChange={(e) => {
                      setNewPatient({ ...newPatient, full_name: e.target.value });
                      if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${formErrors.full_name ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                  />
                  {formErrors.full_name && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> {formErrors.full_name}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Age *</label>
                  <input
                    type="number"
                    disabled={submitting}
                    placeholder="e.g. 28"
                    value={newPatient.age}
                    onChange={(e) => {
                      setNewPatient({ ...newPatient, age: e.target.value });
                      if (formErrors.age) setFormErrors({ ...formErrors, age: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${formErrors.age ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                  />
                  {formErrors.age && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> {formErrors.age}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gender</label>
                  <select
                    disabled={submitting}
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number *</label>
                  <input
                    type="tel"
                    disabled={submitting}
                    placeholder="e.g. 9876543210"
                    value={newPatient.phone}
                    onChange={(e) => {
                      setNewPatient({ ...newPatient, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${formErrors.phone ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                  />
                  {formErrors.phone && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* DOB */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date of Birth *</label>
                  <input
                    type="date"
                    disabled={submitting}
                    value={newPatient.date_of_birth}
                    onChange={(e) => {
                      setNewPatient({ ...newPatient, date_of_birth: e.target.value });
                      if (formErrors.date_of_birth) setFormErrors({ ...formErrors, date_of_birth: null });
                    }}
                    className={`w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${formErrors.date_of_birth ? 'border-rose-450 bg-rose-50/10' : 'border-slate-200'}`}
                  />
                  {formErrors.date_of_birth && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> {formErrors.date_of_birth}
                    </p>
                  )}
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Blood Group</label>
                  <select
                    disabled={submitting}
                    value={newPatient.blood_group}
                    onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Allergies */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Allergies (if any)</label>
                  <input
                    type="text"
                    disabled={submitting}
                    placeholder="e.g. Penicillin, None Known"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Chief Complaint */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chief Complaint</label>
                  <textarea
                    rows={2}
                    disabled={submitting}
                    placeholder="Describe symptoms, reason for visit..."
                    value={newPatient.chief_complaint}
                    onChange={(e) => setNewPatient({ ...newPatient, chief_complaint: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Medical History */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Clipboard className="w-3.5 h-3.5 text-slate-450" />
                    <span>Medical History</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={submitting}
                    placeholder="Hypertension, diabetes, asthma, previous surgeries..."
                    value={newPatient.medical_history}
                    onChange={(e) => setNewPatient({ ...newPatient, medical_history: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormErrors({});
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:cursor-not-allowed"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{submitting ? 'Registering...' : 'Register Patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
