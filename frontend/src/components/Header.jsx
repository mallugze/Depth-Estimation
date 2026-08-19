import React from 'react';
import { ShieldCheck, Sparkles, Cpu, Layers } from 'lucide-react';

export default function Header({ currentView }) {
  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'inspection': return 'Single Surface Scan';
      case 'batch': return 'Batch Structural Inspection';
      case 'reports': return 'Inspection Records & Archive';
      case 'diagnostics': return 'Model Diagnostics & Benchmarks';
      default: return 'Overview Dashboard';
    }
  };

  return (
    <header className="h-16 bg-[#090b12]/80 border-b border-slate-800/80 flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Workspace</span>
        <span className="text-slate-600">/</span>
        <span className="text-primary font-semibold">
          {getBreadcrumbTitle()}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* System Online Badge */}
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Deep Inference Ready
        </span>

        {/* Engineer Profile Block */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800 h-8">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-xs font-bold text-primary leading-none">Civil QA Specialist</span>
            <span className="text-[10px] text-muted mt-0.5 font-mono">Asset Integrity</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            QA
          </div>
        </div>
      </div>
    </header>
  );
}
