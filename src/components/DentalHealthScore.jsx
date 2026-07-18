import React from 'react';
import { Activity, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

export default function DentalHealthScore({ score = 82 }) {
  // Determine color coding based on score
  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (val >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  // Mock risk predictive model values (Requirement 14 & 15)
  const risks = [
    { name: 'Caries (Cavity) Risk', level: 'Moderate', percentage: 45, color: 'bg-amber-500' },
    { name: 'Periodontal Disease Risk', level: 'Low', percentage: 15, color: 'bg-emerald-500' },
    { name: 'Enamel Erosion', level: 'Low', percentage: 22, color: 'bg-emerald-500' },
    { name: 'Malocclusion/Crowding', level: 'High', percentage: 78, color: 'bg-rose-500' }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-5 text-left font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
          <span>AI Dental Health & Risk Scorecard</span>
        </h3>
        <Sparkles className="w-4.5 h-4.5 text-yellow-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circle Progress meter */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="40" 
              fill="transparent" 
              stroke={score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444')}
              strokeWidth="8" 
              strokeDasharray={`${2 * Math.PI * 40}`} 
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-2xl font-black text-slate-800">{score}</span>
            <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Health Index</span>
          </div>
        </div>

        {/* Diagnostic recommendations */}
        <div className="space-y-1.5 flex-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Summary</span>
          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
            Patient exhibits optimal dental health with minor tartar accumulation on mandibular incisors. Malocclusion is detected in lower quadrant.
          </p>
          <div className="p-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl text-[10px] text-blue-700 font-bold leading-relaxed">
            Recommendations: Brush with fluoridated paste, schedule scaling in 3 months, and evaluate crowding with orthodontist.
          </div>
        </div>
      </div>

      {/* Risks Progress indicators */}
      <div className="space-y-3.5 border-t border-slate-50 pt-4 text-xs">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">AI Future Risk Predictions</span>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((r, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-655">
                <span>{r.name}</span>
                <span className={r.level === 'High' ? 'text-rose-600' : (r.level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600')}>{r.level}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
