import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { 
  ShieldAlert, 
  Key, 
  Trash2, 
  Download, 
  Upload, 
  EyeOff,
  Globe,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [incognito, setIncognito] = useState(false);
  const [sync, setSync] = useState(true);
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••••••');
  const [showKey, setShowKey] = useState(false);
  const [excludedDomains, setExcludedDomains] = useState([
    'bank.com',
    'passwords.google.com',
    'paypal.com'
  ]);
  const [newDomain, setNewDomain] = useState('');

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain && !excludedDomains.includes(newDomain)) {
      setExcludedDomains([...excludedDomains, newDomain]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setExcludedDomains(excludedDomains.filter(d => d !== domain));
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      <main className="flex-grow p-8 max-w-4xl mx-auto flex flex-col gap-8 overflow-y-auto">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Settings
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
            Configure privacy limits, sync behaviors, and manage your stored index data.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {/* Privacy & Filtering */}
          <section className="glass-effect rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-5">
            <h2 className="text-md font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-violet-500" />
              Privacy & Filtering
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Index in Incognito</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Allow extension to record history during incognito sessions.</p>
              </div>
              <button onClick={() => setIncognito(!incognito)} className="text-slate-600 dark:text-slate-300">
                {incognito ? <ToggleRight className="w-9 h-9 text-violet-600" /> : <ToggleLeft className="w-9 h-9 text-slate-400 dark:text-zinc-600" />}
              </button>
            </div>

            {/* Excluded Domains */}
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold">Excluded Domains</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Domains listed below will never be parsed or saved to your memory.</p>
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. facebook.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-grow pl-4 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800 dark:text-zinc-100"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold rounded-xl transition-all">
                  Exclude Domain
                </button>
              </form>

              <div className="flex flex-wrap gap-2 mt-2">
                {excludedDomains.map((domain) => (
                  <div key={domain} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 border border-slate-200/30 dark:border-zinc-700/30">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{domain}</span>
                    <button onClick={() => handleRemoveDomain(domain)} className="text-red-500 hover:text-red-600 ml-1 font-bold text-xs" title="Remove exclusion">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AI Settings */}
          <section className="glass-effect rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-5">
            <h2 className="text-md font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-500" />
              API Settings
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Gemini API Key</label>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Provide your personal Gemini API key for running localized page evaluations and summary extraction.</p>
              
              <div className="relative mt-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-xs font-mono text-slate-800 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="glass-effect rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-5">
            <h2 className="text-md font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-violet-500" />
              Sync & Data Management
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold">Cloud Sync</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Encrypt and sync memory spaces across multiple devices automatically.</p>
              </div>
              <button onClick={() => setSync(!sync)} className="text-slate-600 dark:text-slate-300">
                {sync ? <ToggleRight className="w-9 h-9 text-violet-600" /> : <ToggleLeft className="w-9 h-9 text-slate-400 dark:text-zinc-600" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold rounded-xl transition-all">
                <Download className="w-4 h-4" />
                Export Memory Data
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold rounded-xl transition-all">
                <Upload className="w-4 h-4" />
                Import Backup File
              </button>

              <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all ml-auto">
                <Trash2 className="w-4 h-4" />
                Purge Database
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
