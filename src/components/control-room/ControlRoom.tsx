'use client';

import React, { useEffect, useState } from 'react';
import { useControlRoomData } from './useControlRoomData';
import { ANIMATION_CSS, STATE_COLORS, STATE_LABELS, ANIMATION_CLASSES, AgentState } from './animations';
import { HomerAvatar } from './agents/HomerAvatar';
import { MargeAvatar } from './agents/MargeAvatar';
import { LisaAvatar } from './agents/LisaAvatar';
import { BartAvatar } from './agents/BartAvatar';
import { MaggieAvatar } from './agents/MaggieAvatar';

const FONT_MONO = '"Courier New", "Lucida Console", monospace';

const ROOM_VARS = `
  :root {
    --plant-bg: #0c0e0a;
    --plant-floor: #111410;
    --panel-bg: rgba(12,16,10,0.97);
    --panel-border: rgba(120,140,90,0.25);
    --amber: #f5c842;
    --green-run: #00ff88;
    --red-alert: #ff3333;
    --text-dim: rgba(180,200,160,0.5);
    --text-mid: rgba(200,220,180,0.75);
    --text-bright: rgba(220,240,200,0.95);
    --scanline: rgba(0,0,0,0.06);
  }
`;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function StatusLight({ state, size = 8 }: { state: AgentState; size?: number }) {
  const color = STATE_COLORS[state];
  return (
    <div className="status-light" style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size}px ${color}`,
      flexShrink: 0,
      transition: 'background 0.5s, box-shadow 0.5s',
    }}/>
  );
}

function WarningLight({ color = '#f5c842', on = true }: { color?: string; on?: boolean }) {
  return (
    <div style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: on ? color : '#2a2a2a',
      boxShadow: on ? `0 0 8px ${color}` : 'none',
      border: '1px solid rgba(255,255,255,0.1)',
      animation: on ? 'machineBreath 2s ease-in-out infinite' : 'none',
    }}/>
  );
}

function GaugeBar({ value = 0.6, color = '#00ff88', label = '' }: { value?: number; color?: string; label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {label && <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{label}</div>}
      <div style={{ height: 4, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value * 100}%`,
          background: color,
          boxShadow: `0 0 4px ${color}`,
          animation: 'consoleFade 2s ease-in-out infinite',
          transition: 'width 1s ease',
        }}/>
      </div>
    </div>
  );
}

const AVATAR_MAP = {
  homer: HomerAvatar,
  marge: MargeAvatar,
  lisa: LisaAvatar,
  bart: BartAvatar,
  maggie: MaggieAvatar,
};

const STATION_CONFIG = {
  maggie: {
    label: 'CENTRAL COMMAND',
    role: 'ORCHESTRATOR',
    color: '#EC4899',
    borderColor: 'rgba(236,72,153,0.35)',
    props: [
      { icon: '⬡', label: 'ROUTING ENGINE' },
      { icon: '◎', label: 'THREAD MONITOR' },
      { icon: '✦', label: 'CLASSIFICATION' },
    ],
  },
  homer: {
    label: 'EXECUTION TERMINAL',
    role: 'EXECUTOR',
    color: '#F97316',
    borderColor: 'rgba(249,115,22,0.35)',
    props: [
      { icon: '▣', label: 'DEPLOY QUEUE' },
      { icon: '⚙', label: 'TASK WORKER' },
      { icon: '◈', label: 'PM2 FLEET' },
    ],
  },
  marge: {
    label: 'ARCHITECTURE DESK',
    role: 'ARCH LEAD',
    color: '#3B82F6',
    borderColor: 'rgba(59,130,246,0.35)',
    props: [
      { icon: '◧', label: 'BLUEPRINT REVIEW' },
      { icon: '◫', label: 'GOVERNANCE LOG' },
      { icon: '◨', label: 'SCOPE REGISTRY' },
    ],
  },
  lisa: {
    label: 'STRATEGY BOARD',
    role: 'STRATEGIST',
    color: '#A855F7',
    borderColor: 'rgba(168,85,247,0.35)',
    props: [
      { icon: '◇', label: 'ANALYSIS ENGINE' },
      { icon: '◈', label: 'DEBATE PREP' },
      { icon: '◉', label: 'RELAY INFRA' },
    ],
  },
  bart: {
    label: 'QA / GUI OPS',
    role: 'BROWSER AGENT',
    color: '#22C55E',
    borderColor: 'rgba(34,197,94,0.35)',
    props: [
      { icon: '▦', label: 'PLAYWRIGHT OPS' },
      { icon: '◱', label: 'UI VALIDATION' },
      { icon: '◲', label: 'CHROME RELAY' },
    ],
  },
};

interface AgentData {
  id: 'homer'|'marge'|'lisa'|'bart'|'maggie';
  name: string;
  state: AgentState;
  lastMessage: string;
}

function AgentStation({ agent, isCentral = false }: { agent: AgentData; isCentral?: boolean }) {
  const Avatar = AVATAR_MAP[agent.id];
  const cfg = STATION_CONFIG[agent.id];
  const stateColor = STATE_COLORS[agent.state];
  const stateClass = ANIMATION_CLASSES[agent.state];
  const avatarSize = isCentral ? 110 : 80;

  return (
    <div className={stateClass} style={{ height: '100%', animation: 'stationBoot 0.5s ease-out forwards' }}>
      <div className="station-console" style={{
        height: '100%',
        background: 'linear-gradient(160deg, rgba(10,14,8,0.98) 0%, rgba(14,18,10,0.95) 100%)',
        border: `1px solid ${cfg.borderColor}`,
        borderRadius: isCentral ? 12 : 8,
        padding: isCentral ? '16px 20px' : '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg, var(--scanline) 0px, var(--scanline) 1px, transparent 1px, transparent 3px)', }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '0.2em', color: cfg.color, opacity: 0.8 }}>
            {cfg.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <StatusLight state={agent.state} size={7}/>
            <div style={{ fontFamily: FONT_MONO, fontSize: 7, letterSpacing: '0.15em', color: stateColor }}>
              {STATE_LABELS[agent.state]}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', bottom: -4, left: '10%', right: '10%', height: 14, background: 'rgba(30,40,20,0.8)', border: '1px solid rgba(100,140,60,0.3)', borderRadius: '4px 4px 0 0', }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
              {[cfg.color, '#f5c842', stateColor].map((col, i) => (
                <WarningLight key={i} color={col} on={i !== 1 || agent.state !== 'idle'}/>
              ))}
            </div>
          </div>
          <Avatar state={agent.state} size={avatarSize}/>
        </div>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: isCentral ? 13 : 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-bright)' }}>
            {agent.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 7, letterSpacing: '0.15em', color: cfg.color, marginTop: 2 }}>
            {cfg.role}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, zIndex: 1 }}>
          {cfg.props.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: cfg.color, fontSize: 9, opacity: 0.7 }}>{p.icon}</span>
              <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{p.label}</div>
              <div style={{ marginLeft: 'auto' }}>
                <GaugeBar value={agent.state === 'active' ? 0.85 : agent.state === 'thinking' ? 0.5 : 0.2} color={cfg.color}/>
              </div>
            </div>
          ))}
        </div>
        {agent.lastMessage && (
          <div style={{marginTop: 'auto', zIndex: 1, background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(${hexToRgb(cfg.color)}, 0.2)`, borderRadius: 4, padding: '5px 8px', }}>
            <p style={{ fontFamily: FONT_MONO, fontSize: 9, lineHeight: 1.5, color: 'var(--text-dim)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', }}>
              {agent.lastMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SystemWall({ health, lastUpdated }: { health: any; lastUpdated: Date | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';
  const statusColor = health.status === 'healthy' ? '#00ff88' : health.status === 'degraded' ? '#f5c842' : '#ff3333';

  return (
    <div style={{
      gridArea: 'wall',
      background: 'linear-gradient(180deg, rgba(4,6,4,0.99) 0%, rgba(10,14,8,0.97) 100%)',
      borderBottom: '1px solid rgba(120,140,90,0.3)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <WarningLight color="#00ff88" on={health.status === 'healthy'}/>
          <WarningLight color="#f5c842" on={health.status === 'degraded'}/>
          <WarningLight color="#ff3333" on={health.status === 'offline'}/>
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-dim)' }}>SPRINGFIELD NUCLEAR</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, letterSpacing: '0.3em', color: 'var(--amber)' }}>COMMAND CENTER</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: statusColor, letterSpacing: '0.15em', marginTop: 2 }}> ◉ SYSTEM {health.status?.toUpperCase() || 'ONLINE'} </div>
        </div>
      </div>
      <div style={{ width: 1, height: 48, background: 'rgba(120,140,90,0.25)', flexShrink: 0 }}/>
      <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center' }}>
        {[
          { label: 'ACTIVE', value: health.activeJobs, color: '#00ff88' },
          { label: 'QUEUED', value: health.queuedJobs, color: '#f5c842' },
          { label: 'FAILED', value: health.failedJobs, color: '#ff3333' },
          { label: 'RELAY Q', value: health.relayQueueDepth, color: '#c542f5' },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center', minWidth: 40 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1, animation: 'meterFlicker 8s ease-in-out infinite' }}>
              {m.value}
            </div>
            <GaugeBar value={Math.min(m.value / 5, 1)} color={m.color} label={m.label}/>
          </div>
        ))}
      </div>
      <div style={{ width: 1, height: 48, background: 'rgba(120,140,90,0.25)', flexShrink: 0 }}/>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '0.08em', animation: 'consoleFade 4s ease-in-out infinite' }}>
          {timeStr}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'var(--text-dim)', letterSpacing: '0.12em' }}>LAST SYNC · UTC</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'var(--amber)', letterSpacing: '0.1em', marginTop: 2 }}>POLL INTERVAL 10s</div>
      </div>
    </div>
  );
}

const EVENT_COLORS: Record<string, string> = {
  THREAD_MESSAGE: '#42d9f5',
  JOB_CREATED: '#f5c842',
  JOB_COMPLETED: '#00ff88',
  JOB_FAILED: '#ff3333',
  RELAY_REQUEST: '#c542f5',
  THREAD_CHECKPOINT: '#f5a142',
  DIRECTIVE_RECEIVED: '#42d9f5',
  DEBATE_CREATED: '#f542a1',
  GOVERNANCE_PROTOCOL: '#a1f542',
  THREAD_CLASSIFICATION: '#42c5f5',
  THREAD_ROUTING: '#f5c542',
  WORKER_COMPLETE: '#00cc66',
  SYSTEM: '#7a8a6a',
};

function ActivityTicker({ events }: { events: any[] }) {
  const display = events.length > 0 ? events : [
    { id:'s1', type:'SYSTEM', message:'SPRINGFIELD COMMAND CENTER ONLINE' },
    { id:'s2', type:'SYSTEM', message:'ALL STATIONS NOMINAL' },
    { id:'s3', type:'WORKER_COMPLETE', message:'RELAY WORKER ACTIVE' },
    { id:'s4', type:'SYSTEM', message:'NEON BRIDGE POLLING' },
  ];
  const items = [...display, ...display, ...display];
  return (
    <div style={{
      gridArea: 'ticker',
      background: 'rgba(4,6,4,0.98)',
      borderTop: '1px solid rgba(120,140,90,0.3)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      <div style={{
        flexShrink: 0,
        padding: '0 14px',
        borderRight: '1px solid rgba(120,140,90,0.25)',
        fontFamily: FONT_MONO,
        fontSize: 8,
        letterSpacing: '0.2em',
        color: 'var(--amber)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}> PLANT LOG </div>
      <div style={{ position: 'absolute', left: 90, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, rgba(4,6,4,0.95), transparent)', zIndex: 2, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, rgba(4,6,4,0.95), transparent)', zIndex: 2, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', animation: 'tickerScroll 50s linear infinite', whiteSpace: 'nowrap', willChange: 'transform' }}>
        {items.map((ev, i) => {
          const color = EVENT_COLORS[ev.type] || '#6b7280';
          return (
            <span key={`${ev.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em' }}>
              <span style={{ color, fontWeight: 700 }}>{ev.type}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7 }}>◆</span>
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
      <style>{ROOM_VARS}</style>
      <style>{ANIMATION_CSS}</style>
      <style>{`
        * { box-sizing: border-box; }
        .cr-root {
          height: 100vh;
          width: 100%;
          background: var(--plant-bg);
          background-image:
            radial-gradient(ellipse at 50% 0%, rgba(120,140,80,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 100%, rgba(249,115,22,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(59,130,246,0.04) 0%, transparent 50%);
          color: var(--text-bright);
          overflow: hidden;
          position: relative;
        }
        .cr-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.4;
        }
        .cr-scene {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 76px 1fr 1fr 48px;
          grid-template-areas:
            "wall wall"
            "maggie maggie"
            "left-band right-band"
            "ticker ticker";
          height: 100vh;
        }
        .cr-wall { grid-area: wall; }
        .cr-maggie { grid-area: maggie; padding: 10px 20px; display: flex; justify-content: center; }
        .cr-left { grid-area: left-band; display: grid; grid-template-rows: 1fr 1fr; }
        .cr-right { grid-area: right-band; display: grid; grid-template-rows: 1fr 1fr; }
        .cr-ticker { grid-area: ticker; }
        .station-slot {
          padding: 8px 12px;
          border-top: 1px solid rgba(120,140,90,0.12);
        }
        .cr-left .station-slot {
          border-right: 1px solid rgba(120,140,90,0.12);
        }
        @media (max-width: 768px) {
          .cr-root { height: auto; min-height: 100vh; overflow-y: auto; }
          .cr-scene { display: flex; flex-direction: column; height: auto; }
          .cr-wall { min-height: 76px; }
          .cr-maggie { padding: 10px 14px; min-height: 280px; }
          .cr-left, .cr-right { display: flex; flex-direction: column; }
          .station-slot { min-height: 220px; border-right: none !important; }
          .cr-ticker { position: sticky; bottom: 0; z-index: 50; }
        }
      `}</style>
      <div className="cr-root">
        <div className="cr-scene">
          <div className="cr-wall">
            <SystemWall health={systemHealth} lastUpdated={lastUpdated}/>
          </div>
          <div className="cr-maggie">
            <div style={{ width: '100%', maxWidth: 560 }}>
              <AgentStation agent={maggie} isCentral={true}/>
            </div>
          </div>
          <div className="cr-left">
            <div className="station-slot"><AgentStation agent={homer}/></div>
            <div className="station-slot"><AgentStation agent={bart}/></div>
          </div>
          <div className="cr-right">
            <div className="station-slot"><AgentStation agent={marge}/></div>
            <div className="station-slot"><AgentStation agent={lisa}/></div>
          </div>
          <div className="cr-ticker">
            <ActivityTicker events={tickerEvents}/>
          </div>
        </div>
        {error && (
          <div style={{
            position: 'fixed', bottom: 56, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,51,51,0.12)',
            border: '1px solid rgba(255,51,51,0.5)',
            borderRadius: 4, padding: '6px 16px',
            fontFamily: FONT_MONO, fontSize: 10, color: '#ff3333',
            letterSpacing: '0.1em', zIndex: 200,
          }}> ⚠ {error.toUpperCase()} </div>
        )}
      </div>
    </>
  );
}
