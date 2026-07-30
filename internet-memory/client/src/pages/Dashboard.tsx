import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import type { Page } from '@shared/types';
import { 
  Search, 
  Sparkles, 
  Pin, 
  Bookmark, 
  ExternalLink, 
  Tag, 
  Clock, 
  FolderPlus,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async (searchVal: string = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };

      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        headers['x-gemini-api-key'] = savedKey;
      }

      let url = 'http://localhost:5000/api/pages';
      if (searchVal) {
        url += `?search=${encodeURIComponent(searchVal)}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPages(searchQuery);
  };

  const togglePin = async (id: string) => {
    const page = pages.find(p => p.id === id || (p as any)._id === id);
    if (!page) return;
    const nextStatus = !page.isPinned;

    setPages(prev => prev.map(p => (p.id === id || (p as any)._id === id) ? { ...p, isPinned: nextStatus } : p));
    
    try {
      const token = localStorage.getItem('token');
      const dbId = (page as any)._id || page.id;
      await fetch(`http://localhost:5000/api/pages/${dbId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPinned: nextStatus })
      });
    } catch (err) {
      console.error('Failed to update pin state:', err);
    }
  };

  const toggleBookmark = async (id: string) => {
    const page = pages.find(p => p.id === id || (p as any)._id === id);
    if (!page) return;
    const nextStatus = !page.isBookmarked;

    setPages(prev => prev.map(p => (p.id === id || (p as any)._id === id) ? { ...p, isBookmarked: nextStatus } : p));
    
    try {
      const token = localStorage.getItem('token');
      const dbId = (page as any)._id || page.id;
      await fetch(`http://localhost:5000/api/pages/${dbId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBookmarked: nextStatus })
      });
    } catch (err) {
      console.error('Failed to update bookmark state:', err);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-grow p-8 max-w-6xl mx-auto flex flex-col gap-8 overflow-y-auto">
        
        {/* Page Title & Stats */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              Your Memory Space
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
              Search visited pages using natural semantic queries.
            </p>
          </div>
          
          <div className="hidden md:flex gap-4 items-center">
            <div className="glass-effect px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-200/40 dark:border-zinc-800/40 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Indexing Active</span>
            </div>
            <div className="glass-effect px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-slate-200/40 dark:border-zinc-800/40 text-xs font-medium">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span>{pages.length} Pages Captured</span>
            </div>
          </div>
        </header>

        {/* Command-Palette Inspired Search bar */}
        <section className="animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="glass-effect rounded-3xl p-3 shadow-lg border border-slate-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row items-center gap-2 bg-white/70 dark:bg-zinc-900/70">
            <div className="flex items-center gap-3 px-3 flex-grow w-full">
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAiMode ? "Ask your memory: 'What did I read about FastAPI setup last week?'" : "Search history by concept, keywords or URL..."}
                className="w-full bg-transparent text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none text-sm py-2"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 dark:border-zinc-800 pt-2 sm:pt-0">
              {/* AI toggle */}
              <button
                type="button"
                onClick={() => setIsAiMode(!isAiMode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                  isAiMode 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20' 
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiMode ? 'animate-pulse' : ''}`} />
                <span>AI Search</span>
              </button>
              
              <button type="submit" className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold transition-all">
                Search
              </button>
            </div>
          </form>
        </section>

        {/* Captured Pages List */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Recently Visited
          </h2>
          
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-550 dark:text-zinc-400">
              <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
              Loading your memory...
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              No pages indexed yet. Try browsing some websites with the extension active!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pages.map((page) => {
                const dbId = (page as any)._id || page.id;
                return (
                  <div 
                    key={dbId} 
                    className="glass-effect rounded-2xl p-5 hover:border-violet-500/30 dark:hover:border-violet-500/30 hover:shadow-lg transition-all duration-300 relative group bg-white/50 dark:bg-zinc-900/50 flex flex-col md:flex-row justify-between gap-4"
                  >
                    {/* Main page details */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {page.favicon ? (
                          <img src={page.favicon} alt="" className="w-5 h-5 rounded-md mt-0.5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        ) : (
                          <HelpCircle className="w-5 h-5 text-slate-400 dark:text-zinc-500 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-md hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate">
                            <a href={page.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 inline-flex">
                              {page.title}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">
                              {page.url}
                            </p>
                            {(page as any).score !== undefined && (
                              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                                Match: {Math.round((page as any).score * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      {page.summary && (
                        <div className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium bg-slate-50/50 dark:bg-zinc-950/20 p-3.5 rounded-xl border border-slate-100/50 dark:border-zinc-800/20">
                          {page.summary.summary}
                        </div>
                      )}

                      {/* Badges / Metadata */}
                      {page.summary && (
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-zinc-400 pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{page.summary.readingTime} min read</span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                            page.summary.difficulty === 'Beginner' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : page.summary.difficulty === 'Intermediate'
                              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {page.summary.difficulty}
                          </span>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            {page.summary.tags.map(tag => (
                              <span key={tag} className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 border-slate-100 dark:border-zinc-800/50 pt-3 md:pt-0 flex-shrink-0">
                      <button 
                        onClick={() => togglePin(dbId)}
                        className={`p-2.5 rounded-xl border hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all flex items-center justify-center ${
                          page.isPinned 
                            ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400' 
                            : 'border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                        }`}
                        title="Pin Page"
                      >
                        <Pin className={`w-4 h-4 ${page.isPinned ? 'fill-violet-600 dark:fill-violet-400' : ''}`} />
                      </button>
                      
                      <button 
                        onClick={() => toggleBookmark(dbId)}
                        className={`p-2.5 rounded-xl border hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all flex items-center justify-center ${
                          page.isBookmarked 
                            ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400' 
                            : 'border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                        }`}
                        title="Bookmark Page"
                      >
                        <Bookmark className={`w-4 h-4 ${page.isBookmarked ? 'fill-violet-600 dark:fill-violet-400' : ''}`} />
                      </button>

                      <button 
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all flex items-center justify-center"
                        title="Add to Collection"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
