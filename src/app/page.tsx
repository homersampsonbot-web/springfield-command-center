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
        {/* Agent Status Chips Row */}
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 mb-8">
          {['HOMER', 'MARGE', 'LISA', 'BART', 'ZILLIZ'].map((name) => (
            <div key={name} className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/70">
              <div className={`w-1.5 h-1.5 rounded-full ${name === 'ZILLIZ' || (name === 'HOMER' && status?.homer?.status === 'alive') || (name === 'BART' && status?.bart?.status === 'alive') || (name === 'MARGE') || (name === 'LISA') ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
              {name}
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* PODIUM Section */}
          <section className="bg-gradient-to-b from-amber-800 to-amber-950 p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-[#FFD90F] text-white">
            <h2 className="text-center font-marker text-[#FFD90F] text-2xl mb-6 tracking-widest uppercase">Podium</h2>
            
            <div className="flex flex-col gap-6">
              {/* Podium Button Row 1 */}
              <div className="grid grid-cols-4 gap-2">
                {['DIRECTIVES', 'MARGE', 'LISA', 'DEBATE'].map((btn) => (
                  <button key={btn} className="bg-black/40 border border-[#FFD90F]/30 py-2 rounded-lg font-marker text-[10px] text-[#FFD90F] hover:bg-[#FFD90F]/10 transition-colors uppercase">
                    {btn}
                  </button>
                ))}
              </div>

              {/* Podium Button Row 2 */}
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
                {['TERMINAL', 'KANBAN'].map((btn) => (
                  <button key={btn} className="bg-black/40 border border-[#FFD90F]/30 py-2 rounded-lg font-marker text-[10px] text-[#FFD90F] hover:bg-[#FFD90F]/10 transition-colors uppercase">
                    {btn}
                  </button>
                ))}
              </div>

              {/* Directive Input */}
              <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 mt-4">
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
                  {sending ? '...' : <><Send size={20} className='mr-2' /> SEND</>}
                </button>
              </div>

              {lastResult && (
                <div className={`text-xs p-2 rounded-lg text-center ${lastResult.status === 'dispatched' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                  {lastResult.status === 'dispatched' ? `✅ Dispatched: ${lastResult.taskId?.slice(0,8)}` : `❌ Error: ${lastResult.message}`}
                </div>
              )}
            </div>
          </section>

          {/* Operational Units (Simplified Agent Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AGENTS.map((agent) => (
              <div key={agent.name} className={`glass-card p-4 flex flex-col items-center text-center border-t-4 ${agent.color}`}>
                <img src={agent.icon} alt={agent.name} className="w-12 h-12 mb-2" />
                <h3 className="font-marker text-[#FFD90F] text-xs uppercase">{agent.name}</h3>
                <p className="text-[8px] text-white/40 italic">{agent.role}</p>
              </div>
            ))}
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
