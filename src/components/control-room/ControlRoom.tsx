'use client';

import React, { useEffect, useState } from 'react';
import { AgentState, STATE_COLORS, ANIMATION_CSS, ANIMATION_CLASSES } from './animations';
import { HomerAvatar } from './agents/HomerAvatar';
import { MargeAvatar } from './agents/MargeAvatar';
import { LisaAvatar } from './agents/LisaAvatar';
import { BartAvatar } from './agents/BartAvatar';
import { MaggieAvatar } from './agents/MaggieAvatar';
import { useControlRoomData } from './useControlRoomData';

const FONT = '"Courier New", monospace';

const C = {
  wall: '#7a9ab5',
  wallDeep: '#4f6d8a',
  wallPanel: '#6b8aa6',
  floor: '#4a3020',
  floorLine: '#3c261a',
  console: '#8b7ba8',
  consoleDark: '#6f6388',
  blue: '#42d9f5',
  amber: '#f5c518',
  orange: '#e85c00',
  green: '#00e87a',
  red: '#ff3322',
};

function Pipes({ style }: { style?: React.CSSProperties }) {
  return (
    <svg style={{ position:'absolute', ...style }} viewBox="0 0 60 200" width="60" height="200">
      <rect x="10" y="0" width="8" height="200" fill="#1e2218" stroke="#2a2e22" strokeWidth="1"/>
      <rect x="30" y="0" width="5" height="200" fill="#181c14" stroke="#252920" strokeWidth="1"/>
      <rect x="45" y="0" width="10" height="200" fill="#1e2218" stroke="#2a2e22" strokeWidth="1"/>
      <rect x="8" y="60" width="12" height="8" rx="2" fill="#2a2e22"/>
      <rect x="43" y="120" width="14" height="8" rx="2" fill="#2a2e22"/>
      <circle cx="14" cy="30" r="4" fill="#333" stroke="#444" strokeWidth="1"/>
      <circle cx="50" cy="90" r="4" fill="#333" stroke="#444" strokeWidth="1"/>
    </svg>
  );
}

function HazardStripe({ width = 120, height = 10, colors = ['#e85c00', '#111'], rotate = 0 }: { width?: number; height?: number; colors?: [string, string]; rotate?: number }) {
  return (
    <svg width={width} height={height} style={{ display:'block', transform: `rotate(${rotate}deg)` }}>
      <defs>
        <pattern id={`hz-${width}-${height}-${rotate}`} x="0" y="0" width="20" height={height} patternUnits="userSpaceOnUse">
          <rect width="10" height={height} fill={colors[0]}/>
          <rect x="10" width="10" height={height} fill={colors[1]}/>
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#hz-${width}-${height}-${rotate})`} opacity="0.85"/>
    </svg>
  );
}

function Monitor({ color = '#00e87a', label = '', lines = 4, style }: { color?: string; label?: string; lines?: number; style?: React.CSSProperties; }) {
  return (
    <div style={{
      background: '#050805',
      border: `1px solid ${color}33`,
      borderRadius: 3,
      padding: '4px 6px',
      boxShadow: `inset 0 0 8px ${color}22, 0 0 6px ${color}22`,
      ...style,
    }}>
      {label && <div style={{ fontFamily: FONT, fontSize: 7, color, letterSpacing:'0.1em', marginBottom: 3, opacity: 0.8 }}>{label}</div>}
      {Array.from({length: lines}).map((_, i) => (
        <div key={i} style={{
          height: 2,
          background: color,
          opacity: 0.15 + (i % 2) * 0.1,
          marginBottom: 2,
          borderRadius: 1,
          animation: `consoleFade ${1.5 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}/>
      ))}
    </div>
  );
}

function ServerRack({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#111410', border: '1px solid #2a2e22', borderRadius: 4, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, ...style, }}>
      {Array.from({length: 8}).map((_, i) => (
        <div key={i} style={{ height: 8, background: '#1a1e14', border: '1px solid #252920', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 4px', gap: 3, }}>
          <div style={{
            width: 4,
            height: 4,
            borderRadius:'50%',
            background: i < 5 ? C.green : i === 5 ? C.orange : '#333',
            boxShadow: i < 5 ? `0 0 4px ${C.green}` : i === 5 ? `0 0 4px ${C.orange}` : 'none',
            animation: i < 5 ? 'machineBreath 2s ease-in-out infinite' : 'none',
            animationDelay: `${i * 0.3}s`,
          }}/>
          <div style={{ flex: 1, height: 2, background: '#252920', borderRadius: 1 }}/>
          <div style={{ width: 8, height: 4, background: '#1e2218', borderRadius: 1 }}/>
        </div>
      ))}
    </div>
  );
}

function DeskConsole({ color, children, style }: { color: string; children?: React.ReactNode; style?: React.CSSProperties; }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.console} 0%, ${C.consoleDark} 100%)`,
      border: `2px solid ${color}55`,
      borderRadius: '50% 50% 0 0',
      padding: '10px 12px 6px',
      boxShadow: `0 0 12px ${color}22`,
      position: 'relative',
      ...style,
    }}>
      <div style={{ position:'absolute', top: 0, left: 0, right: 0, height: 4, background: color, opacity: 0.25, borderRadius:'50% 50% 0 0' }}/>
      {children}
    </div>
  );
}

function SpeechBubble({ text, color, style }: { text: string; color: string; style?: React.CSSProperties }) {
  if (!text) return null;
  return (
    <div style={{
      position: 'relative',
      background: '#ffffff',
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: '4px 8px',
      fontFamily: FONT,
      fontSize: 9,
      color: '#111',
      maxWidth: 140,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      zIndex: 10,
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      marginBottom: 4,
      alignSelf: 'center',
      ...style,
    }}>
      {text.slice(0, 50)}{text.length > 50 ? '…' : ''}
      <div style={{ position: 'absolute', bottom: -6, left: 16, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${color}`, }}/>
      <div style={{ position: 'absolute', bottom: -4, left: 17, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #ffffff' }}/>
    </div>
  );
}

function StatusBadge({ state }: { state: AgentState }) {
  const color = STATE_COLORS[state];
  const labels: Record<AgentState, string> = {
    idle:'STANDBY',
    thinking:'PROCESSING',
    active:'ONLINE',
    complete:'COMPLETE',
    failed:'FAULT',
    offline:'OFFLINE',
    rate_limited:'THROTTLED',
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap: 4, background:'rgba(0,0,0,0.6)', borderRadius: 3, padding:'2px 6px', border:`1px solid ${color}44`, }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }}/>
      <span style={{ fontFamily:FONT, fontSize:7, letterSpacing:'0.15em', color }}>{labels[state]}</span>
    </div>
  );
}

function BackWall({ health, lastUpdated }: { health: any; lastUpdated: Date | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = lastUpdated ? lastUpdated.toLocaleTimeString('en-US',{hour12:false}) : '--:--:--';
  const statusColor = health.status === 'healthy' ? C.green : health.status === 'degraded' ? C.orange : C.red;
  const warnOn = health.status !== 'healthy';

  return (
    <div style={{
      position:'absolute',
      top:0,
      left:0,
      right:0,
      height:170,
      background: C.wall,
      backgroundImage: `repeating-linear-gradient(0deg, ${C.wallPanel} 0px, ${C.wallPanel} 2px, transparent 2px, transparent 18px)`,
      borderBottom: `4px solid ${C.orange}`,
      display:'flex',
      alignItems:'flex-start',
      padding:'0 20px',
      gap:12,
      overflow:'hidden',
      zIndex: 1,
    }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:70, background: C.wallDeep, borderRight:'3px solid #2b3f55', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ transform:'rotate(-90deg)' }}><HazardStripe width={120} height={10} colors={[C.orange, '#111']} /></div>
        <div style={{ position:'absolute', top:20, left:8, fontSize:24 }}>☢</div>
      </div>
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:70, background: C.wallDeep, borderLeft:'3px solid #2b3f55', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ transform:'rotate(-90deg)' }}><HazardStripe width={120} height={10} colors={[C.orange, '#111']} /></div>
        <div style={{ position:'absolute', top:20, right:10, fontSize:24 }}>☢</div>
      </div>

      <div style={{ width:130, height:130, marginTop:16, background:C.wallPanel, border:'2px solid #2b3f55', borderRadius:4, padding:'8px 10px', display:'flex', flexDirection:'column', gap:6, }}>
        <div style={{ fontFamily:FONT, fontSize:7, letterSpacing:'0.2em', color:'#2b3f55' }}>SPRINGFIELD NUCLEAR</div>
        <div style={{ fontFamily:FONT, fontSize:11, fontWeight:700, letterSpacing:'0.25em', color:C.orange, lineHeight:1.2 }}> COMMAND<br/>CENTER </div>
        <div style={{ display:'flex', gap:6, marginTop:4 }}>
          {['#00e87a','#e85c00','#ff3322'].map((col, i) => (
            <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: (i===0&&health.status==='healthy')||(i===1&&health.status==='degraded')||(i===2&&health.status==='offline') ? col : '#1a1e14', boxShadow: warnOn ? `0 0 10px ${col}` : 'none', animation: warnOn ? 'indicatorPulse 1.2s ease-in-out infinite' : 'none', border:'1px solid #333', }}/>
          ))}
        </div>
        <HazardStripe width={110} height={6} colors={[C.orange, '#111']} />
        <div style={{ fontFamily:FONT, fontSize:8, color:statusColor, letterSpacing:'0.1em' }}> ◉ {health.status?.toUpperCase()||'ONLINE'} </div>
      </div>

      <div style={{ flex:1, display:'flex', gap:8, marginTop:12, height:130 }}>
        <div style={{ flex:2, background:'#d7e2ec', border:'2px solid #2b3f55', borderRadius:6, padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontFamily:FONT, fontSize:7, letterSpacing:'0.2em', color:'#2b3f55' }}>SYSTEM STATUS</div>
          <div style={{ display:'flex', gap:16 }}>
            {[
              { label:'ACTIVE', val:health.activeJobs, color:C.green },
              { label:'QUEUED', val:health.queuedJobs, color:C.orange },
              { label:'FAILED', val:health.failedJobs, color:C.red },
              { label:'RELAY', val:health.relayQueueDepth, color:'#a855f7' },
            ].map(m => (
              <div key={m.label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:FONT, fontSize:18, fontWeight:700, color:m.color, lineHeight:1, animation:'meterFlicker 6s ease-in-out infinite' }}>{m.val}</div>
                <div style={{ fontFamily:FONT, fontSize:6, letterSpacing:'0.1em', color:'rgba(30,40,50,0.7)', marginTop:2 }}>{m.label}</div>
                <div style={{ height:2, background:'rgba(0,0,0,0.1)', borderRadius:1, marginTop:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(m.val/5,1)*100}%`, background:m.color, transition:'width 1s' }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            <Monitor color={C.green} label="NEON BRIDGE" lines={3}/>
            <Monitor color={C.orange} label="RELAY WORKER" lines={3}/>
          </div>
        </div>
        <div style={{ width:90, background:'#d7e2ec', border:'2px solid #2b3f55', borderRadius:6, padding:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', }}>
          <div style={{ fontFamily:FONT, fontSize:7, letterSpacing:'0.15em', color:'#2b3f55' }}>SYNC TIME</div>
          <div style={{ fontFamily:FONT, fontSize:16, fontWeight:700, color:'#223240', letterSpacing:'0.05em', animation:'consoleFade 4s ease-in-out infinite' }}> {timeStr} </div>
          <div style={{ fontFamily:FONT, fontSize:6, color:'rgba(30,40,50,0.6)', letterSpacing:'0.1em' }}>UTC · 10s POLL</div>
          <HazardStripe width={74} height={5} colors={[C.orange, '#111']} />
        </div>
        <ServerRack style={{ width:70, flexShrink:0 }}/>
      </div>

      <div style={{ width:90, height:130, marginTop:16, background:C.wallPanel, border:'2px solid #2b3f55', borderRadius:4, padding:'6px 8px', display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ fontFamily:FONT, fontSize:6, letterSpacing:'0.15em', color:'#2b3f55' }}>DIAGNOSTICS</div>
        {['TASK-WKR','NEON-BRG','RELAY-WK','PM2 FLEET'].map((label, i) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:C.green, boxShadow:`0 0 4px ${C.green}`, animation:'machineBreath 2s ease-in-out infinite', animationDelay:`${i*0.4}s` }}/>
            <span style={{ fontFamily:FONT, fontSize:6, color:'rgba(30,40,50,0.8)', letterSpacing:'0.08em' }}>{label}</span>
          </div>
        ))}
        <HazardStripe width={64} height={5} colors={[C.orange, '#111']} />
        <Monitor color={C.blue} lines={4} style={{ marginTop:2 }}/>
      </div>

      <div style={{ position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)', width:160, height:30, background:C.wallDeep, border:'2px solid #2b3f55', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <HazardStripe width={140} height={8} colors={[C.orange, '#111']} />
      </div>
    </div>
  );
}

function Floor() {
  return (
    <div style={{ position:'absolute', top:0, bottom:44, left:0, right:0, background: C.floor, backgroundImage:`repeating-linear-gradient(90deg, ${C.floor} 0, ${C.floor} 79px, ${C.floorLine} 79px, ${C.floorLine} 80px), repeating-linear-gradient(0deg, ${C.floor} 0, ${C.floor} 39px, ${C.floorLine} 39px, ${C.floorLine} 40px)`, borderTop:`4px solid ${C.orange}`, zIndex: 0 }}/>
  );
}

const STATION_CFG = {
  maggie: { color:'#ec4899', label:'CENTRAL COMMAND', role:'ORCHESTRATOR', deskW:220 },
  homer: { color:'#f97316', label:'EXECUTION TERMINAL', role:'EXECUTOR', deskW:160 },
  marge: { color:'#3b82f6', label:'ARCHITECTURE DESK', role:'ARCH LEAD', deskW:160 },
  lisa: { color:'#a855f7', label:'STRATEGY BOARD', role:'STRATEGIST', deskW:160 },
  bart: { color:'#22c55e', label:'QA / GUI OPS', role:'BROWSER AGENT', deskW:160 },
};

const AVATAR_MAP = { homer:HomerAvatar, marge:MargeAvatar, lisa:LisaAvatar, bart:BartAvatar, maggie:MaggieAvatar };

interface StationProps {
  agentId: 'homer'|'marge'|'lisa'|'bart'|'maggie';
  state: AgentState;
  lastMessage: string;
  avatarSize?: number;
  stateClass: string;
}

function AgentStation({ agentId, state, lastMessage, avatarSize = 80, stateClass }: StationProps) {
  const cfg = STATION_CFG[agentId];
  const Avatar = AVATAR_MAP[agentId];
  const stateColor = STATE_COLORS[state];

  return (
    <div className={stateClass} style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
      {lastMessage && (
        <SpeechBubble text={lastMessage} color={cfg.color}/>
      )}
      <div style={{ position:'relative', zIndex:2 }}>
        <Avatar state={state} size={avatarSize}/>
      </div>
      <DeskConsole color={cfg.color} style={{ width:cfg.deskW, marginTop:-8, zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ fontFamily:FONT, fontSize:7, letterSpacing:'0.15em', color:'#1f1b27', opacity:0.8 }}>{cfg.label}</div>
          <StatusBadge state={state}/>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <Monitor color={cfg.color} lines={3} style={{ flex:1 }}/>
          <Monitor color={stateColor} lines={3} style={{ flex:1 }}/>
          <div style={{ display:'flex', flexDirection:'column', gap:3, justifyContent:'center', padding:'0 4px' }}>
            {[cfg.color, stateColor, '#333'].map((col, i) => (
              <div key={i} style={{ width:7, height:7, borderRadius:'50%', background: i < 2 ? col : '#222', boxShadow: i < 2 && state !== 'idle' ? `0 0 5px ${col}` : 'none', border:'1px solid rgba(255,255,255,0.1)', }}/>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, marginTop:6 }}>
          <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(0,0,0,0.15)' }} />
          <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(0,0,0,0.15)' }} />
          <div style={{ width:24, height:6, borderRadius:3, background:cfg.color, opacity:0.7 }} />
        </div>
        <div style={{ marginTop:4, textAlign:'center', fontFamily:FONT, fontSize:8, fontWeight:700, letterSpacing:'0.2em', color:'#1f1b27' }}>
          {agentId.toUpperCase()} · <span style={{ color:cfg.color, fontSize:7 }}>{cfg.role}</span>
        </div>
      </DeskConsole>
      <div style={{ width:cfg.deskW, height:12, background:`linear-gradient(180deg, ${C.consoleDark} 0%, ${C.console} 100%)`, borderLeft:'2px solid #4d4361', borderRight:'2px solid #4d4361', borderBottom:'2px solid #4d4361', borderRadius:'0 0 4px 4px', }}/>
    </div>
  );
}

const EV_COLORS: Record<string,string> = {
  THREAD_MESSAGE:'#42d9f5',
  JOB_CREATED:C.orange,
  JOB_COMPLETED:C.green,
  JOB_FAILED:C.red,
  RELAY_REQUEST:'#c542f5',
  THREAD_CHECKPOINT:'#f5a142',
  DIRECTIVE_RECEIVED:'#42d9f5',
  THREAD_CLASSIFICATION:'#42c5f5',
  THREAD_ROUTING:'#f5c542',
  WORKER_COMPLETE:'#00cc66',
  SYSTEM:'#7a8a6a',
};

function PlantLog({ events }: { events: any[] }) {
  const display = events.length > 0 ? events : [
    {id:'s1',type:'SYSTEM'},{id:'s2',type:'WORKER_COMPLETE'},
    {id:'s3',type:'JOB_COMPLETED'},{id:'s4',type:'THREAD_ROUTING'},
    {id:'s5',type:'SYSTEM'},{id:'s6',type:'RELAY_REQUEST'},
  ];
  const items = [...display,...display,...display];
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:44, background:'rgba(4,6,4,0.97)', borderTop:`1px solid ${C.orange}`, display:'flex', alignItems:'center', overflow:'hidden', zIndex:5, }}>
      <div style={{ flexShrink:0, width:90, height:'100%', background:'rgba(0,0,0,0.5)', borderRight:'1px solid rgba(120,140,90,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:2, }}>
        <div style={{ fontFamily:FONT, fontSize:6, letterSpacing:'0.2em', color:C.orange }}>PLANT LOG</div>
        <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, boxShadow:`0 0 6px ${C.green}`, animation:'indicatorPulse 2s ease-in-out infinite' }}/>
      </div>
      <div style={{ position:'absolute', left:90, top:0, bottom:0, width:40, background:'linear-gradient(to right, rgba(4,6,4,0.98),transparent)', zIndex:2, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:40, background:'linear-gradient(to left, rgba(4,6,4,0.98),transparent)', zIndex:2, pointerEvents:'none' }}/>
      <div style={{ display:'flex', animation:'tickerScroll 40s linear infinite', whiteSpace:'nowrap', willChange:'transform', paddingLeft:100 }}>
        {items.map((ev,i) => {
          const color = EV_COLORS[ev.type]||'#6b7280';
          return (
            <span key={`${ev.id}-${i}`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'0 18px', fontFamily:FONT, fontSize:10, letterSpacing:'0.1em' }}>
              <span style={{ color, fontWeight:700 }}>{ev.type}</span>
              <span style={{ color:'rgba(255,255,255,0.15)', fontSize:7 }}>◆</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ControlRoom() {
  const { agents, systemHealth, tickerEvents, lastUpdated, error } = useControlRoomData();
  const maggie = agents.find(a => a.id === 'maggie')!;
  const homer = agents.find(a => a.id === 'homer')!;
  const marge = agents.find(a => a.id === 'marge')!;
  const lisa = agents.find(a => a.id === 'lisa')!;
  const bart = agents.find(a => a.id === 'bart')!;

  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cr-scene-root { width: 100vw; height: 100vh; background: ${C.wall}; position: relative; overflow: hidden; }
        .cr-scene-root::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.25;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .agents-layer { position: absolute; bottom: 44px; left: 0; right: 0; display: flex; align-items: flex-end; justify-content: center; padding: 0 16px 16px; z-index: 4; }
        .agent-center-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
        .agent-center-label { font-family: "Courier New", monospace; font-size: 7px; letter-spacing: 0.3em; color: rgba(236,72,153,0.8); margin-bottom: 4px; }
        @media (max-width: 768px) {
          .cr-scene-root { height: auto; min-height: 100vh; overflow-y: auto; }
          .agents-layer { position: relative; bottom: auto; flex-direction: column; align-items: center; padding: 190px 16px 60px; gap: 20px; }
          .agent-center-wrap { margin-bottom: 0; }
        }
      `}</style>
      <div className="cr-scene-root">
        <BackWall health={systemHealth} lastUpdated={lastUpdated}/>
        <Pipes style={{ left:0, top:110, opacity:0.5, zIndex: 2 }}/>
        <Pipes style={{ right:0, top:90, opacity:0.5, transform:'scaleX(-1)', zIndex: 2 }}/>
        <Floor/>
        <div style={{ position:'absolute', top:150, left:'50%', transform:'translateX(-50%)', width:600, height:200, background:'radial-gradient(ellipse at center top, rgba(245,197,24,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex: 3 }}/>
        <div className="agents-layer">
          <AgentStation agentId="homer" state={homer.state} lastMessage={homer.lastMessage} stateClass={ANIMATION_CLASSES[homer.state]} avatarSize={72}/>
          <AgentStation agentId="marge" state={marge.state} lastMessage={marge.lastMessage} stateClass={ANIMATION_CLASSES[marge.state]} avatarSize={78}/>
          <div className="agent-center-wrap">
            <div className="agent-center-label">✦ CENTRAL COMMAND ✦</div>
            <AgentStation agentId="maggie" state={maggie.state} lastMessage={maggie.lastMessage} stateClass={ANIMATION_CLASSES[maggie.state]} avatarSize={100}/>
          </div>
          <AgentStation agentId="lisa" state={lisa.state} lastMessage={lisa.lastMessage} stateClass={ANIMATION_CLASSES[lisa.state]} avatarSize={78}/>
          <AgentStation agentId="bart" state={bart.state} lastMessage={bart.lastMessage} stateClass={ANIMATION_CLASSES[bart.state]} avatarSize={72}/>
        </div>
        <PlantLog events={tickerEvents}/>
        {error && (
          <div style={{ position:'fixed', bottom:52, left:'50%', transform:'translateX(-50%)', background:'rgba(255,51,51,0.12)', border:'2px solid rgba(255,51,51,0.5)', borderRadius:4, padding:'5px 14px', fontFamily:FONT, fontSize:10, color:C.red, letterSpacing:'0.1em', zIndex:300, }}> ⚠ COMMS FAULT </div>
        )}
      </div>
    </>
  );
}
