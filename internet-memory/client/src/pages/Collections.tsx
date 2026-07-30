import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import type { Collection } from '@shared/types';
import { Folder, FolderPlus, Plus, Calendar, Files, Trash2 } from 'lucide-react';

export const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/collections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setIsOpen(false);
        fetchCollections();
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id && (c as any)._id !== id));

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/collections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to delete collection:', err);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      <main className="flex-grow p-8 max-w-5xl mx-auto flex flex-col gap-8 overflow-y-auto">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <Folder className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              Collections
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
              Group and organize your indexed memory pages into folder spaces.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-semibold rounded-xl shadow-lg shadow-violet-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Collection
          </button>
        </header>

        {/* Create collection Modal/Expandable Form */}
        {isOpen && (
          <section className="glass-effect rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 animate-fade-in">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <FolderPlus className="w-4.5 h-4.5 text-violet-500" />
              New Collection Details
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Collection Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning Prep"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-4 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Description (Optional)</label>
                <textarea
                  placeholder="Summarize the core topics or documents in this collection."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="pl-4 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-950/30 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white text-xs font-semibold rounded-xl shadow shadow-violet-500/10 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Collections Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-550 dark:text-zinc-400 col-span-2">
              <div className="w-8 h-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl col-span-2">
              No collections created yet.
            </div>
          ) : (
            collections.map((col) => {
              const dbId = (col as any)._id || col.id;
              return (
                <div 
                  key={dbId}
                  className="glass-effect rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 hover:shadow-md hover:border-violet-500/20 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                        <Folder className="w-5 h-5 fill-violet-500/10" />
                        <h2 className="text-md font-bold tracking-tight text-slate-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {col.name}
                        </h2>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(dbId)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {col.description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mt-2.5">
                        {col.description}
                      </p>
                    )}
                  </div>

                  {/* Collection stats */}
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-850 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Files className="w-3.5 h-3.5" />
                      <span>{col.pageIds.length} Pages Saved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Created {new Date(col.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};
