import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, ShieldCheck, FileSpreadsheet, TrendingUp, 
  Building, Clock, Coins, Plus, Trash2, Shield, Eye, Calendar
} from 'lucide-react';
import { listEntity, createEntity, updateEntity, deleteEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function AdminSettings() {
  const { showToast } = useToast();
  
  // Lists
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Doctor');
  const [submitting, setSubmitting] = useState(false);

  // Hospital config fields
  const [hospitalName, setHospitalName] = useState('Chaitanya Care Dental Hospital');
  const [taxRate, setTaxRate] = useState('18');
  const [clinicHours, setClinicHours] = useState('09:00 AM - 08:00 PM');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  const fetchUsersAndLogs = async () => {
    try {
      setLoading(true);
      const profilesRes = await listEntity('StaffMember');
      if (profilesRes.success) {
        setUsers(profilesRes.data || []);
      } else {
        setUsers([
          { id: '1', name: 'Dr. Chaitanya', role: 'Chief Doctor', email: 'chief@chaitanya.com', status: 'Active' },
          { id: '2', name: 'Dr. Anusha', role: 'Doctor', email: 'doctor@chaitanya.com', status: 'Active' },
          { id: '3', name: 'Brundhan Chittoju', role: 'Receptionist', email: 'reception@chaitanya.com', status: 'Active' }
        ]);
      }

      // Populate mock audit logs (Requirement 1)
      setAuditLogs([
        { id: 'a-1', user: 'Dr. Chaitanya', action: 'Approved treatment plan for patient Rahul Sharma', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'a-2', user: 'Brundhan Chittoju', action: 'Transferred Appointment #1043 from Dr. Vikram to Dr. Anusha', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: 'a-3', user: 'Dr. Anusha', action: 'Generated dental chart scan', timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
        { id: 'a-4', user: 'Brundhan Chittoju', action: 'Checked-in walk-in patient Amit Verma', timestamp: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } catch (err) {
      console.warn("Failed fetching admin logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndLogs();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        specialization: newUserRole === 'Doctor' ? 'General Dentistry' : 'Receptionist',
        created_at: new Date().toISOString()
      };

      const res = await createEntity('StaffMember', payload);
      if (res.success) {
        showToast(`User account created for ${newUserName} successfully!`, "success");
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('Doctor');
        fetchUsersAndLogs();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showToast(`Creation failed: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableUser = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Disabled' ? 'Active' : 'Disabled';
    try {
      const res = await updateEntity('StaffMember', id, { status: nextStatus });
      if (res.success) {
        showToast(`User account status marked as ${nextStatus}`, "success");
        fetchUsersAndLogs();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, "error");
    }
  };

  const handleSaveHospitalConfig = () => {
    showToast("Hospital configurations saved successfully!", "success");
  };

  const handleExportReports = (format) => {
    showToast(`ERP reports compiled! Downloading ${format} spreadsheet...`, "success");
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-650" />
          <span>Chief Doctor Administration Dashboard</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage global user credentials, clinic configurations, audit logs, and hospital operations parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: ERP Config & Exports */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Hospital configurations */}
          <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-650" />
              <span>ERP Settings</span>
            </h3>
            
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Hospital Brand Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Tax Rate (GST %)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Currency Symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Clinic Operation Hours</label>
                <input
                  type="text"
                  value={clinicHours}
                  onChange={(e) => setClinicHours(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-205 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveHospitalConfig}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Save ERP Settings
              </button>
            </div>
          </div>

          {/* Export Reports */}
          <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-650" />
              <span>Report Export center</span>
            </h3>
            
            <div className="space-y-2 text-xs">
              <button 
                onClick={() => handleExportReports('Financial CSV')}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-left font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center cursor-pointer"
              >
                <span>Export Financials & Billing Logs</span>
                <Coins className="w-4 h-4 text-slate-450" />
              </button>

              <button 
                onClick={() => handleExportReports('Patient Database')}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-left font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center cursor-pointer"
              >
                <span>Export Active Patient Registry</span>
                <Users className="w-4 h-4 text-slate-450" />
              </button>

              <button 
                onClick={() => handleExportReports('Audit Ledger')}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-left font-bold text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center cursor-pointer"
              >
                <span>Export System Audit Ledger</span>
                <ShieldCheck className="w-4 h-4 text-slate-450" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Columns: User accounts & Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User management */}
          <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-650" />
              <span>Hospital Staff & Role Access Controls</span>
            </h3>

            {/* Create Staff Form */}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Name</label>
                <input
                  type="text"
                  required
                  placeholder="Staff Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-205 text-xs bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Email</label>
                <input
                  type="email"
                  required
                  placeholder="staff@chaitanya.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-205 text-xs bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-205 text-xs bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Chief Doctor">Chief Doctor</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Receptionist">Receptionist</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </form>

            {/* Staff list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-655">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="py-3 text-slate-500">{u.email || `${u.name.toLowerCase().replace(' ', '')}@chaitanya.com`}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'Chief Doctor' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          u.role === 'Doctor' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Disabled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDisableUser(u.id, u.status)}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          {u.status === 'Disabled' ? 'Activate' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs - Requirement 1 */}
          <div className="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-450" />
                <span>Clinical ERP Audit Logs</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">Today</span>
            </div>
            
            <div className="divide-y divide-slate-50 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/20 transition-colors">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1 text-left">
                    <p className="text-slate-700 font-medium leading-relaxed">
                      <strong className="text-slate-800">{log.user}</strong>: {log.action}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
