'use client';
import React from 'react';

export default function JarvisConsole({ lines }: { lines: { ts: string; level: string; message: string }[] }) {
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'var(--jarvis-text-dim)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>[{l.ts}]</span>
          <span style={{
            color: l.level === 'SUCCESS' ? '#7ED321' : l.level === 'ERROR' ? '#FF4444' : l.level === 'WARN' ? '#FFD90F' : '#4A90D9',
            minWidth: 60,
            fontWeight: 700
          }}>{l.level}</span>
          <span>{l.message}</span>
        </div>
      ))}
    </div>
  );
}
