import React, { useState, useEffect } from 'react';
import { 
  Calendar, Pill, Receipt, Stethoscope, ShieldCheck, 
  Clock, ArrowRight, User, Sparkles
} from 'lucide-react';
import { listEntity } from '../services/api';

export default function PatientTimeline({ patientName = 'Rahul Sharma' }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistoryLogs = async () => {
    try {
      setLoading(true);
      const apptsRes = await listEntity('Appointment');
      const prescsRes = await listEntity('Prescription');
      const billsRes = await listEntity('Invoice');
      const xraysRes = await listEntity('XRay');

      const logs = [];

      // Add Appointments
      if (apptsRes.success) {
        apptsRes.data
          .filter(a => a.patient_name === patientName)
          .forEach(a => {
            logs.push({
              id: `appt-${a.id}`,
              type: 'Appointment',
              title: `Appt: ${a.treatment_type || 'General Consultation'}`,
              detail: `With ${a.doctor_name || 'Dr. Chaitanya'} at ${a.appointment_time || '10:00 AM'}`,
              date: a.appointment_date || new Date().toISOString().split('T')[0],
              icon: Calendar,
              color: 'bg-blue-500 text-white'
            });
          });
      }

      // Add Prescriptions
      if (prescsRes.success) {
        prescsRes.data
          .filter(p => p.patient_name === patientName)
          .forEach(p => {
            const medsList = Array.isArray(p.medicines) ? p.medicines.map(m => m.name).join(', ') : 'Medicines sheet';
            logs.push({
              id: `presc-${p.id}`,
              type: 'Prescription',
              title: 'Medicines Prescribed',
              detail: `Issued ${medsList}`,
              date: (p.created_date || p.created_at || '').split('T')[0],
              icon: Pill,
              color: 'bg-purple-500 text-white'
            });
          });
      }

      // Add Invoices
      if (billsRes.success) {
        billsRes.data
          .filter(b => b.patient_name === patientName)
          .forEach(b => {
            logs.push({
              id: `bill-${b.id}`,
              type: 'Payment',
              title: `Invoice Generated (${b.invoice_number})`,
              detail: `Amount: ₹${b.amount} | Payment status: ${b.status}`,
              date: (b.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
              icon: Receipt,
              color: 'bg-emerald-500 text-white'
            });
          });
      }

      // Add X-rays
      if (xraysRes.success) {
        xraysRes.data
          .filter(x => x.patient_name === patientName)
          .forEach(x => {
            logs.push({
              id: `xray-${x.id}`,
              type: 'XRay',
              title: 'AI X-Ray scan Diagnostics',
              detail: x.diagnosis,
              date: (x.created_at || '').split('T')[0],
              icon: ShieldCheck,
              color: 'bg-rose-500 text-white'
            });
          });
      }

      // Sort logs by date descending
      logs.sort((a, b) => b.date.localeCompare(a.date));

      // Inject demo records if logs are completely empty
      if (logs.length === 0) {
        setEvents([
          {
            id: 'd-1',
            type: 'Appointment',
            title: 'Initial Consultation visit',
            detail: 'Chief complaint checkup regarding molar sensitivity with Dr. Chaitanya.',
            date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
            icon: Calendar,
            color: 'bg-blue-500 text-white'
          },
          {
            id: 'd-2',
            type: 'Prescription',
            title: 'Issued Antibiotic Prescription',
            detail: 'Prescribed Amoxicillin 500mg and Paracetamol 650mg.',
            date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
            icon: Pill,
            color: 'bg-purple-500 text-white'
          },
          {
            id: 'd-3',
            type: 'Payment',
            title: 'Invoice Generated (#INV-2026-004)',
            detail: 'Amount: ₹1,280 | Status: Paid',
            date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
            icon: Receipt,
            color: 'bg-emerald-500 text-white'
          }
        ]);
      } else {
        setEvents(logs);
      }
    } catch (err) {
      console.warn("Failed mapping patient timeline:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryLogs();
  }, [patientName]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-5 text-left font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
          <span>Patient Journey Timeline</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{events.length} Milestones</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3 py-1">
          {events.map((ev) => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative group">
                {/* Connector dot */}
                <div className={`absolute -left-9 top-1 w-6 h-6 rounded-full ${ev.color} flex items-center justify-center border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                {/* Event Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1 hover:bg-white hover:shadow-sm hover:border-slate-300/40 transition-all duration-200">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                    <span>{ev.type}</span>
                    <span>{new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">{ev.title}</h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">{ev.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
