import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  Tag, 
  Compass, 
  HelpCircle, 
  Send,
  MessageSquare,
  FileText,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import type { Page, ChatMessage } from '@shared/types';

export const SidePanel: React.FC = () => {
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');

  // Hardcoded mock analysis just for visual rendering
  const mockAnalysis: Page = {
    id: 'active_mock',
    url: 'https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/',
    title: 'OAuth2 with Password (and hashing), Bearer with JWT tokens - FastAPI',
    favicon: 'https://fastapi.tiangolo.com/img/favicon.png',
    isPinned: false,
    isBookmarked: true,
    collectionIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    summary: {
      summary: 'This guide explains setting up JWT token authorization inside a Python FastAPI environment. It walks through compiling password hashes via passlib, verifying scopes, and securing paths using dependencies.',
      tags: ['FastAPI', 'JWT', 'OAuth2', 'Python', 'Security'],
      topics: ['Backend Security', 'APIs'],
      difficulty: 'Intermediate',
      readingTime: 12
    }
  };

  useEffect(() => {
    // query active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url?.startsWith('http')) {
        // Look up if we have cached this page in local storage
        chrome.storage.local.get(['indexingQueue'], (settings) => {
          const queue = settings.indexingQueue || [];
          const found = queue.find((item: any) => item.url === tabs[0].url);
          
          if (found) {
            setActivePage({
              id: 'local_cached',
              url: found.url,
              title: found.title,
              favicon: found.favicon,
              createdAt: found.timestamp,
              updatedAt: found.timestamp,
              isPinned: false,
              isBookmarked: false,
              collectionIds: [],
              summary: {
                summary: `This is a locally extracted webpage summary. Core contents parsed from: ${found.title}. Content cleaning stripped out structural layout tags, ads, and sidebars.`,
                tags: ['Captured', 'Readability', 'DOM Extraction'],
                topics: ['Uncategorized'],
                difficulty: 'Intermediate',
                readingTime: Math.max(1, Math.round(found.rawText.length / 900))
              }
            });
          } else {
            // Display standard mock analytics if page not fully saved yet (fallback demonstration)
            setActivePage({
              ...mockAnalysis,
              title: tabs[0].title || mockAnalysis.title,
              url: tabs[0].url || mockAnalysis.url
            });
          }
        });
      }
    });

    // Listen for tab switching
    const handleTabActivated = () => {
      // Reload current tab content
      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url?.startsWith('http')) {
            chrome.storage.local.get(['indexingQueue'], (settings) => {
              const queue = settings.indexingQueue || [];
              const found = queue.find((item: any) => item.url === tabs[0].url);
              if (found) {
                setActivePage({
                  id: 'local_cached',
                  url: found.url,
                  title: found.title,
                  favicon: found.favicon,
                  createdAt: found.timestamp,
                  updatedAt: found.timestamp,
                  isPinned: false,
                  isBookmarked: false,
                  collectionIds: [],
                  summary: {
                    summary: `This is a locally extracted webpage summary. Core contents parsed from: ${found.title}. Content cleaning stripped out structural layout tags, ads, and sidebars.`,
                    tags: ['Captured', 'Readability', 'DOM Extraction'],
                    topics: ['Uncategorized'],
                    difficulty: 'Intermediate',
                    readingTime: Math.max(1, Math.round(found.rawText.length / 900))
                  }
                });
              } else {
                setActivePage({
                  ...mockAnalysis,
                  title: tabs[0].title || mockAnalysis.title,
                  url: tabs[0].url || mockAnalysis.url
                });
              }
            });
          }
        });
      }, 500);
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => chrome.tabs.onActivated.removeListener(handleTabActivated);
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Math.random()),
      role: 'user',
      content: chatQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatQuery('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: String(Math.random()),
        role: 'assistant',
        content: `Analyzing "${activePage?.title || 'this page'}"... Based on the extracted text, the key points relate to OAuth2 token security, token lifetime configurations, and securing endpoints with fastapi dependencies. Let me know if you would like me to summarize any specific segment!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 1000);
  };

  if (!activePage) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 p-6 flex flex-col justify-center items-center gap-4 text-center">
        <Compass className="w-10 h-10 text-zinc-700 animate-spin-slow" />
        <div>
          <h3 className="font-semibold text-zinc-300 text-sm">Internet Memory</h3>
          <p className="text-xs text-zinc-650 mt-1">Open a standard website tab (http/https) to view AI summary and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between h-screen border-l border-zinc-900">
      
      {/* Top Section / Page Title */}
      <div className="p-5 border-b border-zinc-900/80 bg-zinc-950/70 sticky top-0 backdrop-blur-md z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Page Insights
            </span>
          </div>
          <Bookmark className="w-4 h-4 text-violet-400 fill-violet-500/10" />
        </div>

        <div className="flex items-start gap-2.5">
          {activePage.favicon && (
            <img 
              src={activePage.favicon} 
              alt="" 
              className="w-4.5 h-4.5 rounded object-contain mt-0.5" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          )}
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-relaxed">
              {activePage.title}
            </h1>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
              {activePage.url}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-900 mt-2 p-0.5 bg-zinc-900/30 rounded-xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'summary' 
                ? 'bg-zinc-800 text-zinc-100' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat' 
                ? 'bg-zinc-800 text-zinc-100' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
        </div>
      </div>

      {/* Mid Section / Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && activePage.summary && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* AI Summary Block */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
                AI Summary
              </h3>
              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900 text-xs text-zinc-300 leading-relaxed font-medium">
                {activePage.summary.summary}
              </div>
            </div>

            {/* Reading details & Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-[9px] font-semibold text-zinc-500 uppercase">Reading Time</div>
                  <div className="text-xs font-bold text-zinc-200 mt-0.5">{activePage.summary.readingTime} min</div>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-[9px] font-semibold text-zinc-500 uppercase">Difficulty</div>
                  <div className="text-xs font-bold text-zinc-200 mt-0.5">{activePage.summary.difficulty}</div>
                </div>
              </div>
            </div>

            {/* Extracted tags */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-violet-400" />
                Concept Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {activePage.summary.tags.map(tag => (
                  <span key={tag} className="bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:border-violet-500/20 transition-all">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {chatHistory.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 text-center flex flex-col items-center gap-2 mt-4">
                <MessageSquare className="w-6 h-6 text-zinc-700" />
                <h4 className="text-xs font-semibold text-zinc-400">Ask your memory</h4>
                <p className="text-[10px] text-zinc-600">Query this document: "What were the main conclusions?", "Explain JWT configuration details."</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed font-medium ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-none self-end'
                        : 'bg-zinc-900/50 border border-zinc-900 text-zinc-300 rounded-tl-none self-start'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <span className={`text-[8px] font-bold mt-1 inline-block ${
                      msg.role === 'user' ? 'text-violet-200 self-end' : 'text-zinc-650'
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 italic p-1">
                    <div className="w-4 h-4 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
                    <span>AI is answering...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section / Chat Input (only visible on chat tab) */}
      {activeTab === 'chat' ? (
        <form onSubmit={handleSendChat} className="p-5 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur">
          <div className="relative">
            <input
              type="text"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask about this document..."
              className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-xs placeholder:text-zinc-600 text-zinc-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:text-violet-400 text-zinc-400 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] text-zinc-700 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Summarized dynamically using Gemini API models</span>
        </div>
      )}
    </div>
  );
};
