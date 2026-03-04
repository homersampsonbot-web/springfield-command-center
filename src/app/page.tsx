import Image from 'next/image';
'use client';
import { useState, useEffect, useRef } from 'react';
import EventStream from '@/components/EventStream';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [results, setResults] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, {role:string,text:string}[]>>({});
  const [chatInput, setChatInput] = useState<Record<string,string>>({});
  const [gatewayStatus, setGatewayStatus] = useState<Record<string,string>>({ homer: 'checking', marge: 'checking', lisa: 'checking', bart: 'checking', zilliz: 'checking', gateway: 'checking' });
  const [activeTab, setActiveTab] = useState('directives');
  const [debateTopic, setDebateTopic] = useState('');
  const [debateResponses, setDebateResponses] = useState<{marge?:string, lisa?:string} | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [toast, setToast] = useState<{message:string, type:string} | null>(null);
  const lastResultId = useRef<string | null>(null);

  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!auth) return;
    
    const fetchHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const s = await fetch(`${BASE}/api/system-health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const hData = await s.json();
        setSystemHealth(hData);

        setGatewayStatus({ 
          gateway: hData.gateway,
          database: hData.database === 'connected' ? 'online' : 'offline',
          queue: hData.queue === 'connected' ? 'online' : 'offline',
          homer: hData.agents?.homer === 'alive' ? 'online' : 'offline',
          bart: hData.agents?.bart === 'alive' ? 'online' : 'offline',
          lisa: hData.agents?.lisa === 'available' ? 'online' : 'offline',
          maggie: hData.agents?.maggie === 'alive' ? 'online' : hData.agents?.maggie === 'initializing' ? 'pending' : 'offline'
        });
      } catch {
        setGatewayStatus({ homer: 'offline', marge: 'offline', lisa: 'offline', bart: 'offline', zilliz: 'offline', gateway: 'offline', database: 'offline', queue: 'offline' });
      }
    };

    const fetchJobs = async () => {
      try {
        const r = await fetch(`${BASE}/api/jobs`);
        const d = await r.json();
        const pending = d.filter((j: any) => j.status !== 'DONE').slice(0, 3);
        setActiveJobs(pending);
      } catch {}
    };

    fetchHealth();
    fetchJobs();
    
    const interval = setInterval(() => {
      fetchHealth();
      fetchJobs();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [auth]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        setAuth(true);
        const searchParams = new URLSearchParams(window.location.search);
        const next = searchParams.get('next');
        if (next) window.location.href = next;
      } else {
        alert('Invalid PIN');
        setPin('');
      }
    } catch (e) {
      alert('Authentication error');
    }
  };

  const sendDirective = async () => {
    if (!directive.trim()) return;
    setStatus('Dispatching...');
    try {
      const r = await fetch(`${BASE}/api/directive`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ directive }) 
      });
      const d = await r.json();
      setStatus(`✅ Dispatched — Task ID: ${d.taskId?.slice(0,8)}`);
      setDirective('');
    } catch {
      setStatus('❌ Send failed');
    }
  };

  const sendChat = async (agentId: string) => {
    const msg = chatInput[agentId];
    if (!msg?.trim()) return;
    setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'user', text:msg }] }));
    setChatInput(c => ({ ...c, [agentId]: '' }));
    try {
      const r = await fetch(`${BASE}/api/chat`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ agent: agentId, message: msg }) 
      });
      const d = await r.json();
      setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'assistant', text: d.reply || 'No response' }] }));
    } catch {
      setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'assistant', text:'Connection failed.' }] }));
    }
  };

  const GlassPanel = ({ children, title, style }: any) => (
    <div style={{ 
      background: 'rgba(255,255,255,0.03)', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,217,15,0.1)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style
    }}>
      {title && (
        <div style={{ 
          padding: '10px 16px', 
          borderBottom: '1px solid rgba(255,217,15,0.1)',
          fontFamily: 'Permanent Marker',
          color: '#FFD90F',
          fontSize: 14,
          letterSpacing: '0.05em'
        }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, padding: 16 }}>{children}</div>
    </div>
  );

  const StatusLight = ({ label, status }: any) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ 
        width: 8, 
        height: 8, 
        borderRadius: '50%', 
        background: status === 'online' ? '#7ED321' : status === 'pending' ? '#FFD90F' : '#FF4444',
        boxShadow: status === 'online' ? '0 0 8px #7ED321' : status === 'pending' ? '0 0 8px #FFD90F' : '0 0 8px #FF4444'
      }} />
    </div>
  );

  if (!auth) return (
    <div style={{ position: 'relative',  minHeight:'100vh', background:'#0D0D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24 }}>
      
      {/* LOGIN HERO BACKGROUND */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -10 }}>
        <Image 
          src="/login/springfield-map.png" 
          alt="Welcome to Springfield" 
          fill 
          priority 
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      </div>
<div style={{ fontFamily:'Permanent Marker', fontSize:48, color:'#FFD90F', textShadow:'0 0 30px #FFD90F88' }}>SPRINGFIELD</div>
      <input 
        type="password" 
        value={pin} 
        onChange={e => setPin(e.target.value)} 
        onKeyDown={e => e.key === 'Enter' && handleLogin()} 
        style={{ padding:'12px 24px', borderRadius:12, border:'2px solid #FFD90F', background:'#1a1a2e', color:'#fff', textAlign:'center', outline:'none' }} 
      />
      <button onClick={handleLogin} style={{ padding:'12px 32px', background:'#FFD90F', borderRadius:12, fontFamily:'Permanent Marker', cursor:'pointer' }}>ENTER</button>
    </div>
  );

  return (
    <div style={{ 
      minHeight:'100vh', 
      background:'#080810', 
      color: '#fff',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: '280px 1fr 280px',
      gridTemplateRows: 'auto 1fr 200px',
      gap: '20px',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* Top Header */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🍩</span>
          <h1 style={{ fontFamily: 'Permanent Marker', fontSize: 24, color: '#FFD90F', margin: 0 }}>MISSION CONTROL</h1>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,217,15,0.3)', fontFamily: 'monospace' }}>
          BUILD: {systemHealth?.build || 'v1.5-MOBILE-DND'}
        </div>
      </div>

      {/* Left Column: Active Jobs */}
      <div style={{ gridRow: '2 / 3' }}>
        <GlassPanel title="ACTIVE JOBS" style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeJobs.map(job => (
              <div key={job.id} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid #FFD90F' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{job.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  <span>{job.owner}</span>
                  <span style={{ color: '#FFD90F' }}>{job.status}</span>
                </div>
              </div>
            ))}
            {!activeJobs.length && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>No active tasks</div>}
          </div>
        </GlassPanel>
      </div>

      {/* Center: Command Podium */}
      <div style={{ gridRow: '2 / 3', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <GlassPanel title="COMMAND PODIUM" style={{ flex: 1 }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
             {/* Podium Tabs */}
             <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['directives','marge','lisa','terminal'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    flex:1, padding:'8px', 
                    background: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.05)', 
                    color: activeTab===tab ? '#000' : '#fff', 
                    border:'none', borderRadius:8, fontFamily:'Permanent Marker', fontSize:10, cursor:'pointer' 
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
              <button 
                onClick={() => window.open('/kanban', '_blank')}
                style={{ flex:1, padding:'8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border:'none', borderRadius:8, fontFamily:'Permanent Marker', fontSize:10, cursor:'pointer' }}
              >
                KANBAN ↗
              </button>
            </div>

            <div style={{ flex: 1 }}>
              {activeTab === 'directives' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
                  <textarea 
                    value={directive} 
                    onChange={e => setDirective(e.target.value)} 
                    placeholder="Enter strategic directive..." 
                    style={{ flex: 1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,217,15,0.2)', borderRadius:8, padding:12, color:'#FFD90F', fontSize:14, resize:'none', outline:'none' }} 
                  />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{status}</span>
                    <button onClick={sendDirective} style={{ padding:'10px 20px', background:'#FFD90F', color:'#000', border:'none', borderRadius:8, fontFamily:'Permanent Marker', fontSize:14, cursor:'pointer' }}>DISPATCH ➤</button>
                  </div>
                </div>
              )}

              {activeTab === 'marge' && (
                 <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, overflowY: 'auto', fontSize: 12 }}>
                      {(chatMessages.marge||[]).map((m,i) => (
                        <div key={i} style={{ marginBottom: 6, color: m.role === 'user' ? '#FFD90F' : '#fff' }}>
                          <span style={{ opacity: 0.5 }}>{m.role === 'user' ? 'SMS: ' : 'MARGE: '}</span>{m.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        value={chatInput.marge||''} 
                        onChange={e => setChatInput(c=>({...c, marge:e.target.value}))} 
                        onKeyDown={e => e.key==='Enter' && sendChat('marge')}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#fff' }}
                        placeholder="Relay message to Marge..."
                      />
                      <button onClick={() => sendChat('marge')} style={{ padding: '8px 16px', background: '#4A90D9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>➤</button>
                    </div>
                 </div>
              )}
              
              {activeTab === 'terminal' && (
                <div style={{ background:'#000', borderRadius:8, padding:12, height: '100%', fontFamily:'monospace', fontSize:11, color:'#00FF41', overflowY:'auto' }}>
                  {results.length ? results.map((r,i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <span style={{ opacity: 0.5 }}>[{new Date(r.receivedAt||r.timestamp).toLocaleTimeString()}]</span> <span style={{ color: r.status==='complete'?'#00FF41':'#FF4444' }}>{r.status?.toUpperCase()}</span> {r.result?.slice(0,80)}
                    </div>
                  )) : <div style={{ color:'rgba(255,255,255,0.2)' }}>Standby...</div>}
                </div>
              )}
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Right Column: Telemetry */}
      <div style={{ gridRow: '2 / 3' }}>
        <GlassPanel title="TELEMETRY" style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatusLight label="Gateway" status={gatewayStatus.gateway} />
            <StatusLight label="Database" status={gatewayStatus.database} />
            <StatusLight label="Queue" status={gatewayStatus.queue} />
            <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            <StatusLight label="Homer" status={gatewayStatus.homer} />
            <StatusLight label="Bart" status={gatewayStatus.bart} />
            <StatusLight label="Lisa" status={gatewayStatus.lisa} />
            <StatusLight label="Maggie" status={gatewayStatus.maggie} />
          </div>
        </GlassPanel>
      </div>

      {/* Bottom: Event Stream */}
      <div style={{ gridColumn: '1 / -1', gridRow: '3 / 4' }}>
        <EventStream />
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
        body { margin: 0; padding: 0; background: #080810; overflow: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,217,15,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
