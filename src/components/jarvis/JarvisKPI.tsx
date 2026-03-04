'use client';
import React from 'react';

export default function JarvisKPI({ label, value, status }: { label: string; value: string; status?: 'ok'|'warn'|'bad'|'idle' }) {
  const color = status === 'ok' ? '#7ED321' : status === 'warn' ? '#FFD90F' : status === 'bad' ? '#FF4444' : '#4A90D9';
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <span style={{ fontSize: 10, color: 'var(--jarvis-text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
