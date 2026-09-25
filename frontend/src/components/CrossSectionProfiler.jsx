import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Activity, ArrowDown, TrendingDown, Radio, Zap, Info } from 'lucide-react';

export default function CrossSectionProfiler({ profileData = [] }) {
  const [laserBeamActive, setLaserBeamActive] = useState(true);

  if (!profileData || profileData.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted">
        No laser cross-section profile data available.
      </div>
    );
  }

  // Calculate slice metrics
  const depths = profileData.map(p => p.depth);
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const depthDrop = (maxDepth - minDepth).toFixed(2);
  const avgDepth = (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(2);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Laser Profilometry Banner */}
      <div className="p-3 bg-gradient-to-r from-red-950/40 via-cyan-950/30 to-surface-card border border-red-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shadow-glow-rose">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-primary">Virtual Laser Beam Profilometry</h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                λ = 650nm Red Laser Sim
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              Depth calculated via optical laser disparity simulating physical triangulating laser distance sensors.
            </p>
          </div>
        </div>

        <button
          onClick={() => setLaserBeamActive(!laserBeamActive)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 self-start sm:self-auto ${
            laserBeamActive 
              ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm' 
              : 'bg-surface text-muted border border-border hover:text-primary'
          }`}
        >
          <Zap size={13} className={laserBeamActive ? 'text-red-400 fill-red-400' : ''} />
          <span>{laserBeamActive ? 'Laser Transect ACTIVE' : 'Laser Muted'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Laser Baseline Mean</div>
            <div className="text-sm font-bold text-primary font-mono">{avgDepth}</div>
          </div>
        </div>

        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowDown size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Peak-to-Valley Drop</div>
            <div className="text-sm font-bold text-amber-400 font-mono">Δ {depthDrop}</div>
          </div>
        </div>

        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Min Crevice Level</div>
            <div className="text-sm font-bold text-rose-400 font-mono">{minDepth.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Cross-Section Area Chart */}
      <div className="p-4 bg-surface-card rounded-xl border border-border relative overflow-hidden">
        {/* Animated Laser Scanning Beam overlay across top */}
        {laserBeamActive && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_8px_#ef4444] z-10"></div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>1D Optical Laser Depth Transect</span>
              {laserBeamActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
            </h4>
            <p className="text-[11px] text-muted">Continuous depth cross-section profile calculated from monocular laser disparity</p>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            {profileData.length} Laser Samples
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="laserDepthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={laserBeamActive ? "#06b6d4" : "#3b82f6"} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={laserBeamActive ? "#ef4444" : "#1e293b"} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="index" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-slate-900/95 border border-red-500/40 rounded-lg shadow-xl text-xs">
                        <div className="text-muted font-medium mb-1">Laser Transect Node #{data.index} (x: {data.x}px)</div>
                        <div className="text-cyan-400 font-bold font-mono">Calculated Depth: {data.depth}</div>
                        <div className="text-[10px] text-red-400 font-mono mt-0.5">Laser Triangulation Disparity</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="depth" 
                stroke={laserBeamActive ? "#06b6d4" : "#64748b"} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#laserDepthGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted font-mono">
          <span>Surface Coordinate: X-Axis Transect</span>
          <span className="text-red-400/90 font-semibold">Triangulated Relative Crevice Distance</span>
        </div>
      </div>
    </div>
  );
}
