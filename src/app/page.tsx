'use client';
import Image from 'next/image';
import { useVoiceInput } from '@/lib/useVoiceInput';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useMemo, useRef, useState } from 'react';

// Relay Workspace
function RelayWorkspace() {
  const [active, setActive] = useState<'homer'|'marge'|'lisa'>('homer');
  const [messages, setMessages] = useState<{ sender: 'user'|'agent', text: string, agent: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const currentAgent = active;
    setMessages(prev => [...prev, { sender: 'user', text, agent: currentAgent }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/relay/${currentAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const reply = data.response || data.reply || data.message || JSON.stringify(data);
      setMessages(prev => [...prev, { sender: 'agent', text: reply, agent: currentAgent }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { sender: 'agent', text: `Error: ${e.message}`, agent: currentAgent }]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(m => m.agent === active);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', gap:6 }}>
        {['homer','marge','lisa'].map(tab => (
          <button key={tab} onClick={() => setActive(tab as any)}
            style={{ flex:1, padding:'8px', borderRadius:8, border: active===tab ? '1px solid #FFD90F' : '1px solid rgba(255,255,255,0.1)', background: active===tab ? '#FFD90F' : 'rgba(0,0,0,0.2)', color: active===tab ? '#000' : '#fff', fontSize:12 }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ flex:1, minHeight:0, overflowY:'auto', background:'rgba(0,0,0,0.35)', borderRadius:10, padding:10, fontSize:12 }}>
        {filteredMessages.map((m, i) => (
          <div key={i} style={{ marginBottom:6, textAlign: m.sender === 'user' ? 'right' : 'left' }}>
            <span style={{ 
              display:'inline-block', 
              padding:'6px 8px', 
              borderRadius:8, 
              background: m.sender === 'user' ? '#FFD90F' : 'rgba(255,255,255,0.08)', 
              color: m.sender === 'user' ? '#000' : '#fff',
              maxWidth: '90%',
              height: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'visible'
            }}>
              {m.text}
            </span>
          </div>
        ))}
        {loading && <div style={{ color:'#FFD90F' }}>Thinking…</div>}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Message ${active}...`} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(0,0,0,0.25)', color:'#fff' }} />
        <button onClick={sendMessage} style={{ padding:'10px 14px', borderRadius:8, border:'none', background:'#FFD90F', color:'#000' }}>Send</button>
      </div>
    </div>
  );
}

// Team Workspace
function TeamWorkspace({ systemHealth, maggieStatus, isMobile }: { systemHealth: any, maggieStatus: string, isMobile: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/thread/messages?thread=team');
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setLoading(true);
    try {
      await fetch('/api/thread/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread: 'team', message: msg, sender: 'SMS' })
      });
      await fetchMessages();
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const getAgentStatus = (agent: string) => {
    if (agent === 'maggie') return maggieStatus === 'Idle' ? 'available' : 'online';
    const status = systemHealth?.agents?.[agent] || 'offline';
    return status === 'available' ? 'online' : status;
  };

  const statusColor = (status: string) => {
    if (status === 'online' || status === 'available') return '#00FF41';
    if (status === 'degraded' || status === 'warn') return '#FFD90F';
    return '#FF4444';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, gap: isMobile ? 4 : 8 }}>
      {/* Agent Badges */}
      <div style={{ display:'flex', gap:6, padding: isMobile ? '2px 0 4px' : '4px 0 10px', flexWrap:'wrap' }}>
        {['homer', 'marge', 'lisa', 'maggie'].map(agent => (
          <div key={agent} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: statusColor(getAgentStatus(agent)) }} />
            <span style={{ fontSize:isMobile ? 9 : 10, color:'#fff', textTransform:'capitalize' }}>{agent}</span>
          </div>
        ))}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} style={{ flex:1, minHeight:0, overflowY:'auto', background:'rgba(0,0,0,0.3)', borderRadius:12, padding:12, paddingBottom:120, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((m) => {
          const p = m.payload?.participant || 'SYSTEM';
          const isUser = m.payload?.source === 'user';
          const isCheckpoint = m.type === 'THREAD_CHECKPOINT';

          if (isCheckpoint) {
            return (
              <div key={m.id} style={{ alignSelf:'center', padding:'4px 12px', borderRadius:8, background:'rgba(255,217,15,0.05)', border:'1px solid rgba(255,217,15,0.2)', color:'#FFD90F', fontSize:10, margin:'10px 0' }}>
                📍 {m.message}
              </div>
            );
          }

          return (
            <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', marginBottom:2, display:'flex', gap:4 }}>
                <span style={{ color: p==='HOMER'?'#FFD90F':p==='MARGE'?'#4cc9f0':p==='LISA'?'#f72585':p==='MAGGIE'?'#7209b7':'#fff', fontWeight:600 }}>{p}</span>
                <span>{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div style={{ 
                maxWidth:'90%', 
                height: 'auto',
                padding:'8px 12px', 
                borderRadius:12, 
                background: isUser ? '#FFD90F' : 'rgba(255,255,255,0.05)', 
                color: isUser ? '#000' : '#fff',
                fontSize:13,
                border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'visible',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                {m.message}
              </div>
            </div>
          );
        })}
        {loading && <div style={{ color:'#FFD90F', fontSize:12 }}>Routing...</div>}
      </div>

      {/* Sticky Composer */}
      <div style={{ 
        position:'sticky', bottom:-1, background:'#12121A', borderTop:'1px solid rgba(255,255,255,0.1)', padding: '6px 0',
        paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 6px)' : 'env(safe-area-inset-bottom)',
        display:'flex', flexDirection:'column', gap:4, zIndex: 10
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 4px' }}>
          <button 
            onClick={() => setShowHint(!showHint)} 
            style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', padding:0 }}
          >
            <span style={{ width:14, height:14, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>ⓘ</span>
            <span style={{ fontSize:10 }}>Routing</span>
          </button>
          {showHint && (
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', background:'rgba(0,0,0,0.2)', padding:'2px 8px', borderRadius:6 }}>
              no tag = Homer | @marge | @lisa | @maggie | @team
            </div>
          )}
        </div>
        
        <div style={{ display:'flex', gap:8 }}>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder="Message team..." 
            style={{ flex:1, height:44, padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', color:'#fff', fontSize:14, resize:'none' }}
          />
          <button onClick={send} disabled={loading} style={{ width:60, borderRadius:10, border:'none', background:'#FFD90F', color:'#000', fontWeight:'bold' }}>SEND</button>
        </div>
      </div>
    </div>
  );
}

import JarvisPanel from '@/components/jarvis/JarvisPanel';
import JarvisDivider from '@/components/jarvis/JarvisDivider';
import JarvisConsole from '@/components/jarvis/JarvisConsole';
import JarvisKPI from '@/components/jarvis/JarvisKPI';

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const { setAuthed } = useAuth();

  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [activeDebateCount, setActiveDebateCount] = useState(0);

  const [activeTab, setActiveTab] = useState('directives');
  const [mode, setMode] = useState<'DIRECTIVE'|'AUTO_PLAN'>('DIRECTIVE');
  const [bootDegraded, setBootDegraded] = useState(false);

  const [maggieStatus, setMaggieStatus] = useState<'Idle'|'Thinking'|'Planning'|'Planned'|'Failed'>('Idle');
  const [maggieEvents, setMaggieEvents] = useState<{ ts: string; level: string; message: string }[]>([]);
  const [maggieActivity, setMaggieActivity] = useState<any[]>([]);
  const [maggieLiveStatus, setMaggieLiveStatus] = useState<'Idle' | 'Planning' | 'Dispatching' | 'Waiting' | 'Degraded'>('Idle');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [directiveId, setDirectiveId] = useState<string | null>(null);
  const pollRef = useRef<any>(null);

  const [eventCollapsed, setEventCollapsed] = useState(true);
  const [activityCollapsed, setActivityCollapsed] = useState(true);
  const [jobsCollapsed, setJobsCollapsed] = useState(true);

  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  const voiceCtl = useVoiceInput({ lang: 'en-US', maxMs: 30000 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('lastDirectiveId');
      if (saved) setDirectiveId(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDegraded = window.localStorage.getItem('boot_degraded') === 'true';
      setBootDegraded(isDegraded);
    }
  }, [auth]);

  // Keep directive box synced with voice transcript (only while listening)
  useEffect(() => {
    if (voiceCtl.voice.status === 'listening' && voiceCtl.transcript) {
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
      } catch {}
    };

    const fetchJobs = async () => {
      try {
        const r = await fetch(`/api/jobs`);
        const d = await r.json();
        const pending = d.filter((j: any) => j.status !== 'DONE').slice(0, 5);
        setActiveJobs(pending);
      } catch {}
    };

    const fetchDebates = async () => {
      try {
        const r = await fetch(`/api/debates`);
        if (r.status === 503) return;
        const d = await r.json();
        const active = d.filter((deb: any) => deb.state !== 'DONE');
        setActiveDebateCount(active.length);
      } catch {}
    };

    const fetchMaggieActivity = async () => {
      try {
        const res = await fetch(`/api/maggie/events?limit=20`);
        const events = await res.json();
        setMaggieActivity(events);
        
        // Status Logic (Priority order)
        const now = Date.now();
        const latestEvent = events[0];
        if (systemHealth?.maggieState !== 'online' || (latestEvent?.level?.toUpperCase() === 'ERROR' && (now - new Date(latestEvent.createdAt).getTime()) < 300000)) {
          setMaggieLiveStatus('Degraded');
        } else {
          const last60s = events.filter((e: any) => (now - new Date(e.createdAt).getTime()) < 60000);
          const last2m = events.filter((e: any) => (now - new Date(e.createdAt).getTime()) < 120000);
          if (last60s.some((e: any) => ['JOB_CREATED', 'JOB_LEASED', 'JOB_COMPLETED'].includes(e.type))) {
            setMaggieLiveStatus('Dispatching');
          } else if (last2m.some((e: any) => ['DIRECTIVE_RECEIVED', 'PLANNING_STARTED', 'DECOMPOSING_TASKS', 'PLAN_COMPLETE', 'SIMULATION_STARTED', 'DEBATE_TRIGGERED'].includes(e.type))) {
            setMaggieLiveStatus('Planning');
          } else if (activeDebateCount > 0 || activeJobs.some(j => j.requiresApproval)) {
            setMaggieLiveStatus('Waiting');
          } else {
            setMaggieLiveStatus('Idle');
          }
        }
      } catch {}
    };

    fetchHealth();
    fetchJobs();
    fetchDebates();
    fetchMaggieActivity();

    const interval = setInterval(() => {
      fetchHealth();
      fetchJobs();
      fetchDebates();
      fetchMaggieActivity();
    }, isMobile ? 5000 : 10000);

    return () => clearInterval(interval);
  }, [auth, activeDebateCount, activeJobs.length, systemHealth?.maggieState, isMobile]);

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
    } catch {
      alert('Authentication error');
    }
  };

  const sendDirective = async () => {
    if (!directive.trim()) return;
    setStatus('Dispatching...');
    if (navigator.vibrate) navigator.vibrate(10);
    try {
      const r = await fetch(`/api/directives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: directive, mode })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setMaggieStatus('Thinking');
      setStatus(`✅ Dispatched — ${d.directiveId?.slice(0,8)}`);
      setDirective('');
    } catch {
      setStatus('❌ Send failed');
      if (navigator.vibrate) navigator.vibrate([30,30,30]);
    }
  };

  const telemetryKPIs = [
    { label: 'Gateway', value: systemHealth?.gateway || 'offline', status: systemHealth?.gateway === 'online' ? 'ok' : 'bad' },
    { label: 'Database', value: systemHealth?.database || 'offline', status: systemHealth?.database === 'connected' ? 'ok' : 'bad' },
    { label: 'Queue', value: systemHealth?.queue || 'offline', status: systemHealth?.queue === 'connected' ? 'ok' : 'bad' },
    { label: 'Marge', value: systemHealth?.agents?.marge || 'offline', status: systemHealth?.agents?.marge === 'available' ? 'ok' : (systemHealth?.agents?.marge === 'degraded' ? 'warn' : 'bad') },
    { label: 'Lisa', value: systemHealth?.agents?.lisa || 'offline', status: systemHealth?.agents?.lisa === 'available' ? 'ok' : (systemHealth?.agents?.lisa === 'degraded' ? 'warn' : 'bad') },
  ] as { label: string; value: string; status: 'ok'|'bad'|'warn'|'idle' }[];

  if (!auth) return (
    <div style={{ position: 'relative', minHeight:'100vh', background:'#0D0D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24 }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Image src="/login/springfield-map.png" alt="Welcome" fill priority style={{ objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      </div>
      <div style={{ fontFamily:'Permanent Marker', fontSize:48, color:'#FFD90F', textShadow:'0 0 30px #FFD90F88' }}>SPRINGFIELD</div>
      <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,217,15,0.3)', borderRadius:20, padding:24, backdropFilter:'blur(14px)', width:'min(420px, 90vw)' }}>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="ENTER COMMAND PIN" style={{ width:'100%', padding:'16px', borderRadius:12, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(0,0,0,0.4)', color:'#fff', textAlign:'center', outline:'none', fontSize: 18, letterSpacing: 4 }} />
        <button onClick={handleLogin} style={{ width:'100%', marginTop:16, padding:'14px', background:'#FFD90F', color:'#000', border:'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize: 18, cursor:'pointer' }}>AUTHORIZE</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', gap:16, padding:16, maxWidth:1600, margin:'0 auto', boxSizing:'border-box', '--panel-padding': isMobile ? '10px' : '16px' } as any}>
      {/* Event Details Modal */}
      {selectedEvent && (
        <div style={{ position:'fixed', inset:0, zIndex:10001, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#12121A', border:'1px solid rgba(255,217,15,0.3)', borderRadius:16, width:'min(600px, 100%)', maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:16, borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Permanent Marker', color:'#FFD90F', margin:0 }}>EVENT DETAILS</h2>
              <button onClick={() => setSelectedEvent(null)} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:16, overflowY:'auto', flex:1, color:'rgba(255,255,255,0.85)', fontSize:14 }}>
               <p><strong style={{ color:'#FFD90F' }}>Type:</strong> {selectedEvent.type}</p>
               <p><strong style={{ color:'#FFD90F' }}>Time:</strong> {new Date(selectedEvent.createdAt).toLocaleString()}</p>
               <p><strong style={{ color:'#FFD90F' }}>Message:</strong> {selectedEvent.message}</p>
               <JarvisDivider />
               <p><strong style={{ color:'#FFD90F' }}>Payload:</strong></p>
               <pre style={{ background:'rgba(0,0,0,0.3)', padding:10, borderRadius:8, fontSize:12, overflowX:'auto' }}>{JSON.stringify(selectedEvent.payload || selectedEvent.meta || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize: 24 }}>🍩</span>
          <h1 style={{ fontFamily:'Permanent Marker', fontSize: 20, color:'#FFD90F', margin:0 }}>MISSION CONTROL</h1>
          {activeDebateCount > 0 && <span style={{ fontSize: 9, color:'#FFD90F', border:'1px solid rgba(255,217,15,0.6)', padding:'2px 5px', borderRadius:6, fontFamily:'monospace' }}>DEBATE ×{activeDebateCount}</span>}
        </div>
        <div style={{ fontSize: 9, color: 'var(--jarvis-text-dim)', fontFamily:'monospace', textAlign:'right' }}>
          BUILD: {process.env.NEXT_PUBLIC_BUILD_STAMP}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display:'flex', flex:1, gap:16, minHeight:0, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* LEFT: Activity & Jobs */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, width: isMobile ? '100%' : '320px', minHeight:0, flexShrink:0 }}>
          <JarvisPanel 
            title={isMobile && activityCollapsed ? `ACTIVITY (${maggieActivity.length})` : "ACTIVITY"}
            actions={
              <button onClick={() => setActivityCollapsed(!activityCollapsed)} style={{ fontSize:10, padding:'4px 8px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:6, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>
                {activityCollapsed ? 'EXPAND' : 'COLLAPSE'}
              </button>
            }
          >
            {!activityCollapsed && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight: isMobile ? 100 : 300, overflowY:'auto' }}>
                {maggieActivity.map(event => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} style={{ padding:8, borderRadius:8, background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:10, color: event.level === 'ERROR' ? '#FF4444' : '#FFD90F', fontWeight:700 }}>✦ {event.type}</span>
                      <span style={{ fontSize:9, color:'var(--jarvis-text-dim)' }}>{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.85)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{event.message}</div>
                  </div>
                ))}
              </div>
            )}
          </JarvisPanel>

          <JarvisPanel 
            title={isMobile && jobsCollapsed ? `JOBS (${activeJobs.length})` : "JOBS"}
            actions={
              <button onClick={() => setJobsCollapsed(!jobsCollapsed)} style={{ fontSize:10, padding:'4px 8px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:6, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>
                {jobsCollapsed ? 'EXPAND' : 'COLLAPSE'}
              </button>
            }
          >
            {!jobsCollapsed && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight: isMobile ? 100 : 300, overflowY:'auto' }}>
                {activeJobs.map(job => (
                  <div key={job.id} style={{ padding:10, borderRadius:10, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,217,15,0.15)' }}>
                    <div style={{ fontWeight:700, fontSize:12 }}>{job.title}</div>
                    <div style={{ fontSize:11, color:'var(--jarvis-text-dim)', display:'flex', justifyContent:'space-between' }}><span>{job.owner}</span><span>{job.status}</span></div>
                  </div>
                ))}
              </div>
            )}
          </JarvisPanel>
        </div>

        {/* CENTER: Command Podium */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight: 0 }}>
          <JarvisPanel 
            title="COMMAND PODIUM" 
            actions={<button onClick={() => setMode('DIRECTIVE')} style={{ fontSize:10, padding:'6px 10px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:8, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>RESET</button>}
          >
            <div style={{ display:'flex', flexDirection:'column', gap:8, height:'100%', minHeight:0 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
                {['debate','relay','team','terminal','kanban'].map(tab => (
                  <button key={tab} onClick={() => { if (tab === 'debate') window.location.href = '/debate'; else if (tab === 'kanban') window.location.href = '/kanban'; else setActiveTab(tab); }}
                    style={{ flex:1, minHeight:32, padding:6, borderRadius:8, border:'1px solid rgba(255,217,15,0.1)', background: activeTab===tab ? 'rgba(255,217,15,0.1)' : 'rgba(0,0,0,0.2)', color: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.6)', fontFamily:'Permanent Marker', fontSize: 11 }}>
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', paddingBottom: (isMobile && activeTab === 'team') ? 120 : 0, overflow:'hidden' }}>
                {activeTab === 'directives' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%' }}>
                     <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {['DIRECTIVE', 'AUTO_PLAN'].map(m => (
                        <button key={m} onClick={() => setMode(m as any)} style={{ flex:1, padding:6, borderRadius:8, border: mode===m ? '2px solid #FFD90F' : '1px solid rgba(255,217,15,0.2)', background: mode===m ? '#FFD90F' : 'rgba(0,0,0,0.3)', color: mode===m ? '#000' : '#fff', fontFamily:'Permanent Marker', fontSize:12 }}>{m.replace('_', ' ')}</button>
                      ))}
                    </div>
                    <div style={{ position:'relative', flex:1 }}>
                      <textarea value={directive} onChange={e => { setDirective(e.target.value); voiceCtl.setTranscript(e.target.value); }} placeholder={mode === 'DIRECTIVE' ? "Enter strategic directive..." : "Dump ideas for Maggie..."} style={{ width:'100%', height:'100%', borderRadius:12, border: '1px solid rgba(255,217,15,0.2)', background:'rgba(0,0,0,0.35)', padding:12, color: '#fff', resize:'none', fontSize:14 }} />
                      <button onClick={voiceCtl.toggle} style={{ position:'absolute', right:8, top:8, width:32, height:32, borderRadius:8, background: voiceCtl.voice.status==='listening' ? '#FF4444' : 'rgba(0,0,0,0.4)', color:'#FFD90F' }}>{voiceCtl.voice.status==='listening' ? '⏺' : '🎙️'}</button>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:11, color:'var(--jarvis-text-dim)' }}>{status}</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={sendDirective} style={{ padding:'10px 16px', borderRadius:10, border:'none', background:'#FFD90F', color:'#000', fontFamily:'Permanent Marker', fontSize:13 }}>DISPATCH ➤</button>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'relay' && <RelayWorkspace />}
                {activeTab === 'team' && <TeamWorkspace systemHealth={systemHealth} maggieStatus={maggieStatus} isMobile={isMobile} />}
                {activeTab === 'terminal' && <div style={{ flex:1, background:'#000', borderRadius:10, padding:10, color:'#00FF41', fontFamily:'monospace', fontSize:11 }}>Standby…</div>}
              </div>
            </div>
          </JarvisPanel>
        </div>
      </div>

      {/* Footer Event Stream */}
      <div style={{ flexShrink:0, position:'relative', zIndex:1, display: isMobile ? 'none' : 'block', marginTop: isMobile ? 72 : 0 }}>
        <JarvisPanel title="EVENT STREAM" actions={<button onClick={() => setEventCollapsed(!eventCollapsed)} style={{ fontSize:10, padding:'6px 10px', borderRadius:8, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>{eventCollapsed ? 'EXPAND' : 'COLLAPSE'}</button>}>
          {!eventCollapsed && (
            <JarvisConsole lines={maggieEvents.map(e => ({ ts: new Date(e.ts).toLocaleTimeString(), level: e.level || 'INFO', message: e.message }))} />
          )}
        </JarvisPanel>
      </div>
    </div>
  );
}
