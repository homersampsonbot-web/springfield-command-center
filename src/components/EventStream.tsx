'use client';

import React from 'react';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

const placeholderEvents: Event[] = [
  { id: '1', type: 'INFO', message: 'Mission Control system initialized', timestamp: '22:15' },
  { id: '2', type: 'WARN', message: 'Homer resource usage peaked at 85%', timestamp: '22:10' },
  { id: '3', type: 'INFO', message: 'Bart confirmed UI parity on preview', timestamp: '21:55' },
  { id: '4', type: 'SUCCESS', message: 'Deployment promoted to production', timestamp: '21:40' },
  { id: '5', type: 'INFO', message: 'Lisa strategic pivot completed', timestamp: '21:30' },
];

export default function EventStream() {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: 12,
      border: '1px solid rgba(255,217,15,0.1)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,217,15,0.1)',
        fontFamily: 'Permanent Marker',
        fontSize: 14,
        color: '#FFD90F',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD90F', boxShadow: '0 0 5px #FFD90F' }}></span>
        EVENT STREAM
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px',
        fontFamily: 'monospace',
        fontSize: 11
      }}>
        {placeholderEvents.map(event => (
          <div key={event.id} style={{
            padding: '6px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            gap: 12
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{event.timestamp}]</span>
            <span style={{ 
              color: event.type === 'SUCCESS' ? '#7ED321' : event.type === 'WARN' ? '#FF4444' : '#4A90D9',
              fontWeight: 700,
              minWidth: 50
            }}>
              {event.type}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
