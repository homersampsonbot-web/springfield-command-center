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
  amber: '#f5c518',
  orange: '#e85c00',
  green: '#00e87a',
  red: '#ff3322',
};

const EV_COLORS: Record<string, string> = {
  THREAD_MESSAGE: '#42d9f5',
  JOB_CREATED: C.orange,
  JOB_COMPLETED: C.green,
  JOB_FAILED: C.red,
  RELAY_REQUEST: '#c542f5',
  THREAD_CHECKPOINT: '#f5a142',
  DIRECTIVE_RECEIVED: '#42d9f5',
  THREAD_CLASSIFICATION: '#42c5f5',
  THREAD_ROUTING: '#f5c542',
  WORKER_COMPLETE: '#00cc66',
  SYSTEM: '#7a8a6a',
};

function HazardStripe({ width = 120, height = 10, colors = ['#e85c00', '#111'], rotate = 0 }: { width?: number; height?: number; colors?: [string, string]; rotate?: number }) {
  return (
    <svg width={width} height={height} style={{ display:'block', transform: `rotate(${rotate}deg)` }}>
      <defs>
        <pattern id={`hz-${width}-${height}-${rotate}`} x="0" y="0" width="20" height={height} patternUnits="userSpaceOnUse">
          <rect width="10" height={height} fill={colors[0]} />
          <rect x="10" width="10" height={height} fill={colors[1]} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#hz-${width}-${height}-${rotate})`} opacity="0.85" />
    </svg>
  );
}

function FloorPerspective() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, background: C.floor }}>
      <div style={{ position:'absolute', inset:0, backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 40%), repeating-linear-gradient(90deg, ${C.floor} 0, ${C.floor} 79px, ${C.floorLine} 79px, ${C.floorLine} 80px), repeating-linear-gradient(0deg, ${C.floor} 0, ${C.floor} 39px, ${C.floorLine} 39px, ${C.floorLine} 40px)` }} />
      <div className="floor-shimmer" style={{ position:'absolute', inset:0, opacity:0.2, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
    </div>
  );
}

function BackWall() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:1, background: C.wall }}>
      <div style={{ position:'absolute', inset:0, backgroundImage: `repeating-linear-gradient(0deg, ${C.wallPanel} 0px, ${C.wallPanel} 2px, transparent 2px, transparent 18px)` }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:6, background:'#4e6b86' }} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:14, background:'#2b3f55' }} />
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:14, background:'#2b3f55' }} />
      <div style={{ position:'absolute', top:210, left:0, right:0, height:4, background: C.orange }} />
    </div>
  );
}

function RearDoor() {
  return (
    <div style={{ position:'absolute', top:38, left:'50%', transform:'translateX(-50%)', width:240, height:130, zIndex:1 }}>
      <div style={{ position:'absolute', inset:0, background:'#7f93a7', border:'3px solid #4e6b86', borderRadius:6 }} />
      <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width:64, height:64, borderRadius:'50%', border:'4px solid #d24a4a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        ☢️
      </div>
      <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)' }}>
        <HazardStripe width={170} height={14} colors={[C.orange, '#111']} />
      </div>
    </div>
  );
}

function SystemMonitorLeft() {
  return (
    <div style={{ position:'absolute', top:30, left:40, width:180, height:120, background:'#0b0f10', border:'3px solid #1c2d3a', borderRadius:6, zIndex:2 }}>
      <div className="monitor-lines" style={{ padding:10, display:'flex', flexDirection:'column', gap:6 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height:4, background:'#34d399', opacity:0.25 + i * 0.08 }} />
        ))}
      </div>
    </div>
  );
}

function SystemMonitorRight() {
  return (
    <div style={{ position:'absolute', top:30, right:40, width:180, height:120, background:'#0b0f10', border:'3px solid #1c2d3a', borderRadius:6, zIndex:2 }}>
      <div style={{ display:'flex', gap:8, padding:10 }}>
        {['#34d399', '#f59e0b', '#ef4444', '#a855f7'].map((col, i) => (
          <div key={i} style={{ width:26, height:26, borderRadius:6, border:`2px solid ${col}`, boxShadow:`0 0 8px ${col}55` }} />
        ))}
      </div>
    </div>
  );
}

function RadiationWallSymbols() {
  return (
    <>
      <div style={{ position:'absolute', left:24, top:70, fontSize:34, color:'#c43b3b', zIndex:2 }}>☢</div>
      <div style={{ position:'absolute', right:24, top:70, fontSize:34, color:'#c43b3b', zIndex:2 }}>☢</div>
      <div style={{ position:'absolute', left:10, top:10, width:10, height:180, background:`repeating-linear-gradient(180deg, ${C.orange} 0 10px, #111 10px 20px)` }} />
      <div style={{ position:'absolute', right:10, top:10, width:10, height:180, background:`repeating-linear-gradient(180deg, ${C.orange} 0 10px, #111 10px 20px)` }} />
    </>
  );
}

function DeskConsole({ width = 180, height = 70, color = C.console, label, right = false }: { width?: number; height?: number; color?: string; label?: string; right?: boolean }) {
  return (
    <div style={{ position:'relative', width, height, background: color, border:'2px solid #3b2c4e', borderRadius:10, boxShadow:'0 4px 0 #2b2038', zIndex:3 }}>
      <div style={{ position:'absolute', top:8, left:10, right:10, height:22, background:'#161316', borderRadius:6, border:'1px solid #2a2330' }} />
      <div style={{ position:'absolute', top:38, left:10, display:'flex', gap:6 }}>
        {[C.green, C.orange, '#f472b6', '#8b5cf6'].map((col, i) => (
          <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: col, boxShadow:`0 0 6px ${col}99` }} />
        ))}
      </div>
      {label && (
        <div style={{ position:'absolute', bottom:6, right:10, fontFamily: FONT, fontSize:8, color:'#1f1b27', opacity:0.75 }}>
          {label}
        </div>
      )}
      {right && (
        <div style={{ position:'absolute', right:-24, top:10, width:18, height:50, background:'#2b2038', borderRadius:4 }} />
      )}
    </div>
  );
}

function Station({
  id,
  label,
  state,
  lastMessage,
  Avatar,
  color,
  consoleLabel,
  scale = 1,
  align = 'center',
}: {
  id: 'homer'|'marge'|'lisa'|'bart'|'maggie';
  label: string;
  state: AgentState;
  lastMessage: string;
  Avatar: any;
  color: string;
  consoleLabel: string;
  scale?: number;
  align?: 'center'|'left'|'right';
}) {
  const stateColor = STATE_COLORS[state];
  const isMaggie = id === 'maggie';
  const consoleW = isMaggie ? 190 : 160;
  const consoleH = isMaggie ? 82 : 64;
  const avatarSize = isMaggie ? 120 : 88;
  return (
    <div
      className={`station ${ANIMATION_CLASSES[state]}`}
      style={{ position:'relative', width: isMaggie ? 220 : 200, height: isMaggie ? 220 : 200, transform:`scale(${scale})`, transformOrigin:'center' }}
    >
      {lastMessage && (
        <div className="bubble" style={{ position:'absolute', bottom: 150, left:'50%', transform:'translateX(-50%)' }}>
          <div style={{ background:'#fff', border:`2px solid ${color}`, borderRadius:10, padding:'4px 8px', fontSize:9, color:'#111', maxWidth:150, textAlign:'center' }}>
            {lastMessage.slice(0, 40)}
          </div>
        </div>
      )}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)' }}>
        <DeskConsole width={consoleW} height={consoleH} color={C.console} label={consoleLabel} right={id==='lisa'} />
      </div>
      <div style={{ position:'absolute', bottom: 56, left:'50%', transform:'translateX(-50%)', zIndex:4 }}>
        <Avatar state={state} size={avatarSize} />
      </div>
      <div style={{ position:'absolute', bottom: 30, left:'50%', transform:'translateX(-50%)', fontFamily: FONT, fontSize:8, letterSpacing:'0.2em', color:'#1f1b27' }}>
        {label}
      </div>
      <div style={{ position:'absolute', bottom: 18, left:'50%', transform:'translateX(-50%)', width:70, height:6, borderRadius:3, background: stateColor, opacity:0.7, boxShadow:`0 0 6px ${stateColor}` }} />
    </div>
  );
}

function ConnectionLines() {
  return (
    <svg style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pulse" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0" />
          <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[
        { x1: 50, y1: 56, x2: 18, y2: 40 },
        { x1: 50, y1: 56, x2: 82, y2: 40 },
        { x1: 50, y1: 56, x2: 28, y2: 63 },
        { x1: 50, y1: 56, x2: 72, y2: 63 },
      ].map((l, i) => (
        <g key={i}>
          <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#d27bff" strokeDasharray="2 3" strokeWidth="0.4" opacity="0.7" />
          <line className="line-pulse" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="url(#pulse)" strokeWidth="0.6" />
        </g>
      ))}
    </svg>
  );
}

function PlantLog({ events }: { events: any[] }) {
  const display = events.length > 0 ? events : [
    { id:'s1', type:'SYSTEM' }, { id:'s2', type:'WORKER_COMPLETE' }, { id:'s3', type:'JOB_COMPLETED' },
  ];
  const items = [...display, ...display, ...display];
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:44, background:'rgba(4,6,4,0.97)', borderTop:`1px solid ${C.orange}`, display:'flex', alignItems:'center', overflow:'hidden', zIndex:6 }}>
      <div style={{ flexShrink:0, width:90, height:'100%', background:'rgba(0,0,0,0.5)', borderRight:'1px solid rgba(120,140,90,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:2 }}>
        <div style={{ fontFamily:FONT, fontSize:6, letterSpacing:'0.2em', color:C.orange }}>PLANT LOG</div>
        <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, boxShadow:`0 0 6px ${C.green}`, animation:'indicatorPulse 2s ease-in-out infinite' }} />
      </div>
      <div style={{ display:'flex', animation:'tickerScroll 40s linear infinite', whiteSpace:'nowrap', willChange:'transform', paddingLeft:100 }}>
        {items.map((ev, i) => {
          const color = EV_COLORS[ev.type] || '#6b7280';
          return (
            <span key={`${ev.id}-${i}`} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'0 18px', fontFamily:FONT, fontSize:10, letterSpacing:'0.1em', color }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: color }} />
              {ev.type.replace('_',' ')}
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
        .cr-scene-root { width: 100vw; height: 100vh; position: relative; overflow: hidden; background:${C.wall}; }
        .monitor-lines { animation: monitorScroll 3s linear infinite; }
        .floor-shimmer { animation: floorShimmer 6s linear infinite; }
        .line-pulse { animation: linePulse 2.5s ease-in-out infinite; }
        .station { transition: transform 0.2s ease; }
        @keyframes monitorScroll { 0%{transform:translateY(0);} 100%{transform:translateY(-10px);} }
        @keyframes floorShimmer { 0%{transform:translateX(-20%);} 100%{transform:translateX(20%);} }
        @keyframes linePulse { 0%{stroke-dashoffset:0; opacity:0.2;} 50%{opacity:0.9;} 100%{stroke-dashoffset:10; opacity:0.2;} }
      `}</style>
      <div className="cr-scene-root">
        <FloorPerspective />
        <BackWall />
        <RadiationWallSymbols />
        <SystemMonitorLeft />
        <SystemMonitorRight />
        <RearDoor />

        <div style={{ position:'absolute', inset:0, zIndex:3 }}>
          <div style={{ position:'absolute', left:'50%', top:'56%', transform:'translate(-50%, -50%)' }}>
            <Station id="maggie" label="MAGGIE" state={maggie.state} lastMessage={maggie.lastMessage} Avatar={MaggieAvatar} color="#ec4899" consoleLabel="ORCH" scale={1.18} />
          </div>
          <div style={{ position:'absolute', left:'18%', top:'38%' }}>
            <Station id="homer" label="HOMER" state={homer.state} lastMessage={homer.lastMessage} Avatar={HomerAvatar} color="#f97316" consoleLabel="EXEC" scale={1.0} align="left" />
          </div>
          <div style={{ position:'absolute', left:'82%', top:'38%', transform:'translate(-100%, 0)' }}>
            <Station id="marge" label="MARGE" state={marge.state} lastMessage={marge.lastMessage} Avatar={MargeAvatar} color="#3b82f6" consoleLabel="ARCH" scale={1.05} align="right" />
          </div>
          <div style={{ position:'absolute', left:'28%', top:'66%' }}>
            <Station id="bart" label="BART" state={bart.state} lastMessage={bart.lastMessage} Avatar={BartAvatar} color="#22c55e" consoleLabel="QA" scale={0.95} align="left" />
          </div>
          <div style={{ position:'absolute', left:'72%', top:'66%' }}>
            <Station id="lisa" label="LISA" state={lisa.state} lastMessage={lisa.lastMessage} Avatar={LisaAvatar} color="#a855f7" consoleLabel="STRAT" scale={1.05} align="right" />
          </div>
        </div>

        <ConnectionLines />
        <PlantLog events={tickerEvents} />
        {error && (
          <div style={{ position:'fixed', bottom:52, left:'50%', transform:'translateX(-50%)', background:'rgba(255,51,51,0.12)', border:'2px solid rgba(255,51,51,0.5)', borderRadius:4, padding:'5px 14px', fontFamily:FONT, fontSize:10, color:C.red, letterSpacing:'0.1em', zIndex:300 }}>
            ⚠ COMMS FAULT
          </div>
        )}
      </div>
    </>
  );
}
