import React from 'react';
import { 
  LayoutDashboard, ImagePlus, Layers, 
  History, Cpu, ShieldCheck, Sparkles, Activity 
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'inspection', label: 'Single Surface Scan', icon: ImagePlus },
    { id: 'batch', label: 'Batch Inspection', icon: Layers, badge: 'New' },
    { id: 'reports', label: 'Inspection Records', icon: History },
    { id: 'diagnostics', label: 'Model Diagnostics', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-[#090b12]/95 border-r border-slate-800/80 flex flex-col hidden md:flex backdrop-blur-xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-primary tracking-tight">StructurAI</span>
            <span className="block text-[10px] text-cyan-400 font-mono leading-none">v2.0 Platform</span>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 py-6 px-3 flex flex-col gap-1.5">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Platform Navigation
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                active 
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={active ? 'text-cyan-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Model Status Pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span>Inference Engine</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-mono">YOLOv8 + MiDaS v2.1</div>
      </div>
    </aside>
  );
}
