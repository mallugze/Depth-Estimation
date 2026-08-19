import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Target, Layers, ShieldCheck, AlertOctagon, TrendingUp, ImagePlus, ArrowRight, Zap } from 'lucide-react';

export default function Dashboard({ setCurrentView }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/analytics/summary');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-3 border-surface border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalScans = analytics?.total_scans || 0;
  const crackCount = analytics?.crack_count || 0;
  const clearCount = analytics?.clear_count || 0;
  const anomalyRate = analytics?.anomaly_rate || 0;
  const sevCounts = analytics?.severity_counts || { CLEAR: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const criticalHigh = (sevCounts.HIGH || 0) + (sevCounts.CRITICAL || 0);

  const pieData = [
    { name: 'Anomalies Detected', value: crackCount },
    { name: 'Structurally Sound', value: clearCount },
  ];
  const PIE_COLORS = ['#f43f5e', '#10b981'];

  const barData = [
    { name: 'Clear', count: sevCounts.CLEAR || 0, fill: '#10b981' },
    { name: 'Low', count: sevCounts.LOW || 0, fill: '#3b82f6' },
    { name: 'Medium', count: sevCounts.MEDIUM || 0, fill: '#f59e0b' },
    { name: 'High', count: sevCounts.HIGH || 0, fill: '#f97316' },
    { name: 'Critical', count: sevCounts.CRITICAL || 0, fill: '#f43f5e' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Structural Analytics Command Hub</h2>
          <p className="text-sm text-muted mt-1">Real-time deep inference intelligence across concrete assets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('batch')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-primary bg-surface border border-border hover:bg-surface-hover transition-colors"
          >
            <Layers size={14} className="text-cyan-400" />
            <span>Batch Upload</span>
          </button>
          <button 
            onClick={() => setCurrentView('inspection')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-glow-cyan transition-all"
          >
            <ImagePlus size={14} />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Total Scans</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-primary font-mono">{totalScans}</span>
            <div className="text-[11px] text-muted mt-1">Verified structural inferences</div>
          </div>
        </div>

        <div className="panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Anomaly Defect Rate</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Target size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400 font-mono">{anomalyRate}%</span>
              <span className="text-xs text-muted">({crackCount} detected)</span>
            </div>
            <div className="text-[11px] text-muted mt-1">Fissures & crack anomalies</div>
          </div>
        </div>

        <div className="panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">High & Critical Alerts</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{criticalHigh}</span>
            <div className="text-[11px] text-muted mt-1">Requiring immediate engineering review</div>
          </div>
        </div>

        <div className="panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Mean Severity Index</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {analytics?.avg_severity_score || 0}/100
            </span>
            <div className="text-[11px] text-muted mt-1">Composite structural health score</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Classification Distribution */}
        <div className="panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-primary">Defect Detection Ratio</h3>
            <span className="text-[11px] text-muted font-mono">YOLOv8 Engine</span>
          </div>

          <div className="h-64 w-full">
            {totalScans === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No scan data available. Perform an inspection to populate chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Detected ({crackCount})
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Sound ({clearCount})
            </div>
          </div>
        </div>

        {/* Severity Variance Profile */}
        <div className="panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-primary">Structural Severity Distribution</h3>
            <span className="text-[11px] text-muted font-mono">MiDaS & CSDD</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quick Launch Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setCurrentView('inspection')}
          className="panel p-5 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <ImagePlus size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary">Single Surface Scan</h4>
              <p className="text-[11px] text-muted mt-0.5">High-precision 3D & cross-section analysis</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div 
          onClick={() => setCurrentView('batch')}
          className="panel p-5 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary">Batch Analysis Mode</h4>
              <p className="text-[11px] text-muted mt-0.5">Upload 50+ images for automated processing</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div 
          onClick={() => setCurrentView('diagnostics')}
          className="panel p-5 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary">Model Benchmarks</h4>
              <p className="text-[11px] text-muted mt-0.5">Cross-dataset validation & accuracy</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}
