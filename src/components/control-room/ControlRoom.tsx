'use client';

import React, { useEffect, useState } from 'react';
import { useControlRoomData } from './useControlRoomData';
import { AgentStation } from './AgentStation';
import { SystemWall } from './SystemWall';
import { ActivityTicker } from './ActivityTicker';
import { ANIMATION_CSS } from './animations';

export default function ControlRoom() {
  const { agents, systemHealth, tickerEvents, lastUpdated, error } = useControlRoomData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maggie = agents.find(a => a.id === 'maggie')!;
  const homer = agents.find(a => a.id === 'homer')!;
  const marge = agents.find(a => a.id === 'marge')!;
  const lisa = agents.find(a => a.id === 'lisa')!;
  const bart = agents.find(a => a.id === 'bart')!;

  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        .control-room-root {
          min-height: 100vh;
          background: #0a0a0f;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 80%, rgba(245,200,66,0.04) 0%, transparent 60%);
          color: white;
          overflow: hidden;
        }

        /* Desktop: CSS grid scene */
        .room-scene {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 80px 200px 230px 230px 56px;
          grid-template-areas:
            "wall wall"
            "maggie maggie"
            "homer marge"
            "bart lisa"
            "ticker ticker";
          height: 100vh;
          gap: 0;
        }

        .zone-maggie { grid-area: maggie; padding: 12px 24px; }
        .zone-homer  { grid-area: homer;  padding: 12px 14px 12px 24px; }
        .zone-marge  { grid-area: marge;  padding: 12px 24px 12px 14px; }
        .zone-bart   { grid-area: bart;   padding: 12px 14px 12px 24px; }
        .zone-lisa   { grid-area: lisa;   padding: 12px 24px 12px 14px; }

        /* Floor divider lines */
        .zone-homer, .zone-marge {
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .zone-bart, .zone-lisa {
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .zone-homer, .zone-bart {
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        /* Mobile: vertical scroll */
        @media (max-width: 768px) {
          .room-scene {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .zone-maggie, .zone-homer, .zone-marge, .zone-bart, .zone-lisa {
            padding: 12px 16px;
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            min-height: 200px;
          }
          .zone-ticker {
            position: sticky;
            bottom: 0;
          }
        }
      `}</style>

      <div className="control-room-root">
        {/* Scanline overlay */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          pointerEvents: 'none',
          zIndex: 100,
        }} />

        <div className="room-scene">
          {/* SYSTEM WALL */}
          <SystemWall health={systemHealth} lastUpdated={lastUpdated} />

          {/* MAGGIE — Central orchestrator hub */}
          <div className="zone-maggie" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <AgentStation agent={maggie} isCentral={true} />
            </div>
          </div>

          {/* HOMER — Left execution terminal */}
          <div className="zone-homer">
            <AgentStation agent={homer} />
          </div>

          {/* MARGE — Right architecture desk */}
          <div className="zone-marge">
            <AgentStation agent={marge} />
          </div>

          {/* BART — Left QA station */}
          <div className="zone-bart">
            <AgentStation agent={bart} />
          </div>

          {/* LISA — Right strategy board */}
          <div className="zone-lisa">
            <AgentStation agent={lisa} />
          </div>

          {/* ACTIVITY TICKER */}
          <ActivityTicker events={tickerEvents} />
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            position: 'fixed', bottom: '64px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(245,66,66,0.15)',
            border: '1px solid rgba(245,66,66,0.5)',
            borderRadius: '6px',
            padding: '8px 20px',
            fontFamily: '"Courier New", monospace',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#f54242',
            zIndex: 200,
          }}>
            ⚠ {error} — retrying
          </div>
        )}
      </div>
    </>
  );
}
