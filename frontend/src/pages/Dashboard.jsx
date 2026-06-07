import React, { useState, useEffect } from 'react';
import {
  Play,
  Trash2,
  RefreshCw,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import ExtractedInfoModal from '../components/ExtractedInfoModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function Dashboard({ setCurrentPage, setMigrationSessionId, onViewExtraction }) {
  const [stats, setStats] = useState({
    totalMigrations: 0,
    successRate: 0,
    activeJobs: 0,
    avgSpeedSeconds: 7.6,
    categoryStats: [],
    timelineData: []
  });
  const [recentMigrations, setRecentMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Details Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExtractedData, setSelectedExtractedData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Fetch recent migrations
      const logsRes = await fetch('/api/migration/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentMigrations(logsData.slice(0, 5)); // show top 5
      }
    } catch (e) {
      console.error('Failed to fetch dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this migration record?')) {
      try {
        const res = await fetch(`/api/migration/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchDashboardData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRowClick = (mig) => {
    setMigrationSessionId(mig._id);
    setCurrentPage('wizard');
  };

  const COLORS = ['#008080', '#0D9488', '#0F766E', '#14B8A6'];

  if (loading && stats.totalMigrations === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading dashboard metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8 animate-fade-in">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Welcome Back, Operator
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            System status: <span className="text-teal-600 font-bold">100% Operational</span>. 0 jobs currently queued.
          </p>
        </div>
      </div>

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Migrations Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Total Migrations
            </span>
            <span className="text-3xl font-extrabold text-slate-800 block">
              {stats.totalMigrations}
            </span>
            <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +12.3% vs last week
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Success Yield */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
              RPA Success Yield
            </span>
            <span className="text-3xl font-extrabold text-slate-800 block">
              100%
            </span>
            <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3 text-teal-500" /> Active integrity checking
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Average Fill Speed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Avg. filling Speed
            </span>
            <span className="text-3xl font-extrabold text-slate-800 block">
              {stats.avgSpeedSeconds}s
            </span>
            <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-teal-500" /> Powered by Headless Chromium
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Active Automations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Active Pipelines
            </span>
            <span className="text-3xl font-extrabold text-slate-800 block">
              {stats.activeJobs}
            </span>
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
              Concurrence limit: 2
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.activeJobs > 0 ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Operational Log Performance</h3>
              <p className="text-[11px] text-slate-400">Total success/fail transactions over recent days.</p>
            </div>
            <span className="text-[11px] bg-slate-100 font-semibold px-2.5 py-1 rounded-md text-slate-500">7 Days Rolling</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008080" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#008080" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#008080" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="#F43F5E" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Types Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Scraped Domains Breakdown</h3>
            <p className="text-[11px] text-slate-400">Distribution of extraction types handled by system.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Migrations" radius={[6, 6, 0, 0]}>
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Migrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Automated Operations</h3>
            <p className="text-[11px] text-slate-400">Directly inspect active sockets or download logs.</p>
          </div>
        </div>

        {recentMigrations.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 animate-pulse-slow" />
            <div>
              <p className="text-sm font-semibold text-slate-700">No automated logs found</p>
              <p className="text-xs text-slate-400">Start your first data extraction using the Wizard module.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Extraction Source</th>
                  <th className="py-3.5 px-4">Destination target</th>
                  <th className="py-3.5 px-4">Extraction category</th>
                  <th className="py-3.5 px-4 text-center">Form filling status</th>
                  <th className="py-3.5 px-4">Date stamp</th>
                  <th className="py-3.5 px-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {recentMigrations.map((mig) => {
                  const category = mig.extractedData?.metadata?.category || 'General Web';
                  return (
                    <tr 
                      key={mig._id} 
                      onClick={() => handleRowClick(mig)}
                      className="hover:bg-slate-50/80 transition-all cursor-pointer border-b border-slate-50"
                    >
                      <td className="py-3.5 px-4 max-w-[200px] text-slate-800 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1" title={mig.sourceUrl}>{mig.sourceUrl}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate font-mono text-[10px]">
                        {mig.destinationUrl}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded bg-teal-50 text-[10px] text-teal-700 font-semibold uppercase tracking-wider">
                          {category.split('/')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          mig.status === 'completed' && 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        } ${
                          mig.status === 'failed' && 'bg-rose-50 text-rose-700 border border-rose-100'
                        } ${
                          ['migrating', 'extracting'].includes(mig.status) && 'bg-cyan-50 text-cyan-700 border border-cyan-100 animate-pulse'
                        } ${
                          ['pending', 'extracted'].includes(mig.status) && 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {mig.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                        {new Date(mig.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => onViewExtraction(mig._id, 'dashboard')}
                          title="View Extracted Form Info"
                          className="px-2.5 py-1.5 border border-teal-200 text-teal-600 hover:bg-teal-50 rounded-lg text-[10px] font-bold uppercase transition-all inline-flex"
                        >
                          View Form
                        </button>
                        <button 
                          onClick={(e) => handleDelete(mig._id, e)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all inline-flex"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
