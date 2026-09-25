import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Sliders, Info, ShieldCheck, Radio, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function UploadDropzone({ onDrop }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onDrop(file);
      } else {
        alert('Please upload an image file (JPEG, PNG, etc).');
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onDrop(file);
      } else {
        alert('Please upload an image file (JPEG, PNG, etc).');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Primary Dropzone */}
      <div 
        className={`panel w-full min-h-[340px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 border-dashed relative overflow-hidden ${
          isDragActive 
            ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan' 
            : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-800/30'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {/* Simulated Laser Scan Line Animation in Dropzone */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse pointer-events-none"></div>

        <div className={`mb-4 p-5 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
          <UploadCloud size={42} strokeWidth={1.5} />
        </div>
        
        <h3 className="text-base font-bold text-primary mb-1">
          Select or Drag & Drop Structural Concrete Image
        </h3>
        <p className="text-xs text-muted max-w-md leading-relaxed">
          Upload surface photos of bridge decks, pavements, retaining walls, or tunnel linings for AI crack classification & <strong>Virtual Laser Depth Profilometry</strong>.
        </p>

        {/* Dataset & Laser Profiling Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-lg">
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse" /> Virtual Laser LiDAR Profiler
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
            SDNET2018 Bridge Decks & Pavements
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
            CCIC Concrete Benchmark
          </span>
        </div>
        
        <div className="mt-5 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-glow-cyan transition-all">
          Browse Surface Photo
        </div>
      </div>

      {/* Dataset & Photo Specification Guide Box */}
      <div className="panel p-4 bg-surface-card/60 border border-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Info size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary">Required Dataset & Image Specifications</h4>
              <p className="text-[11px] text-muted">Trained specifically on standardized civil engineering concrete benchmark datasets</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowDatasetInfo(!showDatasetInfo); }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
          >
            {showDatasetInfo ? 'Hide Details' : 'View Specifications'}
          </button>
        </div>

        {showDatasetInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border/60 text-xs animate-in fade-in">
            <div className="p-3 bg-black/40 rounded-lg border border-border flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 size={14} />
                <span>Compatible Photo Types (Trained Datasets)</span>
              </div>
              <ul className="text-muted text-[11px] space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-200">SDNET2018 Bridge Decks:</strong> Bridge deck slabs, expansion joint fissures, rebar perimeters.</li>
                <li><strong className="text-slate-200">SDNET2018 Pavements:</strong> Concrete roadways, asphalt-to-concrete joints, highway slabs.</li>
                <li><strong className="text-slate-200">SDNET2018 Concrete Walls:</strong> Vertical retaining walls, foundation concrete, pillars.</li>
                <li><strong className="text-slate-200">CCIC Standard Blocks:</strong> Macro concrete fissure textures & structural blocks.</li>
                <li><strong className="text-slate-200">Capture Conditions:</strong> Orthogonal/flat camera angle, macro distance (0.3m - 2m), clear natural lighting.</li>
              </ul>
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-border flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertCircle size={14} />
                <span>Incompatible / Out-of-Scope Photos</span>
              </div>
              <ul className="text-muted text-[11px] space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-200">Non-Concrete Objects:</strong> People, vehicles, animals, indoor furniture, or food.</li>
                <li><strong className="text-slate-200">Non-Masonry Materials:</strong> Wood grain, drywall, textiles, or clear glass.</li>
                <li><strong className="text-slate-200">Far-Away Drone / Satellite:</strong> Low-resolution panoramic views where crack fissure crevices are not resolved.</li>
                <li><strong className="text-slate-200">Flooded Surfaces:</strong> Water reflection or thick moss/vegetation hiding concrete fissure boundaries.</li>
              </ul>
            </div>

            <div className="md:col-span-2 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-[11px] text-cyan-200/90 leading-relaxed">
              <strong>🔬 Virtual Laser Disparity Profilometry:</strong> The monocular depth estimation engine simulates an optical laser beam transect across structural surfaces. It calculates crevice depth drops equivalent to physical LiDAR distance sensors and triangulating laser profilometers.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
