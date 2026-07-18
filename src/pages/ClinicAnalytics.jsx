import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function ClinicAnalytics() {
  
  // Recharts Mock Datasets
  const doctorRevenueData = [
    { name: 'Dr. Chaitanya', value: 164000 },
    { name: 'Dr. Anusha', value: 89000 },
    { name: 'Dr. Vikram', value: 45000 }
  ];

  const COLORS = ['#2563eb', '#6366f1', '#14b8a6'];

  const demographicData = [
    { ageGroup: '0-18 Years', count: 24 },
    { ageGroup: '19-35 Years', count: 85 },
    { ageGroup: '36-50 Years', count: 48 },
    { ageGroup: '51+ Years', count: 19 }
  ];

  const treatmentRevenueData = [
    { treatment: 'RCT', revenue: 120000 },
    { treatment: 'Cleaning', revenue: 45000 },
    { treatment: 'Filling', revenue: 65000 },
    { treatment: 'Crowns', revenue: 68000 }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clinic Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Detailed statistical insights into clinic workload and revenue distribution</p>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Ticket Size</h4>
            <p className="text-lg font-bold text-slate-800 mt-0.5">₹1,850.50</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Retention</h4>
            <p className="text-lg font-bold text-slate-800 mt-0.5">88.4%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-650">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Growth MoM</h4>
            <p className="text-lg font-bold text-slate-800 mt-0.5">+14.2%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Contribution by Doctor */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Revenue Contribution by Doctor</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doctorRevenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {doctorRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="space-y-2">
              {doctorRevenueData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name} &middot; ₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demographics count */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Demographics (Age Groups)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographicData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="ageGroup" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treatment revenue breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm flex flex-col h-[350px] lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Revenue Contribution by Treatment Type</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={treatmentRevenueData}
                margin={{ top: 5, right: 5, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="treatment" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#14b8a6" radius={[0, 6, 6, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
