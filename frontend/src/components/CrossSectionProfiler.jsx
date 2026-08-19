import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ArrowDown, TrendingDown } from 'lucide-react';

export default function CrossSectionProfiler({ profileData = [] }) {
  if (!profileData || profileData.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted">
        No cross-section profile data available.
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
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Mean Depth</div>
            <div className="text-sm font-bold text-primary font-mono">{avgDepth}</div>
          </div>
        </div>

        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowDown size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Peak-to-Valley Drop</div>
            <div className="text-sm font-bold text-primary font-mono">{depthDrop}</div>
          </div>
        </div>

        <div className="p-3 bg-surface-card rounded-lg border border-border flex items-center gap-3">
          <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted">Min Crevice Level</div>
            <div className="text-sm font-bold text-primary font-mono">{minDepth.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Cross-Section Area Chart */}
      <div className="p-4 bg-surface-card rounded-xl border border-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">1D Surface Depth Profile</h4>
            <p className="text-[11px] text-muted">Continuous depth cross-section slice across the structural surface</p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            {profileData.length} Sample Points
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
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
                      <div className="p-2.5 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs">
                        <div className="text-muted font-medium mb-1">Point {data.index} (x: {data.x}, y: {data.y})</div>
                        <div className="text-cyan-400 font-bold font-mono">Depth: {data.depth}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="depth" 
                stroke="#06b6d4" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#depthGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
