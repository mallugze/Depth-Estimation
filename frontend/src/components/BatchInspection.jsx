import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Download, Play, Trash2, ArrowRight } from 'lucide-react';
import { API_BASE_URL, getImageUrl } from '../config';
import { analyzeImageClientSide } from '../utils/clientAnalyzer';

export default function BatchInspection({ onSelectReport }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchResults, setBatchResults] = useState(null);
  const [structureType, setStructureType] = useState('General Concrete');
  const fileInputRef = useRef(null);

  const handleFilesSelected = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(selected);
      setBatchResults(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFiles(dropped);
      setBatchResults(null);
    }
  };

  const handleProcessBatch = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);

    if (API_BASE_URL) {
      const formData = new FormData();
      files.forEach(f => {
        formData.append('files', f);
      });
      formData.append('structure_type', structureType);

      try {
        setProgress(30);
        const res = await fetch(`${API_BASE_URL}/analyze-batch`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          setProgress(90);
          const data = await res.json();
          setBatchResults(data);
          setProgress(100);
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, processing batch client-side...', err);
      }
    }

    // Client-side batch fallback
    try {
      const reports = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rep = await analyzeImageClientSide(file, structureType, 'INFERNO');
        reports.push(rep);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setBatchResults({ reports });
    } catch (err) {
      console.error(err);
      alert('Error during batch analysis: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setBatchResults(null);
    setProgress(0);
  };

  // Compute batch statistics if results available
  const totalCount = batchResults ? batchResults.reports.length : 0;
  const crackCount = batchResults ? batchResults.reports.filter(r => r.prediction.toLowerCase().includes('crack') && !r.prediction.toLowerCase().includes('no')).length : 0;
  const clearCount = totalCount - crackCount;
  const defectRate = totalCount > 0 ? ((crackCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Batch Structural Inspection</h2>
          <p className="text-sm text-muted mt-1">Upload and inspect multiple structural surface scans simultaneously.</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={structureType} 
            onChange={(e) => setStructureType(e.target.value)}
            className="text-xs bg-surface border border-border text-primary rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-accent"
          >
            <option value="General Concrete">General Concrete</option>
            <option value="Bridge Deck">Bridge Deck</option>
            <option value="Pavement">Pavement</option>
            <option value="Retaining Wall">Retaining Wall</option>
            <option value="Tunnel Lining">Tunnel Lining</option>
          </select>

          {batchResults && (
            <button 
              onClick={() => {
                const csvHeader = "ID,Filename,Classification,Confidence,Severity,Crack_Area_Pct\n";
                const csvRows = batchResults.reports.map(r => 
                  `${r.id},"${r.filename}",${r.prediction},${r.confidence},${r.severity},${r.crack_area_pct || 0}`
                ).join("\n");
                const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `StructurAI_Batch_${Date.now()}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {!batchResults && (
        <div className="panel p-6 flex flex-col gap-5">
          <div 
            className="border-2 border-dashed border-border hover:border-cyan-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-surface-card/40 hover:bg-cyan-500/5"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFilesSelected}
              className="hidden" 
            />
            
            <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
              <UploadCloud size={32} />
            </div>

            <h3 className="text-sm font-semibold text-primary mb-1">
              Select or Drop Multiple Structural Images
            </h3>
            <p className="text-xs text-muted max-w-sm">
              Supports JPEG, PNG inspection files. Upload 5 to 50+ images for rapid automated defect scanning.
            </p>
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Selected <strong className="text-primary">{files.length}</strong> image{files.length > 1 ? 's' : ''}</span>
                <button onClick={handleClear} className="text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  <Trash2 size={12} /> Clear Selection
                </button>
              </div>

              {isProcessing && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-muted">
                    <span className="text-cyan-400">Processing deep inference batch...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-muted hover:text-primary bg-surface border border-border transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessBatch}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-glow-cyan transition-all disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>Start Batch Analysis ({files.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Results View */}
      {batchResults && (
        <div className="flex flex-col gap-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted">Total Processed</span>
              <span className="text-2xl font-bold text-primary mt-1 font-mono">{totalCount}</span>
            </div>

            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted">Defects Detected</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-rose-400 font-mono">{crackCount}</span>
                <span className="text-xs text-rose-400 font-medium">({defectRate}%)</span>
              </div>
            </div>

            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted">Structurally Sound</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-400 font-mono">{clearCount}</span>
                <span className="text-xs text-emerald-400 font-medium">({(100 - defectRate).toFixed(1)}%)</span>
              </div>
            </div>

            <div className="panel p-4 flex flex-col justify-between">
              <span className="text-xs font-medium text-muted">Batch Status</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 size={16} /> Complete
              </span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">Processed Inspection Cards</h3>
              <button 
                onClick={handleClear}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Start New Batch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchResults.reports.map((report) => {
                const isCrack = report.prediction.toLowerCase().includes('crack') && !report.prediction.toLowerCase().includes('no');
                const sevLower = report.severity.toLowerCase();

                return (
                  <div 
                    key={report.id}
                    className="p-3 bg-surface-card rounded-xl border border-border hover:border-cyan-500/40 transition-all flex flex-col gap-3 group"
                  >
                    <div className="grid grid-cols-2 gap-2 h-28 rounded-lg overflow-hidden bg-black/40">
                      <img 
                        src={getImageUrl(report.image_path)} 
                        alt="Original" 
                        className="w-full h-full object-cover" 
                      />
                      <img 
                        src={getImageUrl(report.depth_map_path)} 
                        alt="Depth" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary truncate max-w-[140px]" title={report.filename}>
                          {report.filename}
                        </span>
                        <span className={`badge ${isCrack ? 'badge-high' : 'badge-clear'}`}>
                          {report.prediction}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>Confidence: <strong className="text-primary">{(report.confidence * 100).toFixed(1)}%</strong></span>
                        <span className={`badge ${
                          sevLower === 'critical' ? 'badge-critical' :
                          sevLower === 'high' ? 'badge-high' :
                          sevLower === 'medium' ? 'badge-medium' : 'badge-clear'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
