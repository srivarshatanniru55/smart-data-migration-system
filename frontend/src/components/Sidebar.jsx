import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  History, 
  Settings, 
  Database,
  Radio,
  ServerCrash
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const stats = await fetch('/api/dashboard/stats');
          if (stats.ok) {
            setDbStatus('connected');
          } else {
            setDbStatus('local');
          }
        } else {
          setDbStatus('local');
        }
      } catch (err) {
        setDbStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'wizard', name: 'Automate Migration', icon: ArrowRightLeft },
    { id: 'logs', name: 'Activity Audit Trail', icon: History },
    { id: 'settings', name: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex justify-center">
          <span className="text-2xl font-black tracking-tight font-sans italic text-white select-none">
            Ap<span className="text-[#0D9488]">e</span>xium
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10' 
                    : 'hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-400/80'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connection Node Status Indicator */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Connection
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {dbStatus === 'connected' && 'MongoDB Connected'}
              {dbStatus === 'local' && 'JSON DB (Fallback)'}
              {dbStatus === 'offline' && 'Connection Loss'}
              {dbStatus === 'checking' && 'Pinging Server...'}
            </span>
          </div>
          
          <div className="flex items-center">
            {dbStatus === 'connected' && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            {dbStatus === 'local' && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
            {dbStatus === 'offline' && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            {dbStatus === 'checking' && (
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500 animate-pulse"></span>
            )}
          </div>
        </div>
        <p className="text-[9px] text-slate-600 text-center mt-2.5 font-sans italic">
          "Automating Data Transfer with Intelligence"
        </p>
      </div>
    </aside>
  );
}
