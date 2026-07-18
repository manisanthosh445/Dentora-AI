import React, { useState } from 'react';
import { Eye, Sparkles } from 'lucide-react';

export default function SmileComparison() {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100

  const handleSliderChange = (e) => {
    setSliderPos(e.target.value);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm space-y-4 text-left font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
          <span>Before / After Smile Comparison</span>
        </h3>
        <span className="text-[10px] bg-blue-50 text-blue-750 font-bold px-2 py-0.5 rounded-full">Interactive Slider</span>
      </div>
      
      <p className="text-xs text-slate-500">Drag the central handle to inspect restoration progress and alignment corrections.</p>

      {/* Draggable Viewport Slider */}
      <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-slate-900 shadow-inner select-none">
        
        {/* Underlay (Before Smile: yellow/chipped) */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div className="text-center space-y-2">
            {/* SVG of Before teeth */}
            <svg viewBox="0 0 100 40" className="w-64 h-24 mx-auto fill-amber-300 stroke-amber-600 stroke-2 opacity-85">
              <path d="M10,20 Q12,15 15,22 Q17,14 20,24 Q22,15 25,23 Q27,15 30,22 Q32,14 35,24 L35,28 Q32,32 30,27 Q27,33 25,27 Q22,32 20,26 Q17,32 15,27 Q12,33 10,28 Z" />
              <path d="M40,20 Q42,15 45,22 Q47,14 50,24 Q52,15 55,23 Q57,15 60,22 Q62,14 65,24 L65,28 Q62,32 60,27 Q57,33 55,27 Q52,32 50,26 Q47,32 45,27 Q42,33 40,28 Z" />
            </svg>
            <span className="px-2.5 py-0.5 bg-amber-500/25 text-amber-300 rounded text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">Before Treatment</span>
          </div>
        </div>

        {/* Overlay (After Smile: perfect white) */}
        <div 
          className="absolute inset-0 bg-slate-950 flex items-center justify-center border-r-2 border-blue-500 transition-all duration-75"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        >
          <div className="text-center space-y-2">
            {/* SVG of After teeth */}
            <svg viewBox="0 0 100 40" className="w-64 h-24 mx-auto fill-white stroke-blue-400 stroke-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <path d="M10,20 Q12,16 15,20 Q17,16 20,20 Q22,16 25,20 Q27,16 30,20 Q32,16 35,20 L35,26 Q32,28 30,26 Q27,28 25,26 Q22,28 20,26 Q17,28 15,26 Q12,28 10,26 Z" />
              <path d="M40,20 Q42,16 45,20 Q47,16 50,20 Q52,16 55,20 Q57,16 60,20 Q62,16 65,20 L65,26 Q62,28 60,26 Q57,28 55,26 Q52,28 50,26 Q47,28 45,26 Q42,28 40,26 Z" />
            </svg>
            <span className="px-2.5 py-0.5 bg-blue-600/35 text-blue-300 rounded text-[9px] font-bold uppercase tracking-widest border border-blue-500/20">After: Pearly White</span>
          </div>
        </div>

        {/* Slider input handle */}
        <input 
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={handleSliderChange}
          className="absolute inset-x-0 bottom-6 opacity-85 select-none accent-blue-600 bg-transparent h-1 z-30 cursor-ew-resize"
        />
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
        <span>Restoration: Complete</span>
        <span>Dr. Chaitanya Care</span>
      </div>
    </div>
  );
}
