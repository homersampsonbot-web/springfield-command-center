'use client';
import Image from 'next/image';
import { useVoiceInput } from '@/lib/useVoiceInput';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import JarvisPanel from '@/components/jarvis/JarvisPanel';
import JarvisDivider from '@/components/jarvis/JarvisDivider';
import JarvisConsole from '@/components/jarvis/JarvisConsole';
import JarvisKPI from '@/components/jarvis/JarvisKPI';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || '';

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const { setAuthed } = useAuth();

  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('directives');
  const [bootDegraded, setBootDegraded] = useState(false);

  const [maggieStatus, setMaggieStatus] = useState<'Idle'|'Thinking'|'Planning'|'Planned'|'Failed'>('Idle');
  const [maggieEvents, setMaggieEvents] = useState<{ ts: string; level: string; message: string }[]>([]);
  const [directiveId, setDirectiveId] = useState<string | null>(null);
  const pollRef = useRef<any>(null);

  const [eventCollapsed, setEventCollapsed] = useState(true);
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);
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
    } catch {
      alert('Authentication error');
    }
  };

  const startPollingDirective = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/directives/${id}/status`);
        const data = await res.json();
        if (!res.ok) return;

        const statusMap: any = {
          QUEUED: 'Thinking',
          PROCESSING: 'Thinking',
          PLANNED: 'Planned',
          FAILED: 'Failed'
        };
        setMaggieStatus(statusMap[data.status] || 'Thinking');
        setMaggieEvents(data.events || []);

        if (data.status === 'PLANNED' || data.status === 'FAILED') {
          clearInterval(pollRef.current);
          pollRef.current = null;

          if (data.status === 'PLANNED') {
            if (navigator.vibrate) navigator.vibrate([10,30,10]);
          } else {
            if (navigator.vibrate) navigator.vibrate([30,30,30]);
          }
        }
      } catch {}
    }, 500);
  };

  const sendDirective = async () => {
    if (!directive.trim()) return;
    setStatus('Dispatching...');
    if (navigator.vibrate) navigator.vibrate(10);

    try {
      const r = await fetch(`/api/directives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: directive })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');

      const id = d.directiveId;
      setDirectiveId(id);
      if (typeof window !== 'undefined') window.localStorage.setItem('lastDirectiveId', id);
      setMaggieStatus('Thinking');
      setStatus(`✅ Dispatched — ${id?.slice(0,8)}`);
      setDirective('');
      startPollingDirective(id);
    } catch {
      setStatus('❌ Send failed');
      if (navigator.vibrate) navigator.vibrate([30,30,30]);
    }
  };

  const telemetryKPIs = [
    { label: 'Gateway', value: systemHealth?.gateway || 'offline', status: systemHealth?.gateway === 'online' ? 'ok' : 'bad' },
    { label: 'Database', value: systemHealth?.database || 'offline', status: systemHealth?.database === 'connected' ? 'ok' : 'bad' },
    { label: 'Queue', value: systemHealth?.queue || 'offline', status: systemHealth?.queue === 'connected' ? 'ok' : 'bad' }
  ] as { label: string; value: string; status: 'ok'|'bad'|'warn'|'idle' }[];

  if (!auth) return (
    <div style={{ position: 'relative', minHeight:'100vh', background:'#0D0D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24 }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Image 
          src="/login/springfield-map.png" 
          alt="Welcome" 
          fill 
          priority 
          style={{ objectFit: 'cover', opacity: 0.5 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      </div>
      <div style={{ fontFamily:'Permanent Marker', fontSize:48, color:'#FFD90F', textShadow:'0 0 30px #FFD90F88' }}>SPRINGFIELD</div>
      <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,217,15,0.3)', borderRadius:20, padding:24, backdropFilter:'blur(14px)', width:'min(420px, 90vw)' }}>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="ENTER COMMAND PIN"
          style={{ width:'100%', padding:'16px', borderRadius:12, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(0,0,0,0.4)', color:'#fff', textAlign:'center', outline:'none', fontSize: 18, letterSpacing: 4 }}
        />
        <button onClick={handleLogin} style={{ width:'100%', marginTop:16, padding:'14px', background:'#FFD90F', color:'#000', border:'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize: 18, cursor:'pointer' }}>AUTHORIZE</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'grid', gap:16, padding:16, maxWidth:1600, margin:'0 auto', gridTemplateColumns: '1fr', gridTemplateRows: 'auto' }}>
      {/* AUTO PLAN Modal */}
      {showAutoPlan && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#12121A', border:'1px solid rgba(255,217,15,0.3)', borderRadius:16, width:'min(640px, 100%)', maxHeight:'90vh', overflow:'hidden' }}>
            <div style={{ padding:16, borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Permanent Marker', color:'#FFD90F', margin:0 }}>AUTO PLANNING MODE</h2>
              <button onClick={() => setShowAutoPlan(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:16, color:'rgba(255,255,255,0.85)' }}>
              <p>Dump ideas, projects, bots, and research tasks. Maggie will organize them into projects, create jobs, assign owners, and populate Kanban.</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Phase 1: Idea → Jobs</p>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button disabled style={{ flex:1, padding:'12px 16px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, opacity:0.6, cursor:'not-allowed' }}>RUN AUTO PLAN</button>
                <button onClick={() => setShowAutoPlan(false)} style={{ flex:1, padding:'12px 16px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10 }}>CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE Modal */}
      {showSimulate && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#12121A', border:'1px solid rgba(255,217,15,0.3)', borderRadius:16, width:'min(640px, 100%)', maxHeight:'90vh', overflow:'hidden' }}>
            <div style={{ padding:16, borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Permanent Marker', color:'#FFD90F', margin:0 }}>PLAN SIMULATION</h2>
              <button onClick={() => setShowSimulate(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:16, color:'rgba(255,255,255,0.85)' }}>
              <p>Maggie will simulate the directive and estimate jobs, dependencies, and execution time without creating real jobs.</p>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button disabled style={{ flex:1, padding:'12px 16px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, opacity:0.6, cursor:'not-allowed' }}>RUN SIMULATION</button>
                <button onClick={() => setShowSimulate(false)} style={{ flex:1, padding:'12px 16px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10 }}>CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize: 28 }}>🍩</span>
          <h1 style={{ fontFamily:'Permanent Marker', fontSize: 24, color:'#FFD90F' }}>MISSION CONTROL</h1>
          {bootDegraded && <span style={{ fontSize: 10, color:'#FF4444', border:'1px solid #FF4444', padding:'2px 6px', borderRadius:6, fontFamily:'monospace' }}>LIMITED</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--jarvis-text-dim)', fontFamily:'monospace', textAlign:'right' }}>
          BUILD: {systemHealth?.build || 'v1.6.3-DRAWER-FINAL'}<br/>PROVIDER: {systemHealth?.maggieProvider?.toUpperCase() || 'GEMINI'}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gap:16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* LEFT: Active Jobs */}
        <JarvisPanel title="ACTIVE JOBS">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {activeJobs.map(job => (
              <div key={job.id} style={{ padding:10, borderRadius:10, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(255,217,15,0.15)' }}>
                <div style={{ fontWeight:700 }}>{job.title}</div>
                <div style={{ fontSize:11, color:'var(--jarvis-text-dim)', display:'flex', justifyContent:'space-between' }}>
                  <span>{job.owner}</span>
                  <span>{job.status}</span>
                </div>
              </div>
            ))}
            {!activeJobs.length && <div style={{ fontSize:12, color:'var(--jarvis-text-dim)' }}>No active tasks</div>}
          </div>
        </JarvisPanel>

        {/* CENTER: Command Podium */}
        <JarvisPanel title="COMMAND PODIUM" actions={<button onClick={() => setActiveTab('directives')} style={{ fontSize:10, padding:'6px 10px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:8, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>DIRECTIVES</button>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['directives','auto plan','debate','terminal'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'auto plan') setShowAutoPlan(true);
                    else if (tab === 'debate') setActiveTab('debate');
                    else setActiveTab(tab);
                  }}
                  style={{ flex:1, minHeight:48, padding:8, borderRadius:10, border:'1px solid rgba(255,217,15,0.2)', background: activeTab===tab ? '#FFD90F' : 'rgba(0,0,0,0.3)', color: activeTab===tab ? '#000' : '#fff', fontFamily:'Permanent Marker', position:'relative' }}
                >
                  {tab.toUpperCase()}
                  {tab === 'auto plan' && (
                    <span style={{ position:'absolute', top:6, right:8, fontSize:9, color:'#FFD90F', opacity:0.8 }}>SOON</span>
                  )}
                </button>
              ))}
            </div>
            {activeTab === 'directives' && (
              <>
                <div style={{ position:'relative' }}>
                  <textarea value={directive} onChange={e => { setDirective(e.target.value); voiceCtl.setTranscript(e.target.value); }} placeholder="Enter strategic directive..." style={{ width:'100%', minHeight:160, borderRadius:12, border:'1px solid rgba(255,217,15,0.2)', background:'rgba(0,0,0,0.35)', padding:14, paddingRight:48, color:'#FFD90F', resize:'none' }} />
                  <button onClick={voiceCtl.toggle} style={{ position:'absolute', right:10, top:10, width:36, height:36, borderRadius:10, border:'1px solid rgba(255,217,15,0.3)', background: voiceCtl.voice.status==='listening' ? '#FF4444' : 'rgba(0,0,0,0.4)', color:'#FFD90F' }}>{voiceCtl.voice.status==='listening' ? '⏺' : '🎙️'}</button>
                </div>
                {voiceCtl.voice.status === 'listening' && <div style={{ fontSize:11, color:'#FFD90F' }}>Listening…</div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, color:'var(--jarvis-text-dim)' }}>{status}</span>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => setShowSimulate(true)} style={{ minHeight:48, padding:'10px 18px', borderRadius:12, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(0,0,0,0.35)', color:'#FFD90F', fontFamily:'Permanent Marker' }}>SIMULATE</button>
                    <button onClick={sendDirective} style={{ minHeight:48, padding:'10px 18px', borderRadius:12, border:'none', background:'#FFD90F', color:'#000', fontFamily:'Permanent Marker' }}>DISPATCH ➤</button>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'terminal' && (
              <div style={{ height:180, background:'#000', borderRadius:10, padding:10, color:'#00FF41', fontFamily:'monospace', fontSize:11, overflow:'auto' }}>Standby…</div>
            )}
          </div>
        </JarvisPanel>

        {/* RIGHT: Telemetry */}
        <JarvisPanel title="TELEMETRY">
          <div style={{ display:'grid', gap:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {telemetryKPIs.map(k => (
                <JarvisKPI key={k.label} label={k.label} value={String(k.value)} status={k.status} />
              ))}
            </div>
            <JarvisDivider />
            <div style={{ fontSize:12, color:'var(--jarvis-text-dim)' }}>Maggie Brain</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, padding:'4px 8px', borderRadius:8, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>{maggieStatus}</span>
              <span style={{ fontSize:10, color:'var(--jarvis-text-dim)' }}>Provider: {systemHealth?.maggieProvider || 'gemini'}</span>
            </div>
            <div style={{ maxHeight:120, overflow:'auto', fontSize:11 }}>
              {maggieEvents.slice(0,6).map((e, i) => (
                <div key={i} style={{ color:'var(--jarvis-text-dim)' }}>• {e.message}</div>
              ))}
              {!maggieEvents.length && <div style={{ color:'var(--jarvis-text-dim)' }}>No recent Maggie events</div>}
            </div>
          </div>
        </JarvisPanel>
      </div>

      {/* Event Stream */}
      <JarvisPanel title="EVENT STREAM" actions={isMobile ? (
        <button onClick={() => setEventCollapsed(!eventCollapsed)} style={{ fontSize:10, padding:'6px 10px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:8, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>{eventCollapsed ? 'EXPAND' : 'COLLAPSE'}</button>
      ) : null}>
        {!isMobile || !eventCollapsed ? (
          <JarvisConsole lines={(maggieEvents.length ? maggieEvents : [{ ts:'--:--', level:'INFO', message:'Awaiting events...' }]).map(e => ({
            ts: e.ts ? new Date(e.ts).toLocaleTimeString() : '--:--',
            level: e.level || 'INFO',
            message: e.message
          }))} />
        ) : (
          <div style={{ fontSize:12, color:'var(--jarvis-text-dim)' }}>Tap to expand event stream</div>
        )}
      </JarvisPanel>
    </div>
  );
}
