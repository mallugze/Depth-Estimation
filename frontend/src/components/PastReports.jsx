import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Trash2, Eye, Filter, 
  Calendar, CheckCircle2, AlertTriangle, X 
} from 'lucide-react';
import { API_BASE_URL, getImageUrl } from '../config';

export default function PastReports({ onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewModalReport, setPreviewModalReport] = useState(null);
  const itemsPerPage = 10;

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/reports`;
      const params = new URLSearchParams();
      if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err.message);
      // Fallback sample reports for demo
      setReports([
        {
          id: 101,
          filename: "bridge_deck_fissure_scan.jpg",
          prediction: "crack",
          confidence: 0.982,
          severity: "HIGH",
          severity_score: 79.4,
          crack_area_pct: 12.4,
          max_depth_drop: 38.6,
          depth_std: 174.2,
          image_path: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
          depth_map_path: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 102,
          filename: "pavement_joint_normal.jpg",
          prediction: "no_crack",
          confidence: 0.965,
          severity: "CLEAR",
          severity_score: 12.0,
          crack_area_pct: 0.0,
          max_depth_drop: 8.2,
          depth_std: 34.5,
          image_path: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
          depth_map_path: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedSeverity, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleDeleteReport = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this inspection record?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
        if (previewModalReport && previewModalReport.id === id) {
          setPreviewModalReport(null);
        }
      }
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently clear ALL inspection records?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reports`, { method: 'DELETE' });
      if (res.ok) {
        setReports([]);
        setPreviewModalReport(null);
      }
    } catch (err) {
      alert('Failed to clear reports: ' + err.message);
    }
  };

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);

  const getSeverityBadge = (level) => {
    const l = (level || 'clear').toLowerCase();
    switch (l) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-clear';
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Inspection Records & Archive</h2>
          <p className="text-sm text-muted mt-1">Review, filter, and export historical structural scans.</p>
        </div>

        <div className="flex items-center gap-3">
          {reports.length > 0 && (
            <>
              <button 
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 size={13} />
                Clear All
              </button>

              <a 
                href={`${API_BASE_URL}/reports/export/csv`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm transition-colors"
              >
                <Download size={13} />
                Export CSV
              </a>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search by filename..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-card border border-border rounded-lg text-primary focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-surface-hover text-primary transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-surface-card p-1 rounded-lg border border-border">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'CLEAR'].map((sev) => (
              <button
                key={sev}
                onClick={() => { setSelectedSeverity(sev); setCurrentPage(1); }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  selectedSeverity === sev 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm' 
                    : 'text-muted hover:text-primary'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="text-xs bg-surface-card border border-border text-primary rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="CRACK">Cracks Only</option>
            <option value="CLEAR">Clear Only</option>
          </select>
        </div>
      </div>

      {/* Table Panel */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-56">
            <div className="w-8 h-8 border-3 border-surface border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-muted text-xs flex flex-col items-center gap-2">
            <Filter size={24} className="text-slate-600" />
            <span>No inspection records match the selected filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-card text-muted uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5 border-b border-border">Timestamp</th>
                  <th className="px-5 py-3.5 border-b border-border">Inspection File</th>
                  <th className="px-5 py-3.5 border-b border-border">Classification</th>
                  <th className="px-5 py-3.5 border-b border-border">Confidence</th>
                  <th className="px-5 py-3.5 border-b border-border">Severity Level</th>
                  <th className="px-5 py-3.5 border-b border-border">Fissure Area</th>
                  <th className="px-5 py-3.5 border-b border-border">Depth Discontinuity</th>
                  <th className="px-5 py-3.5 border-b border-border text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {currentItems.map((report) => {
                  const isCrack = report.prediction.toLowerCase().includes('crack') && !report.prediction.toLowerCase().includes('no');

                  return (
                    <tr 
                      key={report.id} 
                      onClick={() => setPreviewModalReport(report)}
                      className="hover:bg-surface-hover/30 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-muted whitespace-nowrap font-mono">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-primary max-w-[160px] truncate" title={report.filename}>
                        {report.filename}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCrack ? 'bg-rose-500 shadow-glow-rose' : 'bg-emerald-500'}`}></span>
                          <span className="text-primary font-semibold">{report.prediction}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-primary">
                        {(report.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${getSeverityBadge(report.severity)}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted">
                        {report.crack_area_pct ? `${report.crack_area_pct}%` : '0%'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-cyan-400 font-medium">
                        {report.max_depth_drop ? report.max_depth_drop : (report.depth_std ? report.depth_std.toFixed(2) : '0.00')}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewModalReport(report); }}
                            className="p-1.5 rounded bg-surface hover:bg-surface-hover text-muted hover:text-cyan-400 border border-border transition-colors"
                            title="Inspect Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            className="p-1.5 rounded bg-surface hover:bg-rose-500/20 text-muted hover:text-rose-400 border border-border transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {reports.length > itemsPerPage && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-card/60 text-xs">
            <span className="text-muted">
              Showing <strong className="text-primary">{indexOfFirstItem + 1}</strong> to <strong className="text-primary">{Math.min(indexOfLastItem, reports.length)}</strong> of <strong className="text-primary">{reports.length}</strong>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 font-medium rounded-lg text-primary bg-surface border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 font-medium rounded-lg text-primary bg-surface border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Preview Modal */}
      {previewModalReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="panel bg-[#0d111a] border border-cyan-500/30 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-surface-card border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary">{previewModalReport.filename}</h3>
                <span className="text-[11px] text-muted font-mono">{formatDate(previewModalReport.created_at)}</span>
              </div>
              <button 
                onClick={() => setPreviewModalReport(null)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-surface-hover"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">Original Surface Scan</span>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <img 
                      src={getImageUrl(previewModalReport.image_path)} 
                      alt="Original" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">Depth Heatmap</span>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <img 
                      src={getImageUrl(previewModalReport.depth_map_path)} 
                      alt="Depth Heatmap" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-surface-card rounded-lg border border-border">
                  <div className="text-[11px] text-muted">Classification</div>
                  <div className="text-sm font-bold text-primary">{previewModalReport.prediction}</div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">{(previewModalReport.confidence * 100).toFixed(1)}% Conf.</div>
                </div>

                <div className="p-3 bg-surface-card rounded-lg border border-border">
                  <div className="text-[11px] text-muted">Severity Status</div>
                  <div className="mt-1">
                    <span className={`badge ${getSeverityBadge(previewModalReport.severity)}`}>
                      {previewModalReport.severity}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface-card rounded-lg border border-border">
                  <div className="text-[11px] text-muted">Depth Discontinuity</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {previewModalReport.max_depth_drop || (previewModalReport.depth_std ? previewModalReport.depth_std.toFixed(2) : '0.00')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-card border-t border-border flex justify-end">
              <button 
                onClick={() => setPreviewModalReport(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-surface-hover text-primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
