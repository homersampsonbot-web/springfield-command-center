"use client";

import React, { useState, useEffect } from 'react';
import { Send, Activity, Database, Server, Shield, Monitor, Layout, MessageSquare } from 'lucide-react';

const AGENTS = [
  { name: 'Marge', role: 'Chief Architect', icon: 'https://img.icons8.com/color/96/marge-simpson.png', desc: 'Claude | Architecture & Specs' },
  { name: 'Lisa', role: 'Strategist', icon: 'https://img.icons8.com/color/96/lisa-simpson.png', desc: 'GPT-4o | Planning & Debate' },
  { name: 'Homer', role: 'Executor', icon: 'https://img.icons8.com/color/96/homer-simpson.png', desc: 'Gemini | Build & Deploy' },
  { name: 'Bart', role: 'QA Validator', icon: 'https://img.icons8.com/color/96/bart-simpson.png', desc: 'Gemini | UI & Testing' },
];

export default function CommandCenter() {
  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('D\'oh! Access Denied.');
      }
    } catch (err) {
      setError('System Failure.');
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-8 border-[#FED90F] max-w-md w-full text-center">
          <img src="https://img.icons8.com/color/96/homer-simpson.png" className="mx-auto mb-6" alt="Homer" />
          <h1 className="text-3xl font-black mb-6 text-gray-900 uppercase">Classified Access</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="md:hidden">
              <input 
                type="password" 
                placeholder="4-DIGIT PIN" 
                maxLength={4}
                className="w-full p-4 text-center text-2xl tracking-widest border-4 border-gray-200 rounded-xl"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
            <div className="hidden md:block">
              <input 
                type="password" 
                placeholder="PASSWORD" 
                className="w-full p-4 text-center border-4 border-gray-200 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-[#FED90F] hover:bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {loading ? 'CHECKING...' : 'ENTER COMMAND CENTER'}
            </button>
            {error && <p className="text-red-500 font-bold mt-4">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans text-gray-900 pb-24 md:pb-8">
      {/* Background Clouds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="cloud-animation h-16 w-32 md:h-24 md:w-48"
            style={{ 
              top: `${i * 15}%`, 
              animationDuration: `${20 + i * 5}s`,
              animationDelay: `-${i * 3}s` 
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-8">
        {/* Header - Mayor's Podium */}
        <header className="max-w-4xl mx-auto bg-amber-800 p-6 md:p-8 rounded-b-3xl shadow-2xl border-x-8 border-b-8 border-amber-900 text-white text-center">
          <div className="mb-4 flex justify-center gap-4">
            <div className="status-pill status-online flex items-center gap-2">
              <Server size={14} /> HOMER GATEWAY LIVE
            </div>
            <div className="status-pill status-online flex items-center gap-2">
              <Database size={14} /> ZILLIZ ON
            </div>
            <div className="status-pill status-pending flex items-center gap-2">
              <Activity size={14} /> BART PENDING
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter">Mayor Quimby's Podium</h1>
          <div className="flex gap-2 bg-white/10 p-2 rounded-2xl">
            <input 
              className="flex-grow bg-transparent p-4 text-xl outline-none placeholder-white/50"
              placeholder="Issue a new directive..."
            />
            <button className="bg-[#FED90F] text-black p-4 rounded-xl hover:scale-105 transition-transform">
              <Send />
            </button>
          </div>
        </header>

        {/* Agent Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="agent-panel flex flex-col items-center text-center">
              <img src={agent.icon} alt={agent.name} className="w-24 h-24 mb-4" />
              <h2 className="text-2xl font-black uppercase text-gray-800">{agent.name}</h2>
              <p className="text-sm font-bold text-blue-600 mb-4">{agent.role}</p>
              <p className="text-xs text-gray-500 font-medium mb-6">{agent.desc}</p>
              <div className="w-full bg-gray-100 rounded-xl p-4 text-left font-mono text-[10px] h-32 overflow-hidden border-2 border-gray-200">
                <span className="text-green-600">[READY]</span> Awaiting instructions...
              </div>
            </div>
          ))}
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-4 border-[#FED90F] md:hidden p-4 flex justify-around z-50">
        <Monitor className="text-gray-400 hover:text-blue-500" />
        <Layout className="text-blue-500" />
        <Database className="text-gray-400 hover:text-blue-500" />
        <Shield className="text-gray-400 hover:text-blue-500" />
      </nav>
    </div>
  );
}
