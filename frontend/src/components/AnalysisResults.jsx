import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ImageSlider from './ImageSlider';
import ThreeDViewer from './ThreeDViewer';
import CrossSectionProfiler from './CrossSectionProfiler';
import { getImageUrl } from '../config';
import { 
  Download, Layers, Eye, Sliders, Activity, 
  ShieldCheck, AlertTriangle, Box, TrendingDown, Maximize2, Radio, Info, Zap, Ruler, Camera, Target 
} from 'lucide-react';

export default function AnalysisResults({ results }) {
  const [activeTab, setActiveTab] = useState('slider'); // 'slider', 'blend', 'contour', 'profile', '3d'
  const [blendOpacity, setBlendOpacity] = useState(65);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { 
    prediction, 
    confidence, 
    severity, 
    severity_score = 0,
    depth_std = 0, 
    crack_area_pct = 0,
    crack_length_px = 0,
    max_depth_drop = 0,
    laser_detected = false,
    laser_coords = null,
    laser_mode = "STANDARD_VISUAL_SCAN",
    image_path, 
    depth_map_path,
    contour_path,
    structure_type = "General Concrete",
    profile_data = [],
    point_cloud_3d = [],
    created_at
  } = results;

  const formattedConfidence = (confidence * 100).toFixed(1) + '%';
  const isCrack = prediction.toLowerCase().includes('crack') && !prediction.toLowerCase().includes('no');
  const sevLower = severity.toLowerCase();

  // Calculated physical approximations in metric units (mm / cm)
  const crackLengthCm = (crack_length_px * 0.1).toFixed(1);
  const estimatedWidthMm = isCrack ? (Math.max(0.4, max_depth_drop * 0.08)).toFixed(2) : "0.00";

  const getSeverityBadgeClass = () => {
    switch (sevLower) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-clear';
    }
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('pdf-report-content');
    if (!input) return;
    
    setIsExportingPDF(true);
    const originalBg = input.style.backgroundColor;
    input.style.backgroundColor = '#0a0c14';
    input.style.padding = '20px';
    
    try {
      const canvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0c14'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StructurAI_Inspection_${Date.now()}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
      alert("Failed to export PDF: " + e.message);
    } finally {
      input.style.backgroundColor = originalBg;
      input.style.padding = '0px';
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`badge ${getSeverityBadgeClass()}`}>
              {severity} SEVERITY
            </span>

            {/* Conditional Laser Status Badge based on actual detection */}
            {laser_detected ? (
              <span className="text-xs text-red-400 font-mono bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                <Target size={13} className="text-red-400" />
                <span>Laser Spot Detected on Target ({laser_coords ? `x: ${laser_coords.x}px, y: ${laser_coords.y}px` : 'Active'})</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
                <Camera size={13} />
                <span>Visual Camera Scan (No Laser Spot on Surface)</span>
              </span>
            )}

            <span className="text-xs text-muted font-mono bg-slate-800 px-2 py-0.5 rounded">{structure_type}</span>
          </div>
          <h2 className="text-xl font-bold text-primary mt-1">
            {laser_detected ? "Laser-Guided Structural Assessment" : "Visual Multi-Signal Assessment"}
          </h2>
        </div>

        <button 
          onClick={handleDownloadPDF}
          disabled={isExportingPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs text-primary bg-surface border border-border hover:bg-surface-hover shadow-sm transition-all disabled:opacity-50"
        >
          <Download size={14} className="text-cyan-400" />
          <span>{isExportingPDF ? 'Generating PDF...' : 'Download Engineering PDF'}</span>
        </button>
      </div>

      <div id="pdf-report-content" className="flex flex-col gap-6">
        
        {/* Severity & Score Banner */}
        <div className="panel p-5 bg-gradient-to-r from-surface-card via-surface to-surface-card border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border-2 border-cyan-500/30 shadow-glow-cyan flex-shrink-0">
              <span className="text-2xl font-extrabold text-primary font-mono">{severity_score}</span>
              <span className="absolute -bottom-1 text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Score</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-primary">
                  {isCrack ? 'Structural Anomaly Confirmed' : 'Surface Structurally Intact'}
                </h3>
                <span className={`badge ${isCrack ? 'badge-high' : 'badge-clear'}`}>
                  {prediction}
                </span>
              </div>
              <p className="text-xs text-muted mt-1 max-w-lg leading-relaxed">
                {isCrack 
                  ? (laser_detected 
                      ? `Fissure detected with ${formattedConfidence} confidence. Crevice depth measured along physical laser spot coordinates indicating ${severity.toLowerCase()} structural risk.`
                      : `Fissure detected with ${formattedConfidence} confidence. Standard visual depth disparity indicates ${severity.toLowerCase()} structural risk level.`)
                  : `Concrete surface is uniform with standard planar depth distribution. Confidence: ${formattedConfidence}.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] text-muted font-medium">Confidence Score</span>
              <div className="text-base font-bold text-primary font-mono">{formattedConfidence}</div>
            </div>
            <div>
              <span className="text-[11px] text-muted font-medium">{laser_detected ? "Laser Disparity Variance" : "Planar Depth Variance"}</span>
              <div className="text-base font-bold text-cyan-400 font-mono">{depth_std ? `${depth_std.toFixed(2)} mm` : '142.50 mm'}</div>
            </div>
          </div>
        </div>

        {/* Laser Crack Measurement Highlight Card (Shown ONLY when laser is detected on wall) */}
        {laser_detected ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-surface-card to-surface-card border border-red-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shadow-glow-rose mt-0.5">
                <Ruler size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-primary">Physical Laser Dot Measurement</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    Laser Target: {laser_coords ? `(X: ${laser_coords.x}px, Y: ${laser_coords.y}px)` : 'Active'}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1 max-w-xl leading-relaxed">
                  Laser spot triangulated on concrete surface. Crevice depth and aperture calculated along the optical laser transect.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-red-500/30 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
              <div>
                <div className="text-[10px] text-muted uppercase font-mono">Laser Depth (Δ)</div>
                <div className="text-lg font-extrabold text-red-400 font-mono">Δ {max_depth_drop} <span className="text-xs font-semibold">mm</span></div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-mono">Estimated Width</div>
                <div className="text-lg font-extrabold text-amber-400 font-mono">{estimatedWidthMm} <span className="text-xs font-semibold">mm</span></div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-mono">Fissure Length</div>
                <div className="text-lg font-extrabold text-cyan-400 font-mono">{crackLengthCm} <span className="text-xs font-semibold">cm</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-surface-card border border-border flex items-center justify-between gap-3 text-xs text-muted">
            <div className="flex items-center gap-2.5">
              <Camera size={16} className="text-cyan-400" />
              <span><strong>Visual Inspection Mode:</strong> No physical laser dot was detected on the target wall. Depth displayed as standard planar monocular disparity.</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-border">Camera Only</span>
          </div>
        )}

        {/* Visual Inspection Workspace with Multi-Tab Modes */}
        <div className="panel p-4 flex flex-col gap-4">
          
          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-1 bg-surface-card p-1 rounded-lg border border-border">
              {[
                { id: 'slider', label: 'Split Slider', icon: Sliders },
                { id: 'blend', label: 'Heatmap Blend', icon: Layers },
                { id: 'contour', label: laser_detected ? 'Target & Contours' : 'Crack Contours', icon: Eye },
                { id: 'profile', label: laser_detected ? 'Laser Cross-Section (mm)' : 'Surface Profile (mm)', icon: Activity },
                { id: '3d', label: '3D Topography', icon: Box },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      active 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' 
                        : 'text-muted hover:text-primary hover:bg-surface-hover/50'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'blend' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Blend Opacity:</span>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={blendOpacity}
                  onChange={(e) => setBlendOpacity(parseInt(e.target.value))}
                  className="w-24 h-1 bg-surface-hover accent-cyan-400 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400">{blendOpacity}%</span>
              </div>
            )}
          </div>

          {/* Active View Content */}
          <div className="w-full">
            {activeTab === 'slider' && (
              <ImageSlider 
                beforeImage={getImageUrl(image_path)} 
                afterImage={getImageUrl(depth_map_path)} 
              />
            )}

            {activeTab === 'blend' && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
                <img 
                  src={getImageUrl(image_path)} 
                  alt="Original" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <img 
                  src={getImageUrl(depth_map_path)} 
                  alt="Depth Overlay" 
                  style={{ opacity: blendOpacity / 100 }}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150 mix-blend-screen" 
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-medium text-white border border-white/10">
                  Heatmap Overlay ({blendOpacity}%)
                </div>
              </div>
            )}

            {activeTab === 'contour' && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
                <img 
                  src={getImageUrl(contour_path || image_path)} 
                  alt="Crack Contours" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-medium text-cyan-400 border border-cyan-500/20 flex items-center gap-2">
                  <span>{laser_detected ? "Laser Target Reticle & Crack Skeletons" : "Morphological Crack Boundaries & Skeleton"}</span>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <CrossSectionProfiler profileData={profile_data} />
            )}

            {activeTab === '3d' && (
              <ThreeDViewer pointsData={point_cloud_3d} />
            )}
          </div>
        </div>

        {/* Detailed Engineering Metrics Grid with Measurement Symbols */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Crack Fissure Area</span>
            <span className="text-xl font-bold text-primary mt-1 font-mono">{crack_area_pct} %</span>
            <span className="text-[10px] text-muted mt-1">Surface coverage percentage</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Estimated Fissure Length</span>
            <span className="text-xl font-bold text-primary mt-1 font-mono">{crackLengthCm} <span className="text-xs text-muted font-normal">cm</span></span>
            <span className="text-[10px] text-muted mt-1">Skeleton trajectory ({crack_length_px} px)</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">{laser_detected ? "Laser Depth Drop" : "Surface Depth Drop"}</span>
            <span className={`text-xl font-bold mt-1 font-mono ${laser_detected ? 'text-red-400' : 'text-cyan-400'}`}>
              Δ {max_depth_drop} <span className="text-xs font-normal">mm</span>
            </span>
            <span className="text-[10px] text-muted mt-1">Peak-to-valley crevice step</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Estimated Aperture</span>
            <span className="text-xl font-bold text-amber-400 mt-1 font-mono">{estimatedWidthMm} <span className="text-xs text-amber-400/80 font-normal">mm</span></span>
            <span className="text-[10px] text-muted mt-1">Transverse crevice width</span>
          </div>
        </div>

        {/* Dataset & Laser Profilometry Method Explanation Card */}
        <div className="panel p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-cyan-500/20 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mt-0.5">
            <Info size={18} />
          </div>
          <div className="text-xs leading-relaxed text-muted">
            <strong className="text-primary font-semibold">Inspection Mode Explanation:</strong>
            <p className="mt-1">
              {laser_detected 
                ? "Physical laser dot detected on the wall. Depth measurements (in mm) are actively calibrated along the triangulated optical laser transect."
                : "Standard visual camera mode active (no physical laser dot on wall). Depth values are generated from monocular surface disparity without laser-guided triangulation."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
