import React, { useState, useEffect } from 'react';
import { 
  User, 
  Play, 
  Cpu,
  Clock,
  LogOut
} from 'lucide-react';

export default function Header({ currentPage, setCurrentPage, loggedInUser, onLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Operations Dashboard';
      case 'wizard': return 'Automated Migration Wizard';
      case 'logs': return 'Operations Audit Logs';
      case 'settings': return 'System Settings';
      case 'view-extraction': return 'Payload Details Inspector';
      default: return 'Apexium Hub';
    }
  };

  const getPageDesc = () => {
    switch (currentPage) {
      case 'dashboard': return 'Track real-time process flows, success yields, and active automation tasks.';
      case 'wizard': return 'Extract web data and trigger Puppeteer browser auto form-filling.';
      case 'logs': return 'Historical audit records of all successful and failed data transfers.';
      case 'settings': return 'Fine-tune headless browser configurations, speed parameters, and DB settings.';
      case 'view-extraction': return 'Verify and audit full form fields extracted from dynamic web scraper engines.';
      default: return 'Enterprise Data Portability Systems';
    }
  };

  return (
    <header className="gradient-header h-20 px-8 border-b border-slate-800 flex items-center justify-between text-white select-none">
      {/* Page Context Description */}
      <div>
        <h1 className="text-xl font-bold font-sans tracking-wide text-white flex items-center gap-2">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          {getPageDesc()}
        </p>
      </div>

      {/* Utilities Section */}
      <div className="flex items-center gap-6">
        {/* Active Clock Panel */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-teal-400 animate-pulse-slow" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>


        {/* Global Manual Run Trigger */}
        {currentPage !== 'wizard' && (
          <button 
            onClick={() => setCurrentPage('wizard')}
            className="gradient-teal hover:shadow-lg hover:shadow-teal-500/20 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span>Launch Automator</span>
          </button>
        )}

        {/* User Account Capsule */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white leading-tight">
              {loggedInUser ? `${loggedInUser} User` : 'Apexium User'}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Role: User
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <User className="w-4 h-4" />
          </div>
          <button 
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
