import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import type { Page, TimelineGroup } from '@shared/types';
import { Clock, Calendar, ArrowUpRight, HelpCircle } from 'lucide-react';

export const Timeline: React.FC = () => {
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/pages', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const pages: Page[] = await res.json();
          const groups = groupPages(pages);
          setTimelineGroups(groups);
        }
      } catch (err) {
        console.error('Failed to fetch timeline pages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const groupPages = (pages: Page[]): TimelineGroup[] => {
    const groups: { [key: string]: Page[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    pages.forEach(page => {
      const pageDate = new Date(page.createdAt);
      pageDate.setHours(0, 0, 0, 0);

      if (pageDate.getTime() === today.getTime()) {
        groups['Today'].push(page);
      } else if (pageDate.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(page);
      } else if (pageDate.getTime() >= sevenDaysAgo.getTime()) {
        groups['This Week'].push(page);
      } else {
        groups['Older'].push(page);
      }
    });

    return Object.keys(groups)
      .map(key => ({ dateLabel: key, pages: groups[key] }))
      .filter(g => g.pages.length > 0);
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      <main className="flex-grow p-8 max-w-4xl mx-auto flex flex-col gap-8 overflow-y-auto">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <Clock className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Timeline View
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
            Navigate through your browsing memory organized chronologically.
          </p>
        </header>

        {loading ? (
          <div className="text-center py-12 text-sm text-slate-550 dark:text-zinc-400">
            <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            Loading timeline...
          </div>
        ) : timelineGroups.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
            No pages recorded in your timeline.
          </div>
        ) : (
          /* Timeline Track */
          <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-4 pl-8 flex flex-col gap-8">
            {timelineGroups.map((group) => (
              <div key={group.dateLabel} className="relative">
                {/* Timeline Marker node */}
                <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-violet-600 dark:bg-violet-500 border-4 border-slate-50 dark:border-zinc-950 flex items-center justify-center shadow-sm">
                  <Calendar className="w-2.5 h-2.5 text-white" />
                </div>

                {/* Day title */}
                <h2 className="text-md font-bold tracking-tight text-slate-800 dark:text-zinc-200 mb-4 bg-slate-50 dark:bg-zinc-950 pr-4 inline-block">
                  {group.dateLabel}
                </h2>

                {/* Pages Visited in this timeline group */}
                <div className="flex flex-col gap-4">
                  {group.pages.map((page) => {
                    const dbId = (page as any)._id || page.id;
                    return (
                      <div 
                        key={dbId}
                        className="glass-effect rounded-2xl p-4 border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 hover:shadow-md hover:border-violet-500/20 transition-all flex items-start gap-4"
                      >
                        {/* Favicon or fallback */}
                        <div className="mt-1 flex-shrink-0">
                          {page.favicon ? (
                            <img 
                              src={page.favicon} 
                              alt="" 
                              className="w-4 h-4 rounded-md object-contain" 
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                            />
                          ) : (
                            <HelpCircle className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm truncate hover:text-violet-600 dark:hover:text-violet-400">
                            <a href={page.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 inline-flex">
                              {page.title}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                            </a>
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                            Visited at {new Date(page.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {page.summary && (
                            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 line-clamp-2">
                              {page.summary.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
