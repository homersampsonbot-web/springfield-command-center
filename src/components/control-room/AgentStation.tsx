'use client';

import React from 'react';
import { AgentData } from './useControlRoomData';
import { ANIMATION_CLASSES, STATE_COLORS, STATE_LABELS } from './animations';
import { HomerAvatar } from './agents/HomerAvatar';
import { MargeAvatar } from './agents/MargeAvatar';
import { LisaAvatar } from './agents/LisaAvatar';
import { BartAvatar } from './agents/BartAvatar';
import { MaggieAvatar } from './agents/MaggieAvatar';

const AVATAR_MAP = {
  homer: HomerAvatar,
  marge: MargeAvatar,
  lisa: LisaAvatar,
  bart: BartAvatar,
  maggie: MaggieAvatar,
};

const STATION_THEMES: Record<string, { label: string; icon: string; borderColor: string }> = {
  homer: { label: 'EXECUTION TERMINAL', icon: '⚙', borderColor: 'rgba(249,115,22,0.4)' },
  marge: { label: 'ARCHITECTURE DESK', icon: '◈', borderColor: 'rgba(59,130,246,0.4)' },
  lisa: { label: 'STRATEGY BOARD', icon: '◇', borderColor: 'rgba(168,85,247,0.4)' },
  bart: { label: 'QA STATION', icon: '▣', borderColor: 'rgba(34,197,94,0.4)' },
  maggie: { label: 'ORCHESTRATOR HUB', icon: '✦', borderColor: 'rgba(236,72,153,0.4)' },
};

interface AgentStationProps {
  agent: AgentData;
  isCentral?: boolean;
}

export const AgentStation: React.FC<AgentStationProps> = ({ agent, isCentral = false }) => {
  const AvatarComponent = AVATAR_MAP[agent.id];
  const theme = STATION_THEMES[agent.id];
  const stateClass = ANIMATION_CLASSES[agent.state];
  const stateColor = STATE_COLORS[agent.state];
  const avatarSize = isCentral ? 120 : 80;

  return (
    <div
      className={stateClass}
      style={{
        animation: 'stationEntrance 0.6s ease-out forwards',
        height: '100%',
      }}
    >
      <div
        className="station-card"
        style={{
          height: '100%',
          background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(20,20,35,0.9) 100%)',
          border: `1px solid ${theme.borderColor}`,
          borderRadius: isCentral ? '16px' : '12px',
          padding: isCentral ? '20px' : '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          cursor: 'default',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Corner grid decoration */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }} />

        {/* Station label */}
        <div style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          alignSelf: 'flex-start',
        }}>
          {theme.icon} {theme.label}
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AvatarComponent state={agent.state} size={avatarSize} />
        </div>

        {/* Agent name */}
        <div style={{
          fontFamily: '"Courier New", monospace',
          fontSize: isCentral ? '15px' : '12px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.9)',
          textTransform: 'uppercase',
        }}>
          {agent.name}
        </div>

        {/* State badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: `rgba(${hexToRgb(stateColor)}, 0.12)`,
          border: `1px solid rgba(${hexToRgb(stateColor)}, 0.4)`,
          borderRadius: '4px',
          padding: '3px 10px',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: stateColor,
            boxShadow: `0 0 6px ${stateColor}`,
          }} />
          <span style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            letterSpacing: '0.15em',
            color: stateColor,
            fontWeight: 700,
          }}>
            {STATE_LABELS[agent.state]}
          </span>
        </div>

        {/* Speech bubble */}
        {agent.lastMessage && (
          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            padding: '8px 10px',
            marginTop: 'auto',
          }}>
            <p style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '10px',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.55)',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {agent.lastMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
