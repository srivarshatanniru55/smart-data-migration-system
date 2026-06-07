import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Terminal, 
  RefreshCw, 
  ChevronRight,
  Database,
  ArrowRightLeft,
  X
} from 'lucide-react';
import ExtractedInfoModal from '../components/ExtractedInfoModal';

export default function Logs({ setMigrationSessionId, setCurrentPage, onViewExtraction }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Slide drawer state for inspecting log details
  const [inspectMig, setInspectMig] = useState(null);
  
  // Details Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExtractedData, setSelectedExtractedData] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/migration/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this log?')) {
      try {
        const res = await fetch(`/api/migration/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchLogs();
          if (inspectMig && inspectMig._id === id) setInspectMig(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apexium_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter(mig => {
    const matchesSearch = mig.sourceUrl.toLowerCase().includes(search.toLowerCase()) || 
                          mig.destinationUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col lg:flex-row gap-8 animate-fade-in relative">
      
      {/* Primary Logs list panel */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Operational Log Auditing</h2>
            <p className="text-xs text-slate-400">Search and audit automation executions and trace target page transactions.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={fetchLogs}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Searching & Filter utilities */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text" 
              placeholder="Search source or destination URLs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-semibold text-slate-600"
          >
            <option value="all">All Statuses</option>
            <option value="extracted">Extracted</option>
            <option value="migrating">Migrating</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex-1 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400">
            <p className="text-sm font-semibold">No operational records matches your filters</p>
            <p className="text-xs mt-1">Try broadening your search text or start a new automation session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Extraction Source</th>
                  <th className="py-3 px-4">Destination target</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredLogs.map(mig => (
                  <tr 
                    key={mig._id}
                    onClick={() => setInspectMig(mig)}
                    className={`hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-50 ${inspectMig?._id === mig._id ? 'bg-slate-100/50' : ''}`}
                  >
                    <td className="py-4 px-4 max-w-[200px] text-slate-800 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="truncate flex-1" title={mig.sourceUrl}>{mig.sourceUrl}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-[200px] truncate font-mono text-[10px]">
                      {mig.destinationUrl}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        mig.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      } ${
                        mig.status === 'failed' && 'bg-rose-50 text-rose-700 border-rose-100'
                      } ${
                        ['migrating', 'extracting'].includes(mig.status) && 'bg-cyan-50 text-cyan-700 border-cyan-100 animate-pulse'
                      } ${
                        ['pending', 'extracted'].includes(mig.status) && 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {mig.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">
                      {new Date(mig.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onViewExtraction(mig._id, 'logs')}
                        title="View Extracted Form Info"
                        className="px-2.5 py-1.5 border border-teal-200 text-teal-600 hover:bg-teal-50 rounded-lg text-[10px] font-bold uppercase transition-all inline-flex"
                      >
                        View Form
                      </button>
                      <button 
                        onClick={() => {
                          setMigrationSessionId(mig._id);
                          setCurrentPage('wizard');
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600 text-slate-400 transition-all inline-flex"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(mig._id, e)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:border-rose-200 hover:bg-rose-50 hover:text-rose-650 text-slate-400 transition-all inline-flex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Slide inspect Drawer panel */}
      {inspectMig && (
        <div className="w-full lg:w-96 bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col h-[580px] lg:h-auto animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                Log Trace session
              </span>
            </div>
            <button 
              onClick={() => setInspectMig(null)}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Scraped Target</span>
              <p className="font-bold text-white font-mono text-[10px] truncate">{inspectMig.sourceUrl}</p>
            </div>
            
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Form Destination</span>
              <p className="font-bold text-white font-mono text-[10px] truncate">{inspectMig.destinationUrl}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">Step logs</span>
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5 font-mono text-[10px] max-h-72 overflow-y-auto text-emerald-400">
                {inspectMig.logs.length === 0 ? (
                  <p className="text-slate-600 italic">No operational logs recorded.</p>
                ) : (
                  inspectMig.logs.map((log, i) => (
                    <div key={i} className="break-all border-b border-slate-950 pb-1 leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {inspectMig.screenshot && (
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">Viewport screenshot</span>
                <img 
                  src={inspectMig.screenshot} 
                  alt="Session State" 
                  className="w-full rounded-lg border border-slate-800 h-32 object-cover bg-slate-950" 
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Extracted Data Inspector Modal */}
      <ExtractedInfoModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setSelectedExtractedData(null);
        }} 
        extractedData={selectedExtractedData}
      />
    </div>
  );
}
