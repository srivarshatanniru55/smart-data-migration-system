import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Globe, Database, Tag, FileText, Image as ImageIcon, Calendar, Layers } from 'lucide-react';

export default function ViewExtraction({ migrationId, onBack }) {
  const [migration, setMigration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/migration/${migrationId}`);
        if (res.ok) {
          const data = await res.json();
          setMigration(data);
        } else {
          setError('Failed to retrieve extraction record from backend.');
        }
      } catch (err) {
        setError('Network error: Unable to connect to backend.');
      } finally {
        setLoading(false);
      }
    };
    if (migrationId) {
      fetchDetails();
    }
  }, [migrationId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading extraction payload...</span>
        </div>
      </div>
    );
  }

  if (error || !migration) {
    return (
      <div className="flex-1 p-8 bg-slate-50 flex flex-col justify-center items-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <p className="text-base font-bold text-slate-800">Inspection Error</p>
          <p className="text-xs text-slate-500 mt-1">{error || 'Record not found.'}</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const extractedData = migration.extractedData || {};
  const category = extractedData.metadata?.category || 'General Web';
  const specifications = extractedData.specifications || [];
  const dates = extractedData.dates || [];
  const images = extractedData.images || [];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-6 animate-fade-in font-sans select-none">
      {/* Page Header with Back arrow */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-650 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
          title="Back to previous page"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" /> Extracted Payload Inspector
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Reviewing details for extraction session: <span className="font-mono text-slate-600 font-bold">{migration._id}</span>
          </p>
        </div>
      </div>

      {/* Visual Form Layout (Not displaying raw code, displaying form controls) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8 space-y-6">
        
        {/* Connection bounds row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Web Link</label>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700 select-all truncate">
              <Globe className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>{migration.sourceUrl}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination Target Link</label>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700 select-all truncate">
              <Database className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>{migration.destinationUrl}</span>
            </div>
          </div>
        </div>

        {/* Section: Basic Scraped Form Details */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
            Basic Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Extracted Title
              </label>
              <input 
                type="text" 
                value={extractedData.title || ''} 
                disabled 
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input 
                  type="text" 
                  value={category} 
                  disabled 
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Extracted Description
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <textarea 
                value={extractedData.description || 'No description found.'} 
                disabled 
                rows="4"
                className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section: Structured Specs & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Specifications List form field */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Specifications Table ({specifications.length})
            </h3>
            {specifications.length === 0 ? (
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 text-slate-400 text-xs italic">
                No specifications found in dynamic scrape.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {specifications.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text" 
                      value={spec} 
                      disabled 
                      className="w-full text-[10.5px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates list form field */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Date Parameters ({dates.length})
            </h3>
            {dates.length === 0 ? (
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 text-slate-400 text-xs italic">
                No date markers extracted.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {dates.map((date, i) => (
                  <div key={i} className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input 
                      type="text" 
                      value={date} 
                      disabled 
                      className="w-full text-[10.5px] pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Section: Media Assets form field */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-slate-500" /> Extracted Media Gallery ({images.length})
          </h3>
          {images.length === 0 ? (
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 text-slate-400 text-xs italic">
              No image resources found.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {images.map((imgUrl, i) => (
                <div key={i} className="space-y-1 text-center font-mono text-[9px] text-slate-400">
                  <a 
                    href={imgUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="aspect-square border border-slate-200 rounded-xl overflow-hidden block bg-slate-50 hover:border-teal-500 hover:shadow-md transition-all relative group"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Payload Resource ${i}`} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-bold font-sans">
                      Open Asset
                    </div>
                  </a>
                  <span>Image {i+1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
