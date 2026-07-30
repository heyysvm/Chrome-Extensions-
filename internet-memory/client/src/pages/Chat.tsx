import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Send, Sparkles, MessageSquare, ExternalLink, HelpCircle } from 'lucide-react';
import type { Page } from '@shared/types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: Page[];
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your Internet Memory Assistant. Ask me anything about pages you've visited recently, and I will search your indexed memory to answer.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        headers['x-gemini-api-key'] = savedKey;
      }

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessageText })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get chat response.');
      }

      const data = await res.json();
      
      const aiMsg: Message = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: data.response,
        citations: data.citations,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: 'msg_err_' + Date.now(),
        sender: 'ai',
        text: `Sorry, I encountered an error: ${error.message || 'Unknown network error'}. Please verify your Gemini API key is configured.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <Sidebar />

      <main className="flex-grow max-w-4xl mx-auto flex flex-col h-screen p-8 gap-6 overflow-hidden">
        
        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Chat with your Memory
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-xs">
              Converse with your browser index using Retrieval-Augmented Generation.
            </p>
          </div>
        </header>

        {/* Conversation Thread */}
        <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4 py-2 border-y border-slate-200/50 dark:border-zinc-800/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              {/* Message Bubble */}
              <div 
                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm font-medium ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-none'
                    : 'glass-effect border border-slate-200/50 dark:border-zinc-850/50 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Citations / Page Sources */}
              {msg.sender === 'ai' && msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2.5 w-full">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">
                    Retrieved Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((page) => {
                      const dbId = (page as any)._id || page.id;
                      return (
                        <a
                          key={dbId}
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-effect px-3 py-2 rounded-xl border border-slate-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-900/40 hover:border-violet-500/20 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2 hover:shadow-sm transition-all"
                        >
                          {page.favicon ? (
                            <img src={page.favicon} alt="" className="w-3.5 h-3.5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          ) : (
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="truncate max-w-[150px]">{page.title}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Model Loading State */}
          {loading && (
            <div className="self-start flex flex-col max-w-[80%] items-start">
              <div className="glass-effect p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-slate-200/50 dark:border-zinc-850/50 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                <span>AI is searching and summarizing your browser memory...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex-shrink-0 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask your history: 'What articles did I read about transactions in MongoDB?'"
            className="flex-grow pl-5 pr-5 py-3.5 rounded-2xl text-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 rounded-2xl bg-violet-600 hover:bg-violet-750 active:bg-violet-850 text-white flex items-center justify-center transition-all shadow-md shadow-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </main>
    </div>
  );
};
