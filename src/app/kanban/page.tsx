"use client";

import KanbanBoard from './KanbanBoard';

export default function KanbanPage() {
  const BUILD_STAMP = "v1.2-DND-FIX-HOMER-" + new Date().toISOString().slice(11, 16);
  
  return (
    <main style={{ 
        minHeight: '100vh', background: '#0D0D1A', color: '#fff', 
        padding: 32, display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
            <h1 style={{ fontFamily: 'Permanent Marker', fontSize: 32, color: '#FFD90F', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                🏗️ SPRINGFIELD MISSION CONTROL
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>Live Operations & Job Orchestration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                BUILD: {BUILD_STAMP}
            </div>
            <a href="/" style={{ fontSize: 11, fontFamily: 'Permanent Marker', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                ← BACK TO PODIUM
            </a>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <KanbanBoard />
      </div>
    </main>
  );
}
