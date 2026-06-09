import React, { useState } from 'react';
import { Lock, User, ShieldAlert } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setIsLoading(true);

    const API_URL = import.meta.env.VITE_API_URL;
    console.log("API_URL =", API_URL);

    const url = isSignUp
    ? `${API_URL}/api/auth/register`
    : `${API_URL}/api/auth/login`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('apexium_auth', 'true');
          localStorage.setItem('apexium_user', data.username);
          onLoginSuccess(data.username);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Authentication failed. Please verify credentials.');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setError('Network error: Unable to reach SaaS auth server.');
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-8 animate-fade-in">
        
        {/* Brand/Logo Header */}
        <div className="flex justify-center">
          <span className="text-4xl font-black tracking-tight font-sans italic text-white select-none">
            Ap<span className="text-[#0D9488]">e</span>xium
          </span>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white tracking-wide">
            {isSignUp ? 'Create Operator Profile' : 'RPA Systems Gate'}
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            {isSignUp ? 'New Account Registration' : 'Enterprise Client Authentication'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-medium animate-shake">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input 
                type="text"
                placeholder="e.g. apexium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs text-white pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500/60 focus:bg-slate-950 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs text-white pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500/60 focus:bg-slate-950 transition-all font-medium"
              />
            </div>
          </div>

          {/* Helper details panel */}
          <div className="p-3 bg-slate-950/30 border border-slate-800/80 rounded-xl text-[10px] text-slate-500 leading-normal">
            <span className="font-bold text-slate-400 block mb-1">Developer Notice:</span>
            {isSignUp 
              ? 'Select a secure operator username and password. This registration will sync to the backend database.'
              : 'Sign in with your registered username. If you do not have an account, click the Sign Up toggle below.'
            }
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-50 text-white font-bold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-lg hover:shadow-teal-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{isSignUp ? 'Creating Profile...' : 'Authorizing Operator...'}</span>
              </>
            ) : (
              <span>{isSignUp ? 'Register Operator Profile' : 'Sign In to System'}</span>
            )}
          </button>

          {/* Toggle login/signup mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-teal-400 hover:text-teal-350 font-semibold transition-all hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
