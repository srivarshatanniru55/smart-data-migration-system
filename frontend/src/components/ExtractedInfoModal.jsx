import React, { useEffect } from 'react';
import { X, Image as ImageIcon, Calendar, Tag, FileText, Settings2 } from 'lucide-react';

export default function ExtractedInfoModal({ isOpen, onClose, extractedData }) {
  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Set default details if empty
  const title = extractedData?.title || 'Untitled Scrape';
  const description = extractedData?.description || 'No description extracted from target page DOM.';
  const specifications = extractedData?.specifications || [];
  const dates = extractedData?.dates || [];
  const category = extractedData?.metadata?.category || 'General Web';
  const images = extractedData?.images || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none font-sans animate-fade-in">
      {/* Modal Card wrapper */}
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header section */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">Extracted DOM Payload</h3>
              <p className="text-[10px] text-slate-400">Inspecting cached elements from raw selector mappings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
          
          {/* Main Title & Category Header info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-100 text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                <Tag className="w-2.5 h-2.5 inline mr-1" />
                {category}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-800 leading-snug">
              {title}
            </h4>
          </div>

          <hr className="border-slate-100" />

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Description / Content
            </span>
            <p className="bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {description}
            </p>
          </div>

          {/* Specifications and dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Specs List */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Technical Specifications ({specifications.length})
              </span>
              {specifications.length === 0 ? (
                <p className="text-slate-400 italic text-[11px] bg-slate-50/50 p-3 rounded-lg border border-slate-100">No specifications found.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100 bg-white shadow-sm font-mono text-[10.5px]">
                  {specifications.map((spec, i) => (
                    <div key={i} className="px-3.5 py-2 hover:bg-slate-50 text-slate-700 truncate">
                      {spec}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dates / Chrono Stamp info */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Chronological Timestamps ({dates.length})
              </span>
              {dates.length === 0 ? (
                <p className="text-slate-400 italic text-[11px] bg-slate-50/50 p-3 rounded-lg border border-slate-100">No date markers scraped.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100 bg-white shadow-sm font-mono text-[10.5px]">
                  {dates.map((date, i) => (
                    <div key={i} className="px-3.5 py-2 flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="truncate">{date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Scraped Images Gallery */}
          <div className="space-y-2.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Extracted Media Assets ({images.length})
            </span>
            {images.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] bg-slate-50/50 p-3 rounded-lg border border-slate-100">No image URLs extracted.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {images.map((imgUrl, i) => (
                  <a 
                    key={i} 
                    href={imgUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="aspect-square border border-slate-200 hover:border-teal-500 rounded-lg overflow-hidden block bg-slate-100 hover:shadow-md transition-all relative group"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`scraped-asset-${i}`} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">
                      Open Link
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg font-bold text-[11px] uppercase tracking-wide transition-all hover:shadow-md"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
