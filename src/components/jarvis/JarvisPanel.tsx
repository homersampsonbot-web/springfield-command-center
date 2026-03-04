'use client';
import React from 'react';

export default function JarvisPanel({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--jarvis-panel)',
      border: '1px solid var(--jarvis-stroke)',
      borderRadius: 14,
      boxShadow: '0 0 20px var(--jarvis-glow)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {title && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,217,15,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'Permanent Marker',
          color: '#FFD90F',
          letterSpacing: '0.05em'
        }}>
          <span>{title}</span>
          {actions}
        </div>
      )}
      <div style={{ padding: 16, flex: 1 }}>{children}</div>
    </div>
  );
}
