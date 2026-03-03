"use client";

import React, { useState, useEffect } from 'react';
import { Send, Activity, Database, Server, Shield, Monitor, Layout, Terminal, List, MessageSquare, Briefcase } from 'lucide-react';

const AGENTS = [
  { 
    name: 'Marge', 
    role: 'Chief Architect', 
    icon: '/icons/marge.png', 
    desc: 'Claude | Architecture & Specs',
    color: 'border-blue-500',
    link: 'https://marge.margebot.com'
  },
  { 
    name: 'Lisa', 
    role: 'Strategist', 
    icon: '/icons/lisa.png', 
    desc: 'GPT-4o | Planning & Debate',
    color: 'border-red-600',
    link: 'https://lisa.margebot.com'
  },
  { 
    name: 'Homer', 
    role: 'Executor', 
    icon: '/icons/homer.png', 
    desc: 'Gemini | Build & Deploy',
    color: 'border-orange-500',
    terminal: true,
    link: 'https://ssh.margebot.com'
  },
  { 
    name: 'Bart', 
    role: 'QA Validator', 
    icon: '/icons/bart.png', 
    desc: 'Gemini | UI & Testing',
    color: 'border-red-500',
    link: 'https://bart.margebot.com'
  },
];

export default function CommandCenter() {
  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<any>(null);

  // New directive states
  const [directive, setDirective] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    if (auth) {
      const fetchStatus = async () => {
        try {
          const res = await fetch('/api/status');
          const data = await res.json();
          setStatus(data);
        } catch (e) {}
      };
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [auth]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, password }),
      });
      
      if (res.ok) {
        setAuth(true);
      } else {
        setError("D'oh! Access Denied.");
      }
    } catch (err) {
      setError('System Failure.');
    } finally {
      setLoading(false);
    }
  };

  async function handleSend() {
    if (!directive.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive })
      });
      const data = await res.json();
      setLastResult(data);
      setDirective('');
    } catch(e) {
      setLastResult({ status: 'error', message: 'Failed to reach Marge' });
    } finally {
      setSending(false);
    }
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D1A]">
        <div className="glass-card p-10 max-w-md w-full text-center border-[#FFD90F] border-4">
          <img src="/icons/homer.png" className="mx-auto mb-6 w-24 h-24" alt="Homer" />
          <h1 className="text-3xl font-marker mb-8 text-[#FFD90F] uppercase tracking-wider">Classified Access</h1>
          <div className="text-[10px] opacity-40 font-mono uppercase tracking-widest mt-[-1.5rem] mb-8">Build: e0af284 · 2026-03-03 16:49 UTC</div>
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="md:hidden">
              <input 
                type="password" 
                placeholder="4-DIGIT PIN" 
                maxLength={4}
                className="auth-input w-full text-2xl tracking-[1em] font-mono"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
            <div className="hidden md:block">
              <input 
                type="password" 
                placeholder="PASSWORD" 
                className="auth-input w-full font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-[#FFD90F] hover:bg-yellow-400 text-black font-marker py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-xl"
            >
              {loading ? 'CHECKING...' : 'ENTER COMMAND CENTER'}
            </button>
            {error && <p className="text-red-500 font-elite mt-4">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 md:pb-8 overflow-hidden font-elite">
      {/* Background Clouds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="cloud h-16 w-32 md:h-20 md:w-40"
            style={{ 
              top: `${i * 18}%`, 
              left: `${-20}%`,
              animationDuration: `${25 + i * 8}s`,
              animationDelay: `-${i * 5}s` 
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-8">
        {/* Main Dashboard Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Podium / Directives */}
          <div className="lg:col-span-2 space-y-8">
            <header className="bg-gradient-to-b from-amber-800 to-amber-950 p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-[#FFD90F] text-white text-center">
              <div className="mb-6 flex flex-wrap justify-center gap-4">
                <div className={`status-pill px-4 py-1 rounded-full text-[10px] font-bold border-2 ${status?.homer?.status === 'alive' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400'}`}>
                  HOMER GATEWAY {status?.homer?.status === 'alive' ? 'LIVE' : 'OFFLINE'}
                </div>
                <div className="status-pill px-4 py-1 rounded-full text-[10px] font-bold border-2 border-green-500 bg-green-500/10 text-green-400">
                  ZILLIZ ON
                </div>
                <div className={`status-pill px-4 py-1 rounded-full text-[10px] font-bold border-2 ${status?.bart?.status === 'alive' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-amber-500 bg-amber-500/10 text-amber-400'}`}>
                  BART {status?.bart?.status === 'alive' ? 'LIVE' : 'PENDING'}
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-marker mb-8 text-[#FFD90F] uppercase tracking-tighter">Command Podium</h1>
              
              <div className="flex flex-col gap-2 text-left">
                <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10">
                  <input 
                    className="flex-grow bg-transparent p-4 text-lg font-elite outline-none placeholder-white/30"
                    placeholder="Issue a new directive..."
                    value={directive}
                    onChange={e => setDirective(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={sending}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={sending}
                    className="bg-[#FFD90F] text-black p-4 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {sending ? '...' : <><Send size={20} className='mr-2' /> SEND DIRECTIVE</>}
                  </button>
                </div>
                {lastResult && (
                  <div className={`text-xs p-2 rounded-lg ${lastResult.status === 'dispatched' ? 'bg-green-900/50 text-green-300' : lastResult.status === 'escalation' ? 'bg-red-900/50 text-red-300' : 'bg-white/10 text-white/50'}`}>
                    {lastResult.status === 'dispatched' && `✅ Dispatched — Task ${lastResult.taskId?.slice(0,8)}`}
                    {lastResult.status === 'escalation' && `🚨 Escalation — ${lastResult.reason}`}
                    {lastResult.status === 'error' && `❌ ${lastResult.message}`}
                    {lastResult.debateLog?.length > 1 && ` · Marge + Lisa debated`}
                  </div>
                )}
              </div>
            </header>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button className="feature-button bg-blue-900/20 border-blue-500/30 text-blue-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-blue-500/10 transition-colors group">
                <MessageSquare className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">Strategic Debate</span>
              </button>
              <button className="feature-button bg-orange-900/20 border-orange-500/30 text-orange-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-orange-500/10 transition-colors group">
                <List className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">Active Kanban</span>
              </button>
              <a href="https://ssh.margebot.com" target="_blank" className="feature-button bg-green-900/20 border-green-500/30 text-green-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-green-500/10 transition-colors group">
                <Terminal className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">Homer Terminal</span>
              </a>
              <button className="feature-button bg-purple-900/20 border-purple-500/30 text-purple-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-purple-500/10 transition-colors group">
                <Briefcase className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">Project Specs</span>
              </button>
              <button className="feature-button bg-red-900/20 border-red-500/30 text-red-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-red-500/10 transition-colors group">
                <Shield className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">Audit Logs</span>
              </button>
              <button className="feature-button bg-amber-900/20 border-amber-500/30 text-amber-400 p-6 rounded-2xl border flex flex-col items-center gap-3 hover:bg-amber-500/10 transition-colors group">
                <Activity className="group-hover:scale-110 transition-transform" />
                <span className="font-marker text-sm uppercase">System Health</span>
              </button>
            </div>
          </div>

          {/* Right Column: Agent Status */}
          <div className="space-y-6">
            <h2 className="text-xl font-marker text-[#FFD90F] uppercase tracking-widest pl-2">Operational Units</h2>
            <div className="grid grid-cols-1 gap-4">
              {AGENTS.map((agent) => (
                <a 
                  key={agent.name} 
                  href={agent.link} 
                  target="_blank"
                  className={`glass-card p-4 flex items-center gap-4 border-l-4 ${agent.color} hover:bg-white/5 transition-colors group`}
                >
                  <img src={agent.icon} alt={agent.name} className="w-12 h-12 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <h3 className="text-lg font-marker text-[#FFD90F] uppercase leading-none">{agent.name}</h3>
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">{agent.role}</p>
                    <p className="text-[8px] text-white/40 italic">{agent.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A]/95 backdrop-blur-lg border-t-4 border-[#FFD90F] md:hidden p-4 flex justify-around z-50">
        <Monitor className="text-white/40" />
        <Layout className="text-[#FFD90F]" />
        <Database className="text-white/40" />
        <Shield className="text-white/40" />
      </nav>
    </div>
  );
}
