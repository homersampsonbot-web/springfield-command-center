'use client';

import React from 'react';
import { TickerEvent } from './useControlRoomData';

const EVENT_COLORS: Record<string, string> = {
  THREAD_MESSAGE: '#42d9f5',
  JOB_CREATED: '#f5c842',
  JOB_COMPLETED: '#42f57e',
  JOB_FAILED: '#f54242',
  RELAY_REQUEST: '#c542f5',
  THREAD_CHECKPOINT: '#f5a142',
  DIRECTIVE_RECEIVED: '#42d9f5',
  DEBATE_CREATED: '#f542a1',
  GOVERNANCE_PROTOCOL: '#a1f542',
  THREAD_CLASSIFICATION: '#42c5f5',
  THREAD_ROUTING: '#f5c542',
};

interface ActivityTickerProps {
  events: TickerEvent[];
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({ events }) => {
  const displayEvents = events.length > 0 ? events : [
    { id: '1', type: 'SYSTEM', message: 'SPRINGFIELD COMMAND CENTER ONLINE', timestamp: new Date().toISOString() },
    { id: '2', type: 'SYSTEM', message: 'ALL STATIONS NOMINAL', timestamp: new Date().toISOString() },
  ];

  const items = [...displayEvents, ...displayEvents]; // duplicate for seamless loop

  return (
    <div style={{
      gridArea: 'ticker',
      background: 'rgba(0,0,0,0.6)',
      borderTop: '1px solid rgba(245,200,66,0.3)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(to right, #0a0a0f, transparent)',
        zIndex: 2,
      }} />
      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
        background: 'linear-gradient(to left, #0a0a0f, transparent)',
        zIndex: 2,
      }} />

      <div style={{
        display: 'flex',
        gap: '0',
        animation: 'tickerScroll 60s linear infinite',
        whiteSpace: 'nowrap',
        willChange: 'transform',
      }}>
        {items.map((event, i) => {
          const color = EVENT_COLORS[event.type] || '#6b7280';
          return (
            <span key={`${event.id}-${i}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 24px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              letterSpacing: '0.12em',
            }}>
              <span style={{ color, fontWeight: 700 }}>{event.type}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '8px' }}>◆</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
