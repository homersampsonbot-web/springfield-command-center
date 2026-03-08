"use client";

import React, { useEffect, useMemo, useState } from "react";
import HomerAvatar from "@/components/agents/HomerAvatar";
import MargeAvatar from "@/components/agents/MargeAvatar";
import LisaAvatar from "@/components/agents/LisaAvatar";
import MaggieAvatar from "@/components/agents/MaggieAvatar";
import BartAvatar from "@/components/agents/BartAvatar";

const POLL_INTERVAL = 10000;

type AgentKey = "MARGE" | "MAGGIE" | "LISA" | "HOMER" | "BART";
type AgentState = "idle" | "thinking" | "active" | "failed" | "complete" | "offline" | "rate_limited";

type SystemHealth = {
  agents?: Record<string, string>;
  build?: string;
  counts?: {
    jobs: Array<{ status: string; _count: number }>;
  };
};

export default function ControlRoomScene() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [h, m, j, e] = await Promise.all([
        fetch("/api/system-health").then(r => r.json()),
        fetch("/api/thread/messages?thread=team&limit=20").then(r => r.json()),
        fetch("/api/jobs").then(r => r.json()),
        fetch("/api/maggie/events?limit=20").then(r => r.json()),
      ]);
      setHealth(h);
      setMessages(m);
      setJobs(j);
      setEvents(e);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const agentStates = useMemo(() => {
    const states: Record<AgentKey, AgentState> = {
      MARGE: "idle", MAGGIE: "idle", LISA: "idle", HOMER: "idle", BART: "idle"
    };
    if (!health) return states;

    const keys: AgentKey[] = ["MARGE", "MAGGIE", "LISA", "HOMER", "BART"];
    keys.forEach(k => {
      const h = health.agents?.[k.toLowerCase()] || health.agents?.[k];
      if (h === "offline") states[k] = "offline";
      else if (h === "degraded") states[k] = "failed";

      const hasActiveJob = jobs.some(j => j.owner === k && ["CLAIMED", "IN_PROGRESS"].includes(j.status));
      if (hasActiveJob) states[k] = "active";

      const lastMsg = [...messages].reverse().find(m => m.payload?.participant === k);
      if (lastMsg?.message?.includes("Thinking")) states[k] = "thinking";
    });

    return states;
  }, [health, jobs, messages]);

  const activeJobsCount = health?.counts?.jobs?.find(c => c.status === "CLAIMED")?._count || 0;
  const doneJobsCount = health?.counts?.jobs?.find(c => c.status === "DONE")?._count || 0;

  return (
    <div className="control-room-container">
      <div className="control-room-shell"></div>
      <div className="room-floor"></div>

      <div className="control-room-scene">
        {/* System Wall */}
        <div className="system-wall">
          <div className="wall-title">SYSTEM METRICS</div>
          <div className="metrics-grid">
            <div className="metric">
              <div className="label">ACTIVE JOBS</div>
              <div className="value">{activeJobsCount}</div>
            </div>
            <div className="metric">
              <div className="label">COMPLETED</div>
              <div className="value">{doneJobsCount}</div>
            </div>
            <div className="metric">
              <div className="label">STATUS</div>
              <div className="value" style={{ color: '#7ED321' }}>NOMINAL</div>
            </div>
            <div className="metric">
              <div className="label">BUILD</div>
              <div className="value" style={{ fontSize: '9px' }}>{health?.build?.slice(0, 8) || "..."}</div>
            </div>
          </div>
        </div>

        {/* Maggie Hub */}
        <div className="maggie-hub-zone">
          <AgentWorkstation agent="MAGGIE" state={agentStates.MAGGIE} />
        </div>

        {/* Row 1: Homer / Marge */}
        <div className="homer-zone">
          <AgentWorkstation agent="HOMER" state={agentStates.HOMER} />
        </div>
        <div className="marge-zone">
          <AgentWorkstation agent="MARGE" state={agentStates.MARGE} />
        </div>

        {/* Row 2: Bart / Lisa */}
        <div className="bart-zone">
          <AgentWorkstation agent="BART" state={agentStates.BART} />
        </div>
        <div className="lisa-zone">
          <AgentWorkstation agent="LISA" state={agentStates.LISA} />
        </div>

        {/* Event Ticker */}
        <div className="ticker-zone">
          <div className="ticker-label">EVENTS</div>
          <div className="ticker-content">
            {events.map(e => (
              <span key={e.id} className="ticker-item">[{e.type}] {e.message} • </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .control-room-container {
          position: relative;
          width: 100%;
          min-height: calc(100vh - 64px);
          background: #080810;
          overflow-x: hidden;
        }
        .control-room-scene {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 120px 220px 240px 240px 64px;
          grid-template-areas:
            "wall wall"
            "maggie maggie"
            "homer marge"
            "bart lisa"
            "ticker ticker";
          gap: 16px;
          padding: 16px;
          position: relative;
          z-index: 2;
        }
        .system-wall { 
          grid-area: wall; 
          background: rgba(15, 15, 30, 0.8);
          border: 1px solid rgba(255, 217, 15, 0.2);
          border-radius: 12px;
          padding: 12px;
        }
        .wall-title { 
          font-family: 'Permanent Marker', cursive; 
          color: #FFD90F; 
          font-size: 14px; 
          margin-bottom: 8px; 
        }
        .metrics-grid { display: flex; justify-content: space-around; }
        .metric { text-align: center; }
        .metric .label { font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 2px; }
        .metric .value { font-size: 18px; font-weight: bold; color: #fff; font-family: monospace; }
        
        .maggie-hub-zone { grid-area: maggie; display: flex; justify-content: center; }
        .homer-zone { grid-area: homer; display: flex; justify-content: center; }
        .marge-zone { grid-area: marge; display: flex; justify-content: center; }
        .bart-zone { grid-area: bart; display: flex; justify-content: center; }
        .lisa-zone { grid-area: lisa; display: flex; justify-content: center; }
        
        .ticker-zone {
          grid-area: ticker;
          background: rgba(0,0,0,0.6);
          border-top: 1px solid rgba(255,217,15,0.2);
          display: flex;
          align-items: center;
          padding: 0 16px;
          overflow: hidden;
        }
        .ticker-label { 
          background: #FFD90F; color: #000; font-weight: 900; font-size: 10px; 
          padding: 2px 6px; border-radius: 4px; margin-right: 12px;
        }
        .ticker-content {
          white-space: nowrap;
          font-family: monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.7);
          animation: tickerScroll 30s linear infinite;
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 800px) {
          .control-room-scene {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            grid-template-areas: "wall" "maggie" "homer" "marge" "bart" "lisa" "ticker";
          }
        }
      `}</style>
    </div>
  );
}

function AgentWorkstation({ agent, state }: { agent: AgentKey; state: AgentState }) {
  const avatars = {
    HOMER: HomerAvatar,
    MARGE: MargeAvatar,
    LISA: LisaAvatar,
    BART: BartAvatar,
    MAGGIE: MaggieAvatar
  };
  const AvatarComponent = avatars[agent];

  return (
    <div className="workstation">
      <AvatarComponent state={state} size={180} />
      <div className="label-overlay">
        <div className="agent-name">{agent}</div>
        <div className={`state-badge ${state}`}>{state.toUpperCase()}</div>
      </div>
      <style jsx>{`
        .workstation {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px;
        }
        .label-overlay {
          margin-top: -10px;
          text-align: center;
          z-index: 5;
        }
        .agent-name {
          font-family: 'Permanent Marker', cursive;
          color: #fff;
          font-size: 14px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .state-badge {
          font-size: 8px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          margin-top: 4px;
          display: inline-block;
        }
        .state-active { color: #7ED321; border-color: #7ED321; }
        .state-thinking { color: #FFD90F; border-color: #FFD90F; }
        .state-failed { color: #FF4444; border-color: #FF4444; }
      `}</style>
    </div>
  );
}
