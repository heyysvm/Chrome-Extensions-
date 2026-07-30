import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  ExternalLink, 
  EyeOff, 
  CheckCircle2, 
  CircleAlert,
  Sliders,
  Database
} from 'lucide-react';

export const Popup: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isIndexed, setIsIndexed] = useState(false);
  const [isExcluded, setIsExcluded] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [queueCount, setQueueCount] = useState(0);

  // Connection settings
  const [showSettings, setShowSettings] = useState(false);
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [authToken, setAuthToken] = useState('');
  const [userApiKey, setUserApiKey] = useState('');

  useEffect(() => {
    // 1. Fetch current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url || '';
        setCurrentUrl(url);
        setCurrentTitle(tabs[0].title || '');
        
        // Check if URL is in exclusions list
        chrome.storage.local.get(['excludedWebsites', 'indexingQueue', 'incognitoIndexing', 'backend_url', 'token', 'gemini_api_key'], (settings) => {
          const excludedList: string[] = settings.excludedWebsites || [];
          const urlObj = new URL(url);
          const excluded = excludedList.some(domain => urlObj.hostname.includes(domain));
          setIsExcluded(excluded);
          setIncognito(settings.incognitoIndexing || false);
          
          setBackendUrl(settings.backend_url || 'http://localhost:5000');
          setAuthToken(settings.token || '');
          setUserApiKey(settings.gemini_api_key || '');

          const queue = settings.indexingQueue || [];
          setQueueCount(queue.length);
          const alreadyIndexed = queue.some((item: any) => item.url === url);
          setIsIndexed(alreadyIndexed);
        });
      }
    });

    // Listen for runtime updates
    const handleMessage = (message: any) => {
      if (message.action === 'PAGE_INDEXED') {
        chrome.storage.local.get(['indexingQueue'], (data) => {
          const queue = data.indexingQueue || [];
          setQueueCount(queue.length);
          
          if (message.page.url === currentUrl) {
            setIsIndexed(true);
            setStatusMessage('Page indexed successfully!');
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [currentUrl]);

  const handleIndexNow = () => {
    setStatusMessage('Indexing page...');
    chrome.runtime.sendMessage({ action: 'INDEX_NOW' }, (response) => {
      if (response && response.success) {
        setStatusMessage('Extraction queued...');
      } else {
        setStatusMessage(response?.error || 'Failed to capture tab.');
      }
    });
  };

  const toggleExcludeSite = () => {
    try {
      const hostname = new URL(currentUrl).hostname;
      chrome.storage.local.get(['excludedWebsites'], (data) => {
        let list: string[] = data.excludedWebsites || [];
        if (isExcluded) {
          list = list.filter(d => d !== hostname);
        } else {
          list.push(hostname);
        }
        chrome.storage.local.set({ excludedWebsites: list }, () => {
          setIsExcluded(!isExcluded);
          setStatusMessage(isExcluded ? 'Site removed from exclusions.' : 'Site excluded.');
        });
      });
    } catch {
      setStatusMessage('Invalid website.');
    }
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    chrome.storage.local.set({
      backend_url: backendUrl,
      token: authToken,
      gemini_api_key: userApiKey
    }, () => {
      setStatusMessage('Connection credentials updated!');
      setShowSettings(false);
    });
  };

  if (showSettings) {
    return (
      <div className="w-[340px] p-5 bg-zinc-955 text-zinc-100 font-sans border border-zinc-800 shadow-2xl overflow-hidden rounded-none">
        {/* Settings Header */}
        <header className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-sm tracking-tight text-zinc-200">
              API Connection Setup
            </span>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </header>

        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Backend API Endpoint</label>
            <input
              type="url"
              required
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:5000"
              className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 outline-none text-xs text-zinc-200 focus:border-violet-500 transition-all font-sans"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">JWT Authentication Token</label>
            <textarea
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Paste JWT token from dashboard settings"
              rows={3}
              className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 outline-none text-xs text-zinc-200 focus:border-violet-500 transition-all resize-none font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gemini API Key (Optional)</label>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="Optional personal key"
              className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 outline-none text-xs text-zinc-200 focus:border-violet-500 transition-all font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-semibold text-xs transition-all shadow-md shadow-violet-500/10 mt-2"
          >
            Save Credentials
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-[340px] p-5 bg-zinc-955 text-zinc-100 font-sans border border-zinc-800 shadow-2xl overflow-hidden rounded-none">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Internet Memory
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Setup API Connection"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenDashboard}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <span>Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Info */}
      <div className="flex flex-col gap-4">
        {/* Status card */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-900 flex items-start gap-3">
          {isIndexed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : isExcluded ? (
            <EyeOff className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CircleAlert className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-zinc-300 truncate">
              {currentTitle || 'No active tab'}
            </h4>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
              {currentUrl}
            </p>
            
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isIndexed 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : isExcluded 
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {isIndexed ? 'Indexed' : isExcluded ? 'Excluded' : 'Unindexed'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Alert text */}
        {statusMessage && (
          <div className="text-[11px] font-medium text-center text-violet-400 animate-pulse">
            {statusMessage}
          </div>
        )}

        {/* Main Action buttons */}
        <div className="flex flex-col gap-2">
          {!isIndexed && !isExcluded && (
            <button
              onClick={handleIndexNow}
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Index Active Webpage
            </button>
          )}

          {isIndexed && (
            <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold text-xs text-center">
              Successfully Saved to Memory
            </div>
          )}

          {isExcluded && (
            <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-900/30 border border-zinc-900 text-amber-500/70 font-semibold text-xs text-center">
              Site is on Excluded List
            </div>
          )}
        </div>

        {/* Settings grid inside popup */}
        <div className="border-t border-zinc-900 pt-3 mt-1 flex flex-col gap-2.5">
          <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Quick Actions</h5>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Exclude active domain</span>
            <button
              onClick={toggleExcludeSite}
              className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                isExcluded 
                  ? 'border-violet-500/20 bg-violet-500/10 text-violet-400' 
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isExcluded ? 'Excluded' : 'Exclude'}
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Incognito indexing</span>
            <span className="text-zinc-500 font-medium">
              {incognito ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Memory queue</span>
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-zinc-600" />
              <span>{queueCount} pages cached</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-700 border-t border-zinc-900 mt-5 pt-3 flex items-center justify-center gap-1.5">
        <Sliders className="w-3 h-3" />
        <span>Configure API credentials in cog menu</span>
      </footer>
    </div>
  );
};
