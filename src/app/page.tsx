"use client";

import React, { useState, useEffect } from 'react';
import { Send, Activity, Database, Server, Shield, Monitor, Layout } from 'lucide-react';

const AGENTS = [
  { 
    name: 'Marge', 
    role: 'Chief Architect', 
    icon: '/icons/marge.png', 
    desc: 'Claude | Architecture & Specs',
    color: 'border-blue-500'
  },
  { 
    name: 'Lisa', 
    role: 'Strategist', 
    icon: '/icons/lisa.png', 
    desc: 'GPT-4o | Planning & Debate',
    color: 'border-red-600'
  },
  { 
    name: 'Homer', 
    role: 'Executor', 
    icon: '/icons/homer.png', 
    desc: 'Gemini | Build & Deploy',
    color: 'border-orange-500',
    terminal: true
  },
  { 
    name: 'Bart', 
    role: 'QA Validator', 
    icon: '/icons/bart.png', 
    desc: 'Gemini | UI & Testing',
    color: 'border-red-500'
  },
];

export default function CommandCenter() {
  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<any>(null);

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

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D1A]">
        <div className="glass-card p-10 max-w-md w-full text-center border-[#FFD90F] border-4">
          <img src="/icons/homer.png" className="mx-auto mb-6 w-24 h-24" alt="Homer" />
          <h1 className="text-3xl font-marker mb-8 text-[#FFD90F] uppercase tracking-wider">Classified Access</h1>
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
        {/* Header - Mayor's Podium */}
        <header className="max-w-4xl mx-auto bg-gradient-to-b from-amber-800 to-amber-950 p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-[#FFD90F] text-white text-center">
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
          <h1 className="text-4xl md:text-5xl font-marker mb-8 text-[#FFD90F] uppercase tracking-tighter">Mayor Quimby's Podium</h1>
          <div className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10">
            <input 
              className="flex-grow bg-transparent p-4 text-lg font-elite outline-none placeholder-white/30"
              placeholder="Issue a new directive..."
            />
            <button className="bg-[#FFD90F] text-black p-4 rounded-xl hover:scale-105 transition-transform">
              <Send size={24} />
            </button>
          </div>
        </header>

        {/* Agent Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {AGENTS.map((agent) => (
            <div key={agent.name} className={`glass-card p-6 flex flex-col items-center text-center border-t-8 ${agent.color}`}>
              <img src={agent.icon} alt={agent.name} className="w-20 h-20 mb-4 drop-shadow-lg" />
              <h2 className="text-2xl font-marker text-[#FFD90F] uppercase tracking-wide">{agent.name}</h2>
              <p className="text-[10px] font-bold text-blue-400 mb-4 uppercase tracking-widest">{agent.role}</p>
              <p className="text-[10px] text-white/50 mb-6 italic">{agent.desc}</p>
              
              {agent.terminal ? (
                <div className="terminal w-full h-32 text-left overflow-hidden">
                  <div className="text-green-500/80">
                    <span className="text-green-400">root@springfield:~#</span> tail -f tasks.log<br/>
                    <span className="text-white/40">[{new Date().toLocaleTimeString()}]</span> Awaiting directive...<br/>
                    <span className="text-green-400">_</span><span className="cursor-blink">|</span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white/5 rounded-xl p-4 text-left font-mono text-[9px] h-32 border border-white/5 text-white/40">
                  // System initialized...<br/>
                  // Listening for specs...
                </div>
              )}
            </div>
          ))}
        </main>
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
