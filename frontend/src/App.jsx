import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadDropzone from './components/UploadDropzone';
import AnalysisResults from './components/AnalysisResults';
import PastReports from './components/PastReports';
import Dashboard from './components/Dashboard';
import BatchInspection from './components/BatchInspection';
import ModelDiagnostics from './components/ModelDiagnostics';
import { API_BASE_URL, SAMPLE_DEMO_RESULT } from './config';
import { Sliders, Sparkles, Play, Trash2, ArrowLeft, Eye } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'inspection', 'batch', 'reports', 'diagnostics'
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Inspection options
  const [structureType, setStructureType] = useState('General Concrete');
  const [colormap, setColormap] = useState('INFERNO');

  const handleFileDrop = (selectedFile) => {
    setFile(selectedFile);
    setResults(null);
    setError(null);
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
  };

  const handleLoadDemo = () => {
    setResults(SAMPLE_DEMO_RESULT);
    setPreview(SAMPLE_DEMO_RESULT.image_path);
    setError(null);
    setCurrentView('inspection');
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('structure_type', structureType);
    formData.append('colormap', colormap);

    try {
      const endpoint = `${API_BASE_URL}/analyze-image`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed with status ${response.status}.`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(
        `${err.message || 'An unexpected error occurred.'} (If running in cloud without local backend, click 'Explore Demo Scan' below).`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090a0f] relative overflow-hidden font-sans text-slate-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 flex flex-col z-10 overflow-y-auto">
        <Header currentView={currentView} />
        
        <div className="p-6 md:p-8 w-full max-w-6xl mx-auto flex-1">
          {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} onLoadDemo={handleLoadDemo} />}
          {currentView === 'batch' && <BatchInspection onSelectReport={(rep) => { setResults(rep); setCurrentView('inspection'); }} />}
          {currentView === 'reports' && <PastReports onSelectReport={(rep) => { setResults(rep); setCurrentView('inspection'); }} />}
          {currentView === 'diagnostics' && <ModelDiagnostics />}
          
          {currentView === 'inspection' && (
            <>
              {!preview && !results && (
                <div className="mt-4 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-primary">New Surface Inspection</h2>
                      <p className="text-xs text-muted mt-1">Upload a high-resolution concrete scan to classify anomalies, estimate depth, and render 3D topography.</p>
                    </div>

                    <button
                      onClick={handleLoadDemo}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-sm transition-all"
                    >
                      <Sparkles size={14} />
                      <span>Explore Demo Scan</span>
                    </button>
                  </div>
                  <UploadDropzone onDrop={handleFileDrop} />
                </div>
              )}

              {preview && !results && (
                <div className="mt-4 animate-in fade-in duration-300">
                  <div className="panel p-6 flex flex-col items-center gap-6 relative overflow-hidden">
                    
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-50 animate-in fade-in">
                        <div className="w-12 h-12 border-3 border-slate-700 border-t-cyan-400 rounded-full animate-spin"></div>
                        <div className="text-center">
                          <p className="text-primary text-sm font-bold">Computing Multi-Signal Inference...</p>
                          <p className="text-xs text-muted mt-1">Classifying cracks • Estimating depth • Profiling cross-sections</p>
                        </div>
                      </div>
                    )}

                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-border">
                      <div>
                        <h3 className="text-sm font-bold text-primary">Inspection Configuration</h3>
                        <p className="text-xs text-muted">Select structural context and visualization colormap</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">Asset Type:</span>
                          <select 
                            value={structureType} 
                            onChange={(e) => setStructureType(e.target.value)}
                            className="text-xs bg-surface-card border border-border text-primary rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-accent"
                          >
                            <option value="General Concrete">General Concrete</option>
                            <option value="Bridge Deck">Bridge Deck</option>
                            <option value="Pavement">Pavement</option>
                            <option value="Retaining Wall">Retaining Wall</option>
                            <option value="Tunnel Lining">Tunnel Lining</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">Depth Colormap:</span>
                          <select 
                            value={colormap} 
                            onChange={(e) => setColormap(e.target.value)}
                            className="text-xs bg-surface-card border border-border text-primary rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-accent"
                          >
                            <option value="INFERNO">Inferno (Default)</option>
                            <option value="PLASMA">Plasma</option>
                            <option value="VIRIDIS">Viridis</option>
                            <option value="TURBO">Turbo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-black/40 rounded-xl p-2 border border-border overflow-hidden">
                      <img src={preview} alt="Upload preview" className="max-w-full max-h-[420px] object-contain rounded-lg mx-auto" />
                    </div>
                    
                    {error && (
                      <div className="w-full p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-400 text-xs">
                        <div>{error}</div>
                        <button
                          onClick={handleLoadDemo}
                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded font-semibold text-[11px] whitespace-nowrap transition-colors"
                        >
                          Load Demo Analysis
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 self-end w-full sm:w-auto">
                      <button 
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold text-xs text-muted hover:text-primary bg-surface border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
                        onClick={handleClear} 
                        disabled={isAnalyzing}
                      >
                        Cancel
                      </button>
                      <button 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-glow-cyan transition-all disabled:opacity-50"
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                      >
                        <Play size={14} />
                        <span>Execute Deep Analysis</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {results && (
                <div className="mt-4 animate-in fade-in duration-300 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <button 
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-muted hover:text-primary bg-surface border border-border hover:bg-surface-hover transition-colors"
                      onClick={handleClear}
                    >
                      <ArrowLeft size={13} />
                      <span>Start New Scan</span>
                    </button>

                    <button 
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                      onClick={handleLoadDemo}
                    >
                      <Sparkles size={13} />
                      <span>Reload Demo Benchmark</span>
                    </button>
                  </div>
                  <AnalysisResults results={results} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
