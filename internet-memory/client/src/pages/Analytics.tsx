import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { BarChart, BookOpen, Clock, Activity, Award, Tag } from 'lucide-react';

interface AnalyticsData {
  totalPages: number;
  totalReadingTime: number;
  difficultyDistribution: {
    Beginner: number;
    Intermediate: number;
    Advanced: number;
  };
  topTags: Array<{ name: string; count: number }>;
  activityWeekly: number[];
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calculate max weekly activity count to adjust chart scale
  const maxActivity = data ? Math.max(...data.activityWeekly, 1) : 1;

  // Calculate difficulty percentages
  const getDifficultyPercent = (count: number) => {
    if (!data || data.totalPages === 0) return 0;
    return Math.round((count / data.totalPages) * 100);
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      <main className="flex-grow p-8 max-w-5xl mx-auto flex flex-col gap-8 overflow-y-auto">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <BarChart className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
            Visual metrics analyzing your accumulated reading topics and engagement patterns.
          </p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-sm text-slate-500 dark:text-zinc-400">
            <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            Generating your metrics layout...
          </div>
        ) : !data || data.totalPages === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
            Not enough data to construct analytics. Index pages using the extension to see metrics here!
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Pages Captured Card */}
              <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Pages Saved</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">{data.totalPages}</h3>
                </div>
              </div>

              {/* Total Reading Time Card */}
              <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Reading Time</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">{data.totalReadingTime} mins</h3>
                </div>
              </div>

              {/* Avg Reading Speed Card */}
              <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Avg Session</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mt-0.5">
                    {Math.round(data.totalReadingTime / data.totalPages)} mins
                  </h3>
                </div>
              </div>

            </div>

            {/* Weekly Activity Grid & Difficulty Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Weekly Activity Chart */}
              <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-violet-500" />
                  Weekly Capture Intensity
                </h3>
                
                {/* CSS/Bar chart */}
                <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-100 dark:border-zinc-850 px-2">
                  {data.activityWeekly.map((val, idx) => {
                    const heightPercent = Math.round((val / maxActivity) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[40px] group">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm transition-opacity mb-1 select-none">
                          {val}
                        </div>
                        {/* Bar */}
                        <div 
                          className="w-8 rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500 transition-all duration-500 hover:from-violet-500 hover:to-indigo-400"
                          style={{ height: `${heightPercent || 4}%` }} // Minimal height for zero values
                        />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{daysOfWeek[idx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive Difficulty Breakdown */}
              <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Cognitive Complexity Breakdown
                </h3>

                <div className="flex flex-col gap-4 mt-2">
                  {/* Beginner bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      <span>Beginner Material</span>
                      <span>{data.difficultyDistribution.Beginner} ({getDifficultyPercent(data.difficultyDistribution.Beginner)}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${getDifficultyPercent(data.difficultyDistribution.Beginner)}%` }} />
                    </div>
                  </div>

                  {/* Intermediate bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      <span>Intermediate Material</span>
                      <span>{data.difficultyDistribution.Intermediate} ({getDifficultyPercent(data.difficultyDistribution.Intermediate)}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full transition-all duration-700" style={{ width: `${getDifficultyPercent(data.difficultyDistribution.Intermediate)}%` }} />
                    </div>
                  </div>

                  {/* Advanced bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      <span>Advanced Material</span>
                      <span>{data.difficultyDistribution.Advanced} ({getDifficultyPercent(data.difficultyDistribution.Advanced)}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${getDifficultyPercent(data.difficultyDistribution.Advanced)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Top Concept Tags */}
            <div className="glass-effect p-6 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-violet-500" />
                Frequently Read Concepts
              </h3>
              
              {data.topTags.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500">
                  No concept tags compiled yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {data.topTags.map((tag) => (
                    <div 
                      key={tag.name}
                      className="glass-effect px-4 py-2 border border-slate-200/40 dark:border-zinc-800/40 rounded-xl flex items-center gap-2 hover:border-violet-500/20 transition-all hover:shadow-sm"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{tag.name}</span>
                      <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-lg">
                        {tag.count}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
