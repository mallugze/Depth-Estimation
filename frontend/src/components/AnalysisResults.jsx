import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ImageSlider from './ImageSlider';
import ThreeDViewer from './ThreeDViewer';
import CrossSectionProfiler from './CrossSectionProfiler';
import { 
  Download, Layers, Eye, Sliders, Activity, 
  ShieldCheck, AlertTriangle, Box, TrendingDown, Maximize2 
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
    depth_std, 
    crack_area_pct = 0,
    crack_length_px = 0,
    max_depth_drop = 0,
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
          <div className="flex items-center gap-3">
            <span className={`badge ${getSeverityBadgeClass()}`}>
              {severity} SEVERITY
            </span>
            <span className="text-xs text-muted font-mono">{structure_type}</span>
          </div>
          <h2 className="text-xl font-bold text-primary mt-1">Multi-Signal Inspection Assessment</h2>
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
                  ? `Fissure detected with ${formattedConfidence} confidence. Depth step discontinuity indicates ${severity.toLowerCase()} structural risk level.`
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
              <span className="text-[11px] text-muted font-medium">Depth Variance (\u03C3)</span>
              <div className="text-base font-bold text-cyan-400 font-mono">{depth_std.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Visual Inspection Workspace with Multi-Tab Modes */}
        <div className="panel p-4 flex flex-col gap-4">
          
          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-1 bg-surface-card p-1 rounded-lg border border-border">
              {[
                { id: 'slider', label: 'Split Slider', icon: Sliders },
                { id: 'blend', label: 'Heatmap Blend', icon: Layers },
                { id: 'contour', label: 'Crack Contours', icon: Eye },
                { id: 'profile', label: 'Cross-Section', icon: Activity },
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
                beforeImage={`http://localhost:8000${image_path}`} 
                afterImage={`http://localhost:8000${depth_map_path}`} 
              />
            )}

            {activeTab === 'blend' && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
                <img 
                  src={`http://localhost:8000${image_path}`} 
                  alt="Original" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <img 
                  src={`http://localhost:8000${depth_map_path}`} 
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
                  src={`http://localhost:8000${contour_path || image_path}`} 
                  alt="Crack Contours" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
                  Morphological Crack Boundaries & Skeleton
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

        {/* Detailed Engineering Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Crack Fissure Area</span>
            <span className="text-xl font-bold text-primary mt-1 font-mono">{crack_area_pct}%</span>
            <span className="text-[10px] text-muted mt-1">Surface coverage ratio</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Estimated Crack Length</span>
            <span className="text-xl font-bold text-primary mt-1 font-mono">{crack_length_px} px</span>
            <span className="text-[10px] text-muted mt-1">Fissure skeleton trajectory</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Max Depth Discontinuity</span>
            <span className="text-xl font-bold text-cyan-400 mt-1 font-mono">{max_depth_drop}</span>
            <span className="text-[10px] text-muted mt-1">Step gradient along boundary</span>
          </div>

          <div className="panel p-4 flex flex-col">
            <span className="text-[11px] font-medium text-muted">Global Variance (\u03C3)</span>
            <span className="text-xl font-bold text-primary mt-1 font-mono">{depth_std.toFixed(2)}</span>
            <span className="text-[10px] text-muted mt-1">Planar depth standard dev</span>
          </div>
        </div>

      </div>
    </div>
  );
}
