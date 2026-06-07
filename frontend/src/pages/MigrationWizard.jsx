import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Terminal, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Layers,
  Database,
  Search,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

export default function MigrationWizard({ migrationSessionId, setMigrationSessionId, setCurrentPage, onViewExtraction }) {
  const [step, setStep] = useState(1);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingAutomate, setLoadingAutomate] = useState(false);
  
  // URLs & Scraped Data
  const [sourceUrl, setSourceUrl] = useState('https://www.tesla.com/models/design');
  const [destinationUrl, setDestinationUrl] = useState('http://localhost:5000/test-form.html');
  const [extractedData, setExtractedData] = useState(null);
  
  // Mappings
  const [mappings, setMappings] = useState([]);
  const [activeMappingIdx, setActiveMappingIdx] = useState(null);
  
  // Execution Output
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, running, completed, failed
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [currentExecutionStep, setCurrentExecutionStep] = useState(0);

  const terminalEndRef = useRef(null);

  // If a migration is clicked from Dashboard, restore it
  useEffect(() => {
    if (migrationSessionId) {
      const fetchSession = async () => {
        try {
          const res = await fetch(`/api/migration/logs`);
          if (res.ok) {
            const data = await res.json();
            const session = data.find(m => m._id === migrationSessionId);
            if (session) {
              setSourceUrl(session.sourceUrl);
              setDestinationUrl(session.destinationUrl);
              setExtractedData(session.extractedData);
              setMappings(session.mappings);
              if (session.status === 'completed' || session.status === 'failed') {
                setStep(3);
                setStatus(session.status);
                setLogs(session.logs);
                setScreenshotUrl(session.screenshot);
              } else {
                setStep(2);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchSession();
    }
  }, [migrationSessionId]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Step 1: Extract Web Content
  const handleExtract = async () => {
    if (!sourceUrl || !destinationUrl) {
      alert('Both source and destination URLs are required.');
      return;
    }

    const isValidUrl = (str) => {
      try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
      }
    };

    if (!isValidUrl(sourceUrl)) {
      alert('Please enter a valid Source URL (starting with http:// or https://).');
      return;
    }

    if (!isValidUrl(destinationUrl)) {
      alert('Please enter a valid Destination URL (starting with http:// or https://).');
      return;
    }

    setLoadingExtract(true);
    setLogs([]);
    try {
      // Check active pipelines limit
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.activeJobs >= 2) {
          alert('Concurrence limit reached. The system can only extract/migrate 2 items at a time.');
          setLoadingExtract(false);
          return;
        }
      }

      const res = await fetch('/api/migration/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl, destinationUrl })
      });
      if (res.ok) {
        const data = await res.json();
        setMigrationSessionId(data._id);
        setExtractedData(data.extractedData);
        setMappings(data.mappings);
        setStep(2);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Extraction failed. Check if server is running.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error during web content extraction.');
    } finally {
      setLoadingExtract(false);
    }
  };

  // Step 2: Auto guess field mappings
  const handleAutoMapping = () => {
    if (!extractedData) return;
    const autoMapped = mappings.map(m => {
      let matchedField = m.sourceField;
      if (m.targetSelector.includes('title')) matchedField = 'title';
      else if (m.targetSelector.includes('desc') || m.targetSelector.includes('description')) matchedField = 'description';
      else if (m.targetSelector.includes('specs') || m.targetSelector.includes('specifications')) matchedField = 'specifications';
      else if (m.targetSelector.includes('date')) matchedField = 'date';
      else if (m.targetSelector.includes('file') || m.targetSelector.includes('upload') || m.targetSelector.includes('img')) matchedField = 'images';
      else if (m.targetSelector.includes('price')) matchedField = 'price';
      return { ...m, sourceField: matchedField };
    });
    setMappings(autoMapped);
  };

  // Step 3: Run RPA Web Automation Filling
  const handleRunAutomation = async () => {
    if (!migrationSessionId) return;

    try {
      // Check active pipelines limit before starting
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.activeJobs >= 2) {
          alert('Concurrence limit reached. The system can only extract/migrate 2 items at a time.');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to verify active pipeline count:', e);
    }

    setStep(3);
    setStatus('running');
    setLogs(['[SYSTEM] Initializing stream hook...']);
    setScreenshotUrl(null);
    setCurrentExecutionStep(0);

    // Setup Server-Sent Events logging listener
    const eventSource = new EventSource(`/api/migration/stream/${migrationSessionId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.log) {
        setLogs(prev => [...prev, data.log]);
        
        // Match logs to tick virtual viewport steps
        if (data.log.includes('Navigating to form')) setCurrentExecutionStep(1);
        else if (data.log.includes('Locating selector')) setCurrentExecutionStep(2);
        else if (data.log.includes('Downloading image')) setCurrentExecutionStep(3);
        else if (data.log.includes('Form fill complete') || data.log.includes('Clicking submission')) setCurrentExecutionStep(4);
        else if (data.log.includes('flawlessly')) setCurrentExecutionStep(5);
      }
    };

    eventSource.onerror = (e) => {
      eventSource.close();
    };

    try {
      const res = await fetch('/api/migration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: migrationSessionId,
          destinationUrl,
          mappings,
          extractedData
        })
      });
      
      if (res.ok) {
        // Wait and check final status
        const interval = setInterval(async () => {
          const checkRes = await fetch('/api/migration/logs');
          if (checkRes.ok) {
            const data = await checkRes.json();
            const current = data.find(m => m._id === migrationSessionId);
            if (current && ['completed', 'failed'].includes(current.status)) {
              setStatus(current.status);
              setScreenshotUrl(current.screenshot);
              if (current.extractedData) {
                setExtractedData(current.extractedData);
              }
              eventSource.close();
              clearInterval(interval);
            }
          }
        }, 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Automation submission failed.');
        setStatus('failed');
        setLogs(prev => [...prev, `[ERROR] Automation submission failed: ${errData.error || 'Server error'}`]);
        eventSource.close();
      }
    } catch (err) {
      setStatus('failed');
      setLogs(prev => [...prev, `[ERROR] Automation call failed: ${err.message}`]);
      eventSource.close();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col animate-fade-in">
      {/* Step Navigation Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {migrationSessionId && (
            <button 
              onClick={() => {
                setMigrationSessionId(null);
                setCurrentPage('dashboard');
              }}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className={`${step >= 1 ? 'text-teal-600' : ''}`}>1. Link Extraction</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className={`${step >= 2 ? 'text-teal-600' : ''}`}>2. Field Mappings</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className={`${step >= 3 ? 'text-teal-600' : ''}`}>3. Robotic Browser filling</span>
          </div>
        </div>

        <div className="flex gap-2">
          {step > 1 && step < 3 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-600 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {step === 2 && (
            <button 
              onClick={handleRunAutomation}
              className="gradient-teal hover:shadow-lg text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all animate-pulse-slow"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Execute Browser Filling
            </button>
          )}
        </div>
      </div>

      {/* Main Form Views */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* STEP 1: LINK INTAKE & EXTRACTION */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" /> Auto Migration Channels Setup
                </h3>
                <p className="text-xs text-slate-400">Define scraper link bounds. Target test pages locally using localhost ports.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Scraper Web Link (Source URL)</label>
                  <input 
                    type="text" 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/product/123"
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 italic">Supports Unsplash, Tesla, Shopify product links or dynamic pages.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Form Destination Target (Destination URL)</label>
                  <input 
                    type="text" 
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="http://localhost:5000/test-form.html"
                    className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 italic">Target local form tests to evaluate physical Puppeteer execution.</p>
                </div>
              </div>

              <button
                onClick={handleExtract}
                disabled={loadingExtract}
                className="w-full gradient-teal text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingExtract ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span>Analyzing DOM & Scraped Metadata...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Run Metadata Scraper</span>
                  </>
                )}
              </button>
            </div>

            {/* Scraper Details Help Box */}
            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 border border-slate-800 flex gap-4">
              <Terminal className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white tracking-wide uppercase">Why Apexium Scrapers are Smart:</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Checks Open-Graph tags (`og:title`, `og:image`) automatically.</li>
                  <li>Extracts table matrices (`tr td` listings) for technical specifications.</li>
                  <li>If dynamic scrapers fail due to CAPTCHAs, it spawns a context generator to feed data.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FIELD MAPPING BOARD */}
        {step === 2 && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scraped Preview Cards Deck */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-850 text-white shadow-xl glow-teal">
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Extracted Payload Preview
                </h3>
                
                {extractedData && (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Source Title</span>
                      <p className="text-xs font-bold text-slate-100">{extractedData.title}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Source Paragraph Description</span>
                      <p className="text-xs text-slate-400 leading-relaxed text-[11px] line-clamp-3">{extractedData.description}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Scraped Technical Specs ({extractedData.specifications.length})</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 border border-slate-800 p-2 rounded bg-slate-950/40 text-[10px] text-slate-400 font-mono">
                        {extractedData.specifications.map((spec, i) => (
                          <div key={i} className="truncate border-b border-slate-900/50 pb-0.5">{spec}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-2">Media Assets</span>
                      <div className="flex gap-2">
                        {extractedData.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt="Scraped" 
                            className="w-10 h-10 rounded object-cover border border-slate-800" 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Field Mapping Configurator */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-teal-600" /> Mapping Canvas Configurator
                  </h3>
                  <p className="text-xs text-slate-400">Map scraped variables to CSS selector elements on the target.</p>
                </div>
                <button
                  onClick={handleAutoMapping}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-[10px] font-bold text-teal-700 hover:bg-teal-100 transition-all uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-guess selectors
                </button>
              </div>

              {/* Mappings Table */}
              <div className="space-y-4">
                {mappings.map((map, idx) => (
                  <div 
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Form Selector</span>
                      <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 block truncate">
                        {map.targetSelector}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 font-sans">Mapped Payload Value</span>
                      <select
                        value={map.sourceField}
                        onChange={(e) => {
                          const updated = [...mappings];
                          updated[idx].sourceField = e.target.value;
                          setMappings(updated);
                        }}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      >
                        <option value="title">Scraped Title</option>
                        <option value="description">Scraped Description</option>
                        <option value="specifications">Scraped Specifications (Full List)</option>
                        <option value="date">Scraped Date stamp</option>
                        <option value="images">Primary Image URL</option>
                        <option value="custom">Custom Default Value</option>
                      </select>
                    </div>

                    {map.sourceField === 'custom' ? (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Static Default Value</span>
                        <input 
                          type="text" 
                          value={map.defaultValue}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].defaultValue = e.target.value;
                            setMappings(updated);
                          }}
                          placeholder="e.g. 19.99"
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-mono"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic pt-4 truncate pl-2">
                        Matches: {
                          map.sourceField === 'title' && extractedData?.title.substr(0, 30) + '...'
                        }
                        {
                          map.sourceField === 'description' && extractedData?.description.substr(0, 30) + '...'
                        }
                        {
                          map.sourceField === 'images' && 'extracted_photo.jpg'
                        }
                        {
                          map.sourceField === 'specifications' && `${extractedData?.specifications.length} items`
                        }
                        {
                          map.sourceField === 'date' && extractedData?.dates[0]
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EXECUTION CONTROL CENTER */}
        {step === 3 && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Monospace Live Log Terminal Console */}
            <div className="bg-[#021326] rounded-2xl border border-slate-800 p-6 shadow-2xl flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Apexium Terminal Console
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status === 'running' ? 'bg-cyan-400 animate-ping' : ''} ${status === 'completed' ? 'bg-emerald-400' : ''} ${status === 'failed' ? 'bg-rose-500' : ''}`}></span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    {status}
                  </span>
                </div>
              </div>

              {/* Console Logs listings */}
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] text-emerald-400 terminal-scroll pr-2">
                {logs.length === 0 ? (
                  <p className="text-slate-600 italic">Session initialized. Booting headless browser...</p>
                ) : (
                  logs.map((log, i) => {
                    let color = 'text-emerald-400';
                    if (log.includes('[ERROR]')) color = 'text-rose-400';
                    else if (log.includes('[SUCCESS]')) color = 'text-teal-300 font-bold';
                    else if (log.includes('[WARNING]')) color = 'text-amber-400';
                    return (
                      <div key={i} className={`${color} leading-relaxed break-all`}>
                        {log}
                      </div>
                    );
                  })
                )}
                {status === 'running' && (
                  <div className="text-teal-500 typing-cursor font-bold">Executing subprocess steps</div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Virtual Viewport simulator */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
              <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                    Automation Engine Viewport
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">{destinationUrl.substr(0, 50)}</p>
                </div>
                {status === 'completed' && screenshotUrl && (
                  <a 
                    href={screenshotUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 hover:underline"
                  >
                    Snapshot <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Simulation Canvas */}
              <div className="flex-1 border border-slate-150 rounded-xl bg-slate-50 flex flex-col overflow-hidden relative">
                
                {/* 1. Viewport header bar */}
                <div className="bg-slate-200 px-4 py-2 border-b border-slate-150 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-350"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-350"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-350"></span>
                  </div>
                  <div className="bg-white text-[9px] text-slate-500 font-mono px-3 py-0.5 rounded border border-slate-250 w-full truncate">
                    {destinationUrl}
                  </div>
                </div>

                {/* 2. Content Display */}
                <div className="flex-1 p-6 flex flex-col justify-center items-center">
                  {status === 'running' && (
                    <div className="space-y-6 w-full max-w-sm">
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="h-10 w-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-slate-600">Robotic Browser active</span>
                      </div>
                      
                      {/* Interactive Visual steps */}
                      <div className="space-y-2">
                        {[
                          'Browser Instance Booted',
                          'Navigating to Destination page',
                          'Mapping DOM Field Elements',
                          'Downloading & Uploading media assets',
                          'Triggering Submission Callback'
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-slate-500">
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                              currentExecutionStep > i 
                                ? 'bg-teal-500 border-teal-500 text-white' 
                                : currentExecutionStep === i 
                                  ? 'border-teal-500 text-teal-600 animate-pulse font-extrabold'
                                  : 'border-slate-300 text-slate-400'
                            }`}>
                              {i+1}
                            </span>
                            <span className={`${currentExecutionStep === i ? 'text-teal-600 font-bold' : ''} ${currentExecutionStep > i ? 'text-slate-700 line-through opacity-70' : ''}`}>
                              {s}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {status === 'completed' && (
                    <div className="h-full w-full flex flex-col items-center justify-center p-2 animate-fade-in space-y-4">
                      {screenshotUrl && (
                        <div className="flex-1 w-full relative group border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                          <img 
                            src={screenshotUrl} 
                            alt="Transaction Screenshot" 
                            className="h-full w-full object-contain bg-slate-900" 
                          />
                        </div>
                      )}
                      <div className="text-center space-y-3">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center gap-3.5 max-w-sm mx-auto shadow-sm">
                          <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Auto-fill Run Completed
                          </h4>
                          <button 
                            onClick={() => onViewExtraction(migrationSessionId, 'wizard')}
                            title="View Extracted Form Info"
                            className="px-3.5 py-1.5 border border-teal-200 text-teal-600 bg-white hover:bg-teal-50 rounded-lg text-[10.5px] font-bold uppercase transition-all inline-flex shadow-sm"
                          >
                            View Form
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Click the Snapshot button to download the finalized browser receipt.</p>
                      </div>
                    </div>
                  )}

                  {status === 'failed' && (
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-700">Automation Blocked</h4>
                        <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-1">
                          Fatal page load error or selector selector mapping mismatch. Review target class targets.
                        </p>
                      </div>
                    </div>
                  )}

                  {status === 'idle' && (
                    <div className="text-center text-slate-400 space-y-2">
                      <HelpCircle className="w-10 h-10 text-slate-300 mx-auto animate-pulse-slow" />
                      <p className="text-xs">Select mapping configs and launch script run to preview action outputs.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
