"use client";

import React, { useEffect, useMemo, useState } from "react";
import HomerSVG from "@/components/agents/HomerSVG";
import MargeSVG from "@/components/agents/MargeSVG";
import LisaSVG from "@/components/agents/LisaSVG";
import MaggieSVG from "@/components/agents/MaggieSVG";
import BartSVG from "@/components/agents/BartSVG";

const POLL_INTERVAL = 10000; // 10s

type ThreadMessage = {
  id: string;
  message: string;
  createdAt: string;
  payload?: any;
};

type Job = {
  id: string;
  title: string;
  status: string;
  owner: string;
  updatedAt: string;
};

type EventItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type SystemHealth = {
  agents?: Record<string, string>;
  build?: string;
};

const agentOrder = ["MARGE", "MAGGIE", "LISA", "HOMER", "BART"] as const;
type AgentKey = (typeof agentOrder)[number];

const agentLabels: Record<AgentKey, string> = {
  MARGE: "Marge",
  MAGGIE: "Maggie",
  LISA: "Lisa",
  HOMER: "Homer",
  BART: "Bart",
};

const agentRoles: Record<AgentKey, string> = {
  MARGE: "Chief Architect",
  MAGGIE: "Orchestrator",
  LISA: "Strategy",
  HOMER: "Executor",
  BART: "GUI Ops",
};

const agentSVG: Record<AgentKey, React.ComponentType<{ size?: number; state?: string }>> = {
  MARGE: MargeSVG,
  MAGGIE: MaggieSVG,
  LISA: LisaSVG,
  HOMER: HomerSVG,
  BART: BartSVG,
};

type AgentState = "idle" | "thinking" | "active" | "complete" | "failed" | "offline" | "rate_limited";

export default function ControlRoom() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [healthRes, threadRes, jobsRes, eventsRes] = await Promise.all([
        fetch("/api/system-health"),
        fetch("/api/thread/messages?thread=team&limit=50"),
        fetch("/api/jobs"),
        fetch("/api/maggie/events?limit=25"),
      ]);

      if (healthRes.ok) setHealth(await healthRes.json());
      if (threadRes.ok) setMessages(await threadRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      setLastFetched(Date.now());
    } catch (e) {
      console.error("ControlRoom fetch error", e);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const latestMessagesByAgent = useMemo(() => {
    const map: Record<AgentKey, ThreadMessage | null> = {
      MARGE: null,
      MAGGIE: null,
      LISA: null,
      HOMER: null,
      BART: null,
    };
    [...messages].reverse().forEach((msg) => {
      const participant = msg.payload?.participant;
      if (participant && map[participant as AgentKey] === null) {
        map[participant as AgentKey] = msg;
      }
    });
    return map;
  }, [messages]);

  const agentStates = useMemo(() => {
    const byAgent: Record<AgentKey, AgentState> = {
      MARGE: "idle",
      MAGGIE: "idle",
      LISA: "idle",
      HOMER: "idle",
      BART: "idle",
    };

    const now = Date.now();
    const jobByAgent = (agent: AgentKey) =>
      jobs.find((job) => job.owner?.toUpperCase?.() === agent && ["IN_PROGRESS", "CLAIMED", "QA"].includes(job.status));

    agentOrder.forEach((agent) => {
      const healthState = health?.agents?.[agent.toLowerCase()] || health?.agents?.[agent];
      if (healthState === "offline") {
        byAgent[agent] = "offline";
        return;
      }
      if (healthState === "degraded") {
        byAgent[agent] = "failed";
        return;
      }

      const job = jobByAgent(agent);
      if (job) {
        byAgent[agent] = "active";
        return;
      }

      const lastMsg = latestMessagesByAgent[agent];
      if (lastMsg?.message?.includes("Thinking")) {
        byAgent[agent] = "thinking";
        return;
      }

      const createdAt = lastMsg?.createdAt ? new Date(lastMsg.createdAt).getTime() : 0;
      if (now - createdAt < 5 * 60 * 1000 && createdAt > 0) {
        byAgent[agent] = "complete";
        return;
      }

      byAgent[agent] = "idle";
    });

    return byAgent;
  }, [health, jobs, latestMessagesByAgent]);

  const formatBubble = (msg?: ThreadMessage | null) => {
    if (!msg?.message) return null;
    const clean = msg.message.replace(/\[.*?\]/g, '').trim();
    return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean;
  };

  return (
    <div className="room-container">
      {/* Header Overlay */}
      <div className="room-header">
        <div className="room-title">
          <h1>Command Center</h1>
          <div className="room-subtitle">Family Operational Unit · Shared Workspace</div>
        </div>
        <div className="room-meta">
          <span>Build: {health?.build || "—"}</span>
          <span>Last Poll: {lastFetched ? new Date(lastFetched).toLocaleTimeString() : "—"}</span>
        </div>
      </div>

      {/* Main Room Scene */}
      <div className="room-scene">
        {/* Maggie Hub - Center Top */}
        <div className="station maggie-hub">
          <AgentStation agent="MAGGIE" state={agentStates.MAGGIE} message={formatBubble(latestMessagesByAgent.MAGGIE)} />
        </div>

        {/* Left Side: Homer and Bart */}
        <div className="station homer-exec">
          <AgentStation agent="HOMER" state={agentStates.HOMER} message={formatBubble(latestMessagesByAgent.HOMER)} />
        </div>
        <div className="station bart-qa">
          <AgentStation agent="BART" state={agentStates.BART} message={formatBubble(latestMessagesByAgent.BART)} />
        </div>

        {/* Right Side: Marge and Lisa */}
        <div className="station marge-arch">
          <AgentStation agent="MARGE" state={agentStates.MARGE} message={formatBubble(latestMessagesByAgent.MARGE)} />
        </div>
        <div className="station lisa-strat">
          <AgentStation agent="LISA" state={agentStates.LISA} message={formatBubble(latestMessagesByAgent.LISA)} />
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="event-ticker">
        <div className="ticker-label">LIVE FEED</div>
        <div className="ticker-scroll">
          {events.map((ev) => (
            <div key={ev.id} className="ticker-item">
              <span className="ev-time">{new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="ev-type">{ev.type}</span>
              <span className="ev-msg">{ev.message}</span>
            </div>
          ))}
          {events.length === 0 && <span className="ticker-empty">Waiting for events...</span>}
        </div>
      </div>

      <style jsx>{`
        .room-container {
          height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
          background: #080810;
          color: #fff;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          z-index: 10;
        }

        .room-title h1 {
          font-family: 'Permanent Marker', cursive;
          color: #FFD90F;
          font-size: 32px;
          line-height: 1;
          margin-bottom: 4px;
          text-shadow: 0 0 10px rgba(255, 217, 15, 0.3);
        }

        .room-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.05em;
        }

        .room-meta {
          text-align: right;
          font-family: monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .room-scene {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 24px;
          grid-template-areas:
            "homer maggie marge"
            "bart maggie lisa";
          padding-bottom: 80px; /* Room for ticker */
        }

        .station {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .maggie-hub { grid-area: maggie; }
        .homer-exec { grid-area: homer; }
        .bart-qa { grid-area: bart; }
        .marge-arch { grid-area: marge; }
        .lisa-strat { grid-area: lisa; }

        .event-ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255,217,15,0.3);
          display: flex;
          align-items: center;
          padding: 0 20px;
          z-index: 20;
        }

        .ticker-label {
          background: #FFD90F;
          color: #000;
          font-weight: 900;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          margin-right: 20px;
          white-space: nowrap;
        }

        .ticker-scroll {
          display: flex;
          gap: 30px;
          overflow-x: auto;
          scrollbar-width: none;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          font-family: monospace;
          font-size: 12px;
        }

        .ev-time { color: rgba(255,255,255,0.3); }
        .ev-type { color: #FFD90F; font-weight: 600; }
        .ev-msg { color: rgba(255,255,255,0.8); }

        @media (max-width: 1000px) {
          .room-scene {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            grid-template-areas:
              "maggie"
              "homer"
              "marge"
              "bart"
              "lisa";
            overflow-y: auto;
            padding-bottom: 100px;
          }
          .room-container { height: auto; min-height: 100vh; }
          .event-ticker { position: fixed; }
        }
      `}</style>
    </div>
  );
}

function AgentStation({ agent, state, message }: { agent: AgentKey; state: AgentState; message: string | null }) {
  const Svg = agentSVG[agent];

  return (
    <div className={`station-container state-${state}`}>
      {/* Speech Bubble */}
      <div className={`bubble ${message ? 'show' : ''}`}>
        {message}
      </div>

      <div className="agent-wrap">
        <Svg size={200} state={state} />
      </div>

      <div className="station-floor"></div>

      <div className="station-info">
        <div className="agent-name">{agentLabels[agent]}</div>
        <div className="agent-role">{agentRoles[agent]}</div>
        <div className="state-pill">{state.toUpperCase()}</div>
      </div>

      <style jsx>{`
        .station-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.5s ease;
          width: 100%;
        }

        .agent-wrap {
          position: relative;
          z-index: 2;
          animation: idleBreathing 4s ease-in-out infinite;
        }

        .station-floor {
          width: 160px;
          height: 40px;
          background: radial-gradient(ellipse at center, rgba(255,217,15,0.1) 0%, transparent 70%);
          border-radius: 50%;
          margin-top: -30px;
          z-index: 1;
          transition: background 0.5s;
        }

        .station-info {
          text-align: center;
          margin-top: 15px;
          z-index: 2;
        }

        .agent-name {
          font-weight: 700;
          font-size: 18px;
          color: #fff;
        }

        .agent-role {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }

        .state-pill {
          display: inline-block;
          font-size: 9px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .bubble {
          position: absolute;
          top: -40px;
          background: rgba(255,255,255,0.95);
          color: #000;
          padding: 10px 14px;
          border-radius: 18px;
          border-bottom-left-radius: 2px;
          font-size: 12px;
          max-width: 180px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 10;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          pointer-events: none;
        }

        .bubble.show {
          opacity: 1;
          transform: translateY(0);
        }

        .bubble::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 10px;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255,255,255,0.95);
        }

        /* Cinematic State Animations */
        .state-thinking .agent-wrap { animation: thinkingPulse 2s ease-in-out infinite; }
        .state-active .agent-wrap { animation: activeGlow 1.5s ease-in-out infinite; }
        .state-complete .agent-wrap { animation: completeFlash 1s ease-in-out; }
        .state-failed .agent-wrap { animation: failedPulse 1s ease-in-out infinite; }

        .state-thinking .station-floor { background: radial-gradient(ellipse at center, rgba(255,217,15,0.3) 0%, transparent 70%); }
        .state-active .station-floor { background: radial-gradient(ellipse at center, rgba(126,211,33,0.4) 0%, transparent 70%); }
        .state-complete .station-floor { background: radial-gradient(ellipse at center, rgba(120,200,255,0.4) 0%, transparent 70%); }
        .state-failed .station-floor { background: radial-gradient(ellipse at center, rgba(255,80,80,0.5) 0%, transparent 70%); }

        @keyframes idleBreathing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes thinkingPulse {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255,217,15,0.3)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 20px rgba(255,217,15,0.6)); transform: scale(1.02); }
        }

        @keyframes activeGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(126,211,33,0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 30px rgba(126,211,33,0.8)); transform: scale(1.05); }
        }

        @keyframes completeFlash {
          0% { filter: brightness(1); }
          50% { filter: brightness(2) drop-shadow(0 0 30px #fff); }
          100% { filter: brightness(1); }
        }

        @keyframes failedPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255,80,80,0.5)); opacity: 1; }
          50% { filter: drop-shadow(0 0 25px rgba(255,80,80,1)); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
