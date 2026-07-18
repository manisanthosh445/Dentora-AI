import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, IndianRupee, Users, UserCheck, 
  CreditCard, CheckCircle, Clock, Activity,
  TrendingUp, TrendingDown, ArrowRight, UserPlus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { listEntity } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Live Dashboard stats
  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentCount: 0,
    consultationCount: 0,
    doctorCount: 3,
    todayAppointments: 0
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const patientsRes = await listEntity('Patient');
        const appointmentsRes = await listEntity('Appointment');
        const consultationsRes = await listEntity('Consultation');
        const doctorsRes = await listEntity('StaffMember');

        const patients = patientsRes.success ? (patientsRes.data || []) : [];
        const appointments = appointmentsRes.success ? (appointmentsRes.data || []) : [];
        const consultations = consultationsRes.success ? (consultationsRes.data || []) : [];
        const doctors = doctorsRes.success ? (doctorsRes.data.filter(s => s.role === 'Doctor' || s.role === 'dentist' || s.role === 'Dentist') || []) : [];

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.appointment_date && a.appointment_date.startsWith(todayStr)) || [];

        setStats({
          patientCount: patients.length,
          appointmentCount: appointments.length,
          consultationCount: consultations.length,
          doctorCount: doctors.length || 3,
          todayAppointments: todayAppts.length
        });

        // Slice latest 5 patients
        setRecentPatients(patients.slice(0, 5));

        // Get latest 5 appointments
        const latestAppts = appointments.slice(0, 5).map(app => {
          const pat = patients.find(p => p.id === app.patient_id);
          return {
            id: app.id,
            patientName: pat ? pat.full_name : (app.patient_name || 'Unknown Patient'),
            time: app.appointment_time || '10:00 AM',
            type: app.treatment_type || 'General Consultation',
            status: app.status || 'Scheduled'
          };
        });

        setRecentAppointments(latestAppts);
      } catch (err) {
        console.warn("Failed fetching dashboard live statistics:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const defaultRecentAppointments = [
    { id: '1', patientName: 'Rahul Sharma', time: '10:30 AM', type: 'Cavity Filling', status: 'In Progress' },
    { id: '2', patientName: 'Priya Patel', time: '11:15 AM', type: 'Orthodontic Checkup', status: 'Scheduled' },
    { id: '3', patientName: 'Amit Verma', time: '12:00 PM', type: 'Dental Cleaning', status: 'Scheduled' },
    { id: '4', patientName: 'Sneha Reddy', time: '02:30 PM', type: 'Root Canal Therapy', status: 'Scheduled' },
    { id: '5', patientName: 'Vikram Singh', time: '04:00 PM', type: 'Consultation', status: 'Completed' },
  ];

  // Recharts Chart Data
  const revenueData = [
    { name: 'Jan', Revenue: 180000, Target: 200000 },
    { name: 'Feb', Revenue: 210000, Target: 210000 },
    { name: 'Mar', Revenue: 195000, Target: 220000 },
    { name: 'Apr', Revenue: 240000, Target: 230000 },
    { name: 'May', Revenue: 260000, Target: 250000 },
    { name: 'Jun', Revenue: 285000, Target: 260000 },
    { name: 'Jul', Revenue: 298000, Target: 280000 },
  ];

  const appointmentData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 },
    { name: 'Fri', count: 19 },
    { name: 'Sat', count: 10 },
    { name: 'Sun', count: 4 },
  ];

  const cardsData = [
    {
      label: "Total Patients",
      value: stats.patientCount,
      badge: "Live",
      isPositive: true,
      colorClass: "bg-blue-600",
      icon: Users
    },
    {
      label: "Total Appointments",
      value: stats.appointmentCount,
      badge: "Live",
      isPositive: true,
      colorClass: "bg-indigo-600",
      icon: Calendar
    },
    {
      label: "Total Consultations",
      value: stats.consultationCount,
      badge: "Live",
      isPositive: true,
      colorClass: "bg-purple-600",
      icon: Activity
    },
    {
      label: "Active Doctors",
      value: stats.doctorCount,
      badge: "Live",
      isPositive: true,
      colorClass: "bg-emerald-600",
      icon: UserCheck
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, brundhan</h2>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening at your clinic today</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardsData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm flex flex-col justify-between h-[135px] hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl text-white ${card.colorClass} shadow-sm shadow-inherit`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
                  card.isPositive 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
                    : 'text-rose-700 bg-rose-50 border border-rose-100'
                }`}>
                  {card.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {card.badge}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-850 tracking-tight">{card.value}</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Overview */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Revenue Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly revenue vs target</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-650">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-650">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Target
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Target" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorTar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments Weekly */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base">Appointments This Week</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily appointment count</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row for schedule & recent patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Today's Appointments Schedule */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-blue-50 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Today's Appointment Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage and track checking-in clients</p>
            </div>
            <Link 
              to="/appointments" 
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-750 transition-colors"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs">
                    <th className="pb-3 pt-1">Patient Name</th>
                    <th className="pb-3 pt-1">Time Slot</th>
                    <th className="pb-3 pt-1">Treatment</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 text-slate-800">{app.patientName}</td>
                      <td className="py-3.5 text-slate-500">{app.time}</td>
                      <td className="py-3.5 text-slate-650">{app.type}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block ${
                          app.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          app.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => navigate('/consultation')}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Start Consultation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Patients List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-blue-50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Recent Patients</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest registrations in Supabase</p>
              </div>
              <Link 
                to="/patients" 
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-750 transition-colors"
              >
                <span>All Patients</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPatients.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No patient records available</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentPatients.map((pat) => (
                  <div key={pat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {(pat.full_name || pat.name || 'P')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{pat.full_name || pat.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold truncate">{pat.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/patients/${pat.id}`)}
                      className="text-[10px] font-bold text-blue-600 hover:underline shrink-0"
                    >
                      Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
