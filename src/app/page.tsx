'use client';
import Image from 'next/image';
import { useVoiceInput } from "@/lib/useVoiceInput";
import { useState, useEffect, useRef } from 'react';
import EventStream from '@/components/EventStream';
import { useAuth } from '@/components/AuthProvider';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const { setAuthed } = useAuth();
  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [results, setResults] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, {role:string,text:string}[]>>({});
  const [chatInput, setChatInput] = useState<Record<string,string>>({});
  const [gatewayStatus, setGatewayStatus] = useState<Record<string,string>>({ homer: 'checking', marge: 'checking', lisa: 'checking', bart: 'checking', zilliz: 'checking', gateway: 'checking' });
  const [activeTab, setActiveTab] = useState('directives');
  const [toast, setToast] = useState<{message:string, type:string} | null>(null);
  const lastResultId = useRef<string | null>(null);

  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [bootDegraded, setBootDegraded] = useState(false);

  // Contract Test State
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const voiceCtl = useVoiceInput({ lang: "en-US", maxMs: 30000 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDegraded = () => {
        const isDegraded = window.localStorage.getItem('boot_degraded') === 'true';
        if (isDegraded !== bootDegraded) setBootDegraded(isDegraded);
      };
      checkDegraded();
      const interval = setInterval(checkDegraded, 2000);
      return () => clearInterval(interval);
    }
  }, [bootDegraded]);

  // Keep directive box synced with voice transcript (only while listening)
  useEffect(() => {
    if (voiceCtl.voice.status === "listening" && voiceCtl.transcript) {
      setDirective(voiceCtl.transcript);
    }
  }, [voiceCtl.voice.status, voiceCtl.transcript]);

  useEffect(() => {
    if (!auth) return;
    
    const fetchHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const s = await fetch(`/api/system-health`, { signal: controller.signal });
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
          maggie: hData.agents?.maggie === 'alive' ? 'online' : hData.agents?.maggie === 'initializing' ? 'pending' : 'offline',
          maggieLocal: hData.maggieLocalStatus || 'offline'
        });
      } catch {
        setGatewayStatus({ homer: 'offline', marge: 'offline', lisa: 'offline', bart: 'offline', zilliz: 'offline', gateway: 'offline', database: 'offline', queue: 'offline', maggieLocal: 'offline' });
      }
    };

    const fetchJobs = async () => {
      try {
        const r = await fetch(`/api/jobs`);
        const d = await r.json();
        const pending = d.filter((j: any) => j.status !== 'DONE').slice(0, 5);
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
      const res = await fetch(`/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        setAuth(true);
        setAuthed(true);
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
      const r = await fetch(`/api/directives`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ text: directive }) 
      });
      const d = await r.json();
      setStatus(`✅ Dispatched — ID: ${d.id?.slice(0,8)}`);
      setDirective('');
    } catch {
      setStatus('❌ Send failed');
    }
  };

  const runContractTest = async () => {
    setIsTesting(true);
    try {
      const r = await fetch(`/api/maggie/contract-test`, { method: 'POST' });
      const d = await r.json();
      setTestResults(d.providers);
    } catch (e) {
      alert("Contract test failed to run");
    } finally {
      setIsTesting(false);
    }
  };

  const sendChat = async (agentId: string) => {
    const msg = chatInput[agentId];
    if (!msg?.trim()) return;
    setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'user', text:msg }] }));
    setChatInput(c => ({ ...c, [agentId]: '' }));
    try {
      const r = await fetch(`/api/chat`, { 
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

  const GlassPanel = ({ children, title, style, actions }: any) => (
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontFamily: 'Permanent Marker',
            color: '#FFD90F',
            fontSize: 14,
            letterSpacing: '0.05em'
          }}>{title}</span>
          {actions}
        </div>
      )}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>{children}</div>
    </div>
  );

  const StatusLight = ({ label, status, subLabel }: any) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '6px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        {subLabel && <span style={{ fontSize: 9, color: 'rgba(255,217,15,0.4)', fontFamily: 'monospace' }}>{subLabel}</span>}
      </div>
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
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Image 
          src="/login-hero.png" 
          alt="Welcome" 
          fill 
          priority 
          style={{ objectFit: 'cover', opacity: 0.4 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 0%, #0D0D1A 100%)' }} />
      </div>
      <div style={{ fontFamily:'Permanent Marker', fontSize:48, color:'#FFD90F', textShadow:'0 0 30px #FFD90F88' }}>SPRINGFIELD</div>
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(20px)',
        padding: 32,
        borderRadius: 24,
        border: '1px solid rgba(255,217,15,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: 'min(400px, 90vw)'
      }}>
        <input 
          type="password" 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()} 
          placeholder="ENTER COMMAND PIN"
          style={{ padding:'16px', borderRadius:12, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(0,0,0,0.4)', color:'#fff', textAlign:'center', outline:'none', fontSize: 18, letterSpacing: 4 }} 
        />
        <button onClick={handleLogin} style={{ padding:'16px', background:'#FFD90F', color: '#000', border: 'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize: 18, cursor:'pointer' }}>AUTHORIZE</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Contract Test Modal */}
      {testResults && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#12121A', border:'1px solid #FFD90F', borderRadius:16, width:'min(800px, 100%)', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
             <div style={{ padding:16, borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ fontFamily:'Permanent Marker', color:'#FFD90F', margin:0 }}>PROVIDER CONTRACT TEST</h2>
                <button onClick={() => setTestResults(null)} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>×</button>
             </div>
             <div style={{ padding:16, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', color:'#fff', fontSize:13 }}>
                   <thead>
                      <tr style={{ textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                         <th style={{ padding:8 }}>PROVIDER</th>
                         <th style={{ padding:8 }}>STATUS</th>
                         <th style={{ padding:8 }}>LATENCY</th>
                         <th style={{ padding:8 }}>CONTRACT</th>
                      </tr>
                   </thead>
                   <tbody>
                      {testResults.map((r: any) => (
                         <tr key={r.provider} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding:8, fontWeight:'bold' }}>{r.provider.toUpperCase()}</td>
                            <td style={{ padding:8, color: r.ok ? '#7ED321' : '#FF4444' }}>{r.ok ? 'ONLINE' : 'ERROR'}</td>
                            <td style={{ padding:8 }}>{r.ms}ms</td>
                            <td style={{ padding:8, color: r.contractOk ? '#7ED321' : '#FF4444' }}>{r.contractOk ? 'PASSED' : 'FAILED'}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {testResults.map((r: any) => r.ok && (
                   <div key={r.provider + '_json'} style={{ marginTop:20 }}>
                      <div style={{ fontSize:10, color:'#FFD90F', marginBottom:4 }}>{r.provider.toUpperCase()} OUTPUT:</div>
                      <pre style={{ background:'rgba(0,0,0,0.3)', padding:12, borderRadius:8, fontSize:11, overflow:'auto', maxHeight:200 }}>
                         {JSON.stringify(r.sampleJobs, null, 2)}
                      </pre>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      <div style={{ 
        minHeight:'100vh', 
        background:'#080810', 
        color: '#fff',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gridAutoRows: 'minmax(200px, auto)',
        gap: '20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Top Header */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>🍩</span>
            <h1 style={{ fontFamily: 'Permanent Marker', fontSize: 28, color: '#FFD90F', margin: 0, letterSpacing: 2 }}>MISSION CONTROL</h1>
            {bootDegraded && (
              <div style={{ background: 'rgba(255,68,68,0.2)', color: '#FF4444', fontSize: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid #FF4444', fontFamily: 'monospace', fontWeight: 'bold' }}>
                LIMITED MODE
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,217,15,0.4)', fontFamily: 'monospace', textAlign: 'right' }}>
            BUILD: {systemHealth?.build || 'v1.6-MAGGIE-BRAIN'}<br/>
            PROVIDER: {systemHealth?.maggieProvider?.toUpperCase() || 'GEMINI'}
          </div>
        </div>

        {/* Column: Active Jobs */}
        <GlassPanel title="ACTIVE JOBS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeJobs.map(job => (
              <div key={job.id} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, borderLeft: `4px solid ${job.risk === 'HIGH' ? '#FF4444' : '#FFD90F'}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{job.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ fontWeight: 'bold' }}>{job.owner}</span>
                  <span style={{ color: '#FFD90F', fontSize: 10 }}>{job.status}</span>
                </div>
              </div>
            ))}
            {!activeJobs.length && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 20 }}>All tasks completed</div>}
          </div>
        </GlassPanel>

        {/* Column: Command Podium */}
        <GlassPanel 
          title="COMMAND PODIUM" 
          actions={
            <button 
              onClick={runContractTest} 
              disabled={isTesting}
              style={{ fontSize: 9, padding: '4px 8px', background: 'rgba(255,217,15,0.1)', border: '1px solid rgba(255,217,15,0.3)', color: '#FFD90F', borderRadius: 4, cursor: 'pointer' }}
            >
              {isTesting ? 'TESTING...' : 'CONTRACT TEST'}
            </button>
          }
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['directives','marge','lisa','terminal'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    flex:1, padding:'10px', 
                    background: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.05)', 
                    color: activeTab===tab ? '#000' : '#fff', 
                    border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:11, cursor:'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
              <button 
                onClick={() => window.open('/kanban', '_blank')}
                style={{ flex:1, padding:'10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:11, cursor:'pointer' }}
              >
                KANBAN
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 200 }}>
              {activeTab === 'directives' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <textarea 
                      value={directive} 
                      onChange={e => {
                        setDirective(e.target.value);
                        voiceCtl.setTranscript(e.target.value);
                      }} 
                      placeholder="Enter strategic directive..." 
                      style={{ flex: 1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,217,15,0.2)', borderRadius:12, padding:16, paddingRight: 52, color:'#FFD90F', fontSize:15, resize:'none', outline:'none', fontFamily: 'monospace' }} 
                    />
                    <button 
                      onClick={voiceCtl.toggle}
                      style={{ 
                        position: 'absolute', 
                        right: 12, 
                        top: 12, 
                        width: 36, 
                        height: 36, 
                        borderRadius: 10, 
                        background: voiceCtl.voice.status === 'listening' ? '#FF4444' : 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,217,15,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        boxShadow: voiceCtl.voice.status === 'listening' ? '0 0 15px #FF4444' : 'none'
                      }}
                    >
                      {voiceCtl.voice.status === 'listening' ? '⏺' : '🎙️'}
                    </button>
                  </div>
                  {voiceCtl.voice.status === 'listening' && <div style={{ fontSize: 11, color: '#FFD90F', textAlign: 'center' }}>LISTENING... TAP ⏺ TO STOP</div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12, fontFamily: 'monospace' }}>{status}</span>
                    <button onClick={sendDirective} style={{ padding:'12px 24px', background:'#FFD90F', color:'#000', border:'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize:16, cursor:'pointer', boxShadow: '0 4px 15px rgba(255,217,15,0.2)' }}>DISPATCH ➤</button>
                  </div>
                </div>
              )}

              {activeTab === 'marge' && (
                 <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16, overflowY: 'auto', fontSize: 13, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {(chatMessages.marge||[]).map((m,i) => (
                        <div key={i} style={{ marginBottom: 10, lineHeight: 1.4 }}>
                          <span style={{ color: m.role === 'user' ? '#FFD90F' : '#4A90D9', fontWeight: 'bold' }}>{m.role === 'user' ? 'SMS: ' : 'MARGE: '}</span>
                          <span style={{ color: '#fff' }}>{m.text}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input 
                        value={chatInput.marge||''} 
                        onChange={e => setChatInput(c=>({...c, marge:e.target.value}))} 
                        onKeyDown={e => e.key==='Enter' && sendChat('marge')}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,217,15,0.2)', borderRadius: 10, padding: '12px 16px', color: '#fff', outline: 'none' }}
                        placeholder="Direct message to Marge..."
                      />
                      <button onClick={() => sendChat('marge')} style={{ padding: '0 20px', background: '#4A90D9', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#fff' }}>SEND</button>
                    </div>
                 </div>
              )}
              
              {activeTab === 'terminal' && (
                <div style={{ background:'#000', borderRadius:12, padding:16, height: '100%', fontFamily:'monospace', fontSize:12, color:'#00FF41', overflowY:'auto', border: '1px solid rgba(0,255,65,0.1)' }}>
                  {results.length ? results.map((r,i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <span style={{ opacity: 0.4 }}>[{new Date(r.receivedAt||r.timestamp).toLocaleTimeString()}]</span> <span style={{ color: r.status==='complete'?'#00FF41':'#FF4444', fontWeight: 'bold' }}>{r.status?.toUpperCase()}</span> {r.result?.slice(0,100)}
                    </div>
                  )) : <div style={{ color:'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '20%' }}>SYSTEM STANDBY</div>}
                </div>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* Column: Telemetry */}
        <GlassPanel title="TELEMETRY">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <StatusLight label="Gateway" status={gatewayStatus.gateway} />
            <StatusLight label="Database" status={gatewayStatus.database} />
            <StatusLight label="Queue" status={gatewayStatus.queue} />
            
            <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
               <div style={{ fontSize: 10, color: '#FFD90F', fontWeight: 'bold', marginBottom: 8 }}>AGENT STATUS</div>
               <StatusLight label="Homer" status={gatewayStatus.homer} />
               <StatusLight label="Bart" status={gatewayStatus.bart} />
               <StatusLight label="Lisa" status={gatewayStatus.lisa} />
               <StatusLight label="Maggie" status={gatewayStatus.maggie} subLabel={`BRAIN: ${systemHealth?.maggieProvider?.toUpperCase() || 'GEMINI'}`} />
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
               <div style={{ fontSize: 10, color: '#FFD90F', fontWeight: 'bold', marginBottom: 8 }}>LOCAL NODES</div>
               <StatusLight label="Mac Mini" status={gatewayStatus.maggieLocal} subLabel="maggie.local:8080" />
            </div>
          </div>
        </GlassPanel>

        {/* Event Stream (Full Width) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <EventStream />
        </div>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');
          body { margin: 0; padding: 0; background: #080810; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: rgba(255,217,15,0.15); border-radius: 10px; }
          ::-webkit-scrollbar-track { background: transparent; }
        `}</style>
      </div>
    </>
  );
}
