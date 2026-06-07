import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle, 
  Sliders,
  Play,
  Database,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    headless: true,
    delay: 1000,
    autoSubmit: false,
    maxConcurrency: 2,
    defaultMappings: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [automationMode, setAutomationMode] = useState('real');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating system configurations.');
    } finally {
      setSaving(false);
    }
  };

  const handleMappingChange = (index, key, val) => {
    const updated = { ...settings };
    updated.defaultMappings[index][key] = val;
    setSettings(updated);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8 animate-fade-in max-w-5xl mx-auto w-full">
      {/* Settings Panel Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">System Configurations</h2>
          <p className="text-xs text-slate-400">Configure global Robotic Process Automation (RPA) bounds, execution speeds, and DOM targets.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-teal hover:shadow-lg text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Commit Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>System configurations updated successfully! Automated pipelines will adopt updated bounds instantly.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Speed parameters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" /> RPA Speeds & Delay
            </h3>

            {/* Delay typing */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Typing action delay (ms)</label>
              <input 
                type="number"
                value={settings.delay}
                onChange={(e) => setSettings({ ...settings, delay: parseInt(e.target.value) || 0 })}
                min="0"
                max="5000"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-semibold"
              />
              <p className="text-[10px] text-slate-400">Delay introduced between focus keystrokes. Simulates natural typing.</p>
            </div>

            {/* Headless toggle */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block">Headless Browser</label>
                <p className="text-[10px] text-slate-400 max-w-[160px] mt-0.5">Run Chrome in background invisibly.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, headless: !settings.headless })}
                className="text-teal-600 hover:scale-105 transition-all"
              >
                {settings.headless ? (
                  <ToggleRight className="w-10 h-10 text-teal-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-350" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right column: Default Mappings editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" /> Default DOM selector bounds
              </h3>
              <p className="text-[10px] text-slate-400">Configure default CSS selector links injected when extracting new channels.</p>
            </div>

            <div className="space-y-4 pt-3">
              {settings.defaultMappings.map((map, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-teal-600/70" />
                    <span>Payload: <span className="font-mono text-teal-600">{map.sourceField}</span></span>
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={map.targetSelector}
                      onChange={(e) => handleMappingChange(idx, 'targetSelector', e.target.value)}
                      placeholder="e.g. #input-field"
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
