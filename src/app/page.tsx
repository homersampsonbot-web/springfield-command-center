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
  const [activeDebateCount, setActiveDebateCount] = useState(0);

  const [activeTab, setActiveTab] = useState('directives');
  const [mode, setMode] = useState<'DIRECTIVE'|'AUTO_PLAN'>('DIRECTIVE');
  const [bootDegraded, setBootDegraded] = useState(false);

  const [maggieStatus, setMaggieStatus] = useState<'Idle'|'Thinking'|'Planning'|'Planned'|'Failed'>('Idle');
  const [maggieEvents, setMaggieEvents] = useState<{ ts: string; level: string; message: string }[]>([]);
  const [directiveId, setDirectiveId] = useState<string | null>(null);
  const pollRef = useRef<any>(null);

  const [eventCollapsed, setEventCollapsed] = useState(true);
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

    fetchHealth();
    fetchJobs();
    fetchDebates();

    const interval = setInterval(() => {
      fetchHealth();
      fetchJobs();
      fetchDebates();
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
        body: JSON.stringify({ text: directive, mode })
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

  const runSimulation = async () => {
    if (!directive.trim()) return;
    setSimulating(true);
    setMaggieStatus('Planning');
    try {
      const r = await fetch(`/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: directive, title: directive.slice(0, 30) })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Simulation failed');
      setSimulationResult(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSimulating(false);
      setMaggieStatus('Idle');
    }
  };

  const createDebateFromSim = async () => {
    if (!simulationResult) return;
    try {
      const r = await fetch(`/api/debates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `SIM: ${directive.slice(0, 40)}`,
          trigger: 'PLAN_APPROVAL',
          context: simulationResult.summary,
          recommendation: simulationResult.debateReason || 'Simulation recommendation',
          options: simulationResult.projects
        })
      });
      const data = await r.json();
      if (r.ok) window.location.href = `/debate?id=${data.id}`;
    } catch (e: any) {
      alert(`Failed to create debate: ${e.message}`);
    }
  };

  const convertToAutoPlan = async () => {
    setMode('AUTO_PLAN');
    setShowSimulate(false);
    // User can now click "AUTO PLAN ➤" button which is already wired to directives with mode=AUTO_PLAN
  };

  const telemetryKPIs = [
    { label: 'Gateway', value: systemHealth?.gateway || 'offline', status: systemHealth?.gateway === 'online' ? 'ok' : 'bad' },
    { label: 'Database', value: systemHealth?.database || 'offline', status: systemHealth?.database === 'connected' ? 'ok' : 'bad' },
    { label: 'Queue', value: systemHealth?.queue || 'offline', status: systemHealth?.queue === 'connected' ? 'ok' : 'bad' },
    { label: 'Marge (Claude Relay)', value: systemHealth?.agents?.marge || 'offline', status: systemHealth?.agents?.marge === 'available' ? 'ok' : (systemHealth?.agents?.marge === 'degraded' ? 'warn' : 'bad') },
    { label: 'Lisa (ChatGPT Relay)', value: systemHealth?.agents?.lisa || 'offline', status: systemHealth?.agents?.lisa === 'available' ? 'ok' : (systemHealth?.agents?.lisa === 'degraded' ? 'warn' : 'bad') },
    { label: 'Marge Session', value: systemHealth?.sessions?.marge?.status || 'offline', status: systemHealth?.sessions?.marge?.status === 'ok' ? 'ok' : (systemHealth?.sessions?.marge?.status === 'degraded' ? 'warn' : 'bad') },
    { label: 'Lisa Session', value: systemHealth?.sessions?.lisa?.status || 'offline', status: systemHealth?.sessions?.lisa?.status === 'ok' ? 'ok' : (systemHealth?.sessions?.lisa?.status === 'degraded' ? 'warn' : 'bad') }
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
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:isMobile ? 0 : 20 }}>
          <div style={{ background:'#12121A', border:'1px solid rgba(255,217,15,0.3)', borderRadius:isMobile ? 0 : 16, width:'min(800px, 100%)', height:isMobile ? '100%' : 'auto', maxHeight:isMobile ? '100%' : '90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:16, borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontFamily:'Permanent Marker', color:'#FFD90F', margin:0 }}>PLAN SIMULATION</h2>
              <button onClick={() => { setShowSimulate(false); setSimulationResult(null); }} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>×</button>
            </div>
            
            <div style={{ padding:16, color:'rgba(255,255,255,0.85)', overflowY:'auto', flex:1 }}>
              {!simulationResult ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <p style={{ fontSize:18, marginBottom:24 }}>Maggie will simulate the directive and estimate jobs, dependencies, and risks without side effects.</p>
                  <button 
                    onClick={runSimulation} 
                    disabled={simulating || !directive.trim()}
                    style={{ 
                      width:'100%', maxWidth:300, padding:'16px 24px', background:'#FFD90F', color:'#000', 
                      border:'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize: 18, 
                      cursor: simulating ? 'wait' : 'pointer', opacity: (simulating || !directive.trim()) ? 0.5 : 1 
                    }}
                  >
                    {simulating ? 'SIMULATING...' : 'RUN SIMULATION'}
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Summary</h3>
                    <div style={{ background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, fontSize:15, lineHeight:1.5 }}>
                      {simulationResult.summary}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Objectives</h3>
                    <ul style={{ margin:0, paddingLeft:20, fontSize:14, display:'flex', flexDirection:'column', gap:4 }}>
                      {simulationResult.objectives?.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Projects</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {simulationResult.projects?.map((p: any, i: number) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', padding:12, borderRadius:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <strong style={{ fontSize:15 }}>{p.title}</strong>
                            <span style={{ fontSize:10, padding:'2px 6px', background:'rgba(255,217,15,0.1)', color:'#FFD90F', borderRadius:4 }}>{p.estimatedComplexity?.toUpperCase()}</span>
                          </div>
                          <p style={{ fontSize:13, margin:0, color:'rgba(255,255,255,0.6)' }}>{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Proposed Jobs</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {simulationResult.proposedJobs?.map((j: any, i: number) => (
                        <details key={i} style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,217,15,0.1)', borderRadius:8 }}>
                          <summary style={{ padding:10, cursor:'pointer', fontSize:14, fontWeight:600 }}>
                            {j.title} <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:400, fontSize:11 }}>— {j.owner}</span>
                          </summary>
                          <div style={{ padding:10, paddingTop:0, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                            <p style={{ marginBottom:8 }}>{j.reason}</p>
                            {j.dependsOn?.length > 0 && (
                              <div style={{ fontSize:11 }}>
                                <span style={{ color:'#FFD90F' }}>Depends on:</span> {j.dependsOn.join(', ')}
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Risks</h3>
                    <div style={{ background:'rgba(255,68,68,0.05)', border:'1px solid rgba(255,68,68,0.2)', padding:12, borderRadius:8, fontSize:14, color:'#FF8888' }}>
                      <ul style={{ margin:0, paddingLeft:20 }}>
                        {simulationResult.risks?.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {simulationResult.requiresDebate && (
                    <section style={{ background:'rgba(255,217,15,0.05)', border:'1px solid #FFD90F44', padding:12, borderRadius:8 }}>
                      <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, margin:0, marginBottom:4 }}>Debate Recommended</h3>
                      <p style={{ fontSize:13, margin:0 }}>{simulationResult.debateReason}</p>
                    </section>
                  )}

                  <section>
                    <h3 style={{ color:'#FFD90F', fontSize:14, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Execution Phases</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {simulationResult.estimatedExecutionPhases?.map((p: string, i: number) => (
                        <div key={i} style={{ display:'flex', gap:12, alignItems:'center' }}>
                          <span style={{ width:24, height:24, borderRadius:'50%', background:'rgba(255,217,15,0.2)', color:'#FFD90F', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{i+1}</span>
                          <span style={{ fontSize:14 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                    <button onClick={createDebateFromSim} style={{ flex:1, minWidth:200, padding:'14px', background:'rgba(255,217,15,0.1)', color:'#FFD90F', border:'1px solid #FFD90F', borderRadius:10, fontFamily:'Permanent Marker', cursor:'pointer' }}>CREATE DEBATE</button>
                    <button onClick={convertToAutoPlan} style={{ flex:1, minWidth:200, padding:'14px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, fontFamily:'Permanent Marker', cursor:'pointer' }}>CONVERT TO AUTO PLAN</button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.1)' }}>
              <button onClick={() => { setShowSimulate(false); setSimulationResult(null); }} style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10 }}>CLOSE</button>
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
          {activeDebateCount > 0 && <span style={{ fontSize: 10, color:'#FFD90F', border:'1px solid rgba(255,217,15,0.6)', padding:'2px 6px', borderRadius:6, fontFamily:'monospace' }}>ACTIVE DEBATE ×{activeDebateCount}</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--jarvis-text-dim)', fontFamily:'monospace', textAlign:'right' }}>
          BUILD: {process.env.NEXT_PUBLIC_BUILD_STAMP || systemHealth?.build || 'v1.6.4-HEAL-ESCALATE'}<br/>PROVIDER: {systemHealth?.maggieProvider?.toUpperCase() || 'GEMINI'}
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
        <JarvisPanel title="COMMAND PODIUM" actions={<button onClick={() => setMode('DIRECTIVE')} style={{ fontSize:10, padding:'6px 10px', border:'1px solid rgba(255,217,15,0.3)', borderRadius:8, background:'rgba(255,217,15,0.1)', color:'#FFD90F' }}>RESET MODE</button>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['DIRECTIVE', 'AUTO_PLAN'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  style={{ flex:1, minHeight:48, padding:8, borderRadius:10, border: mode===m ? '2px solid #FFD90F' : '1px solid rgba(255,217,15,0.2)', background: mode===m ? '#FFD90F' : 'rgba(0,0,0,0.3)', color: mode===m ? '#000' : '#fff', fontFamily:'Permanent Marker', transition: 'all 0.2s' }}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['debate','terminal','kanban'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'debate') window.location.href = '/debate';
                    else if (tab === 'kanban') window.location.href = '/kanban';
                    else setActiveTab(tab);
                  }}
                  style={{ flex:1, minHeight:36, padding:8, borderRadius:10, border:'1px solid rgba(255,217,15,0.1)', background: activeTab===tab ? 'rgba(255,217,15,0.1)' : 'rgba(0,0,0,0.2)', color: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.6)', fontFamily:'Permanent Marker', fontSize: 12 }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            {activeTab !== 'terminal' && (
              <>
                <div style={{ position:'relative' }}>
                  <textarea value={directive} onChange={e => { setDirective(e.target.value); voiceCtl.setTranscript(e.target.value); }} placeholder={mode === 'DIRECTIVE' ? "Enter strategic directive..." : "Dump ideas, projects, or research goals for Maggie to plan..."} style={{ width:'100%', minHeight:160, borderRadius:12, border: mode === 'AUTO_PLAN' ? '1px solid #FFD90F' : '1px solid rgba(255,217,15,0.2)', background:'rgba(0,0,0,0.35)', padding:14, paddingRight:48, color: mode === 'AUTO_PLAN' ? '#FFD90F' : '#fff', resize:'none' }} />
                  <button onClick={voiceCtl.toggle} style={{ position:'absolute', right:10, top:10, width:36, height:36, borderRadius:10, border:'1px solid rgba(255,217,15,0.3)', background: voiceCtl.voice.status==='listening' ? '#FF4444' : 'rgba(0,0,0,0.4)', color:'#FFD90F' }}>{voiceCtl.voice.status==='listening' ? '⏺' : '🎙️'}</button>
                </div>
                {voiceCtl.voice.status === 'listening' && <div style={{ fontSize:11, color:'#FFD90F' }}>Listening…</div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, color:'var(--jarvis-text-dim)' }}>{status}</span>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => setShowSimulate(true)} style={{ minHeight:48, padding:'10px 18px', borderRadius:12, border:'1px solid rgba(255,217,15,0.3)', background:'rgba(0,0,0,0.35)', color:'#FFD90F', fontFamily:'Permanent Marker' }}>SIMULATE</button>
                    <button onClick={sendDirective} style={{ minHeight:48, padding:'10px 18px', borderRadius:12, border:'none', background:'#FFD90F', color:'#000', fontFamily:'Permanent Marker' }}>{mode === 'AUTO_PLAN' ? 'AUTO PLAN ➤' : 'DISPATCH ➤'}</button>
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
