'use client';

import React from 'react';
import { SystemHealth } from './useControlRoomData';

interface SystemWallProps {
  health: SystemHealth;
  lastUpdated: Date | null;
}

const STATUS_COLOR = { healthy: '#42f57e', degraded: '#f5a142', offline: '#f54242' };

export const SystemWall: React.FC<SystemWallProps> = ({ health, lastUpdated }) => {
  const statusColor = STATUS_COLOR[health.status];
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  const metrics = [
    { label: 'ACTIVE JOBS', value: health.activeJobs, color: '#42d9f5' },
    { label: 'QUEUED', value: health.queuedJobs, color: '#f5c842' },
    { label: 'FAILED', value: health.failedJobs, color: '#f54242' },
    { label: 'RELAY QUEUE', value: health.relayQueueDepth, color: '#c542f5' },
  ];

  return (
    <div style={{
      gridArea: 'wall',
      background: 'linear-gradient(180deg, rgba(5,5,10,0.98) 0%, rgba(10,10,20,0.9) 100%)',
      borderBottom: '1px solid rgba(245,200,66,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      gap: '24px',
    }}>
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 10px ${statusColor}`,
          animation: 'glowFlicker 8s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: '#f5c842',
          textTransform: 'uppercase',
        }}>
          Springfield Command Center
        </span>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: statusColor,
          border: `1px solid ${statusColor}`,
          padding: '2px 8px',
          borderRadius: '3px',
        }}>
          {health.status.toUpperCase()}
        </span>
      </div>

      {/* Center: metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '18px',
              fontWeight: 700,
              color: m.color,
              lineHeight: 1,
            }}>
              {m.value}
            </div>
            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '8px',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.3)',
              marginTop: '3px',
            }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Right: clock */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '18px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '0.1em',
        }}>
          {timeStr}
        </div>
        <div style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '8px',
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.3)',
        }}>
          LAST SYNC UTC
        </div>
      </div>
    </div>
  );
};
