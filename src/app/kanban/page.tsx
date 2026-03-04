"use client";

import { useState } from 'react';
import KanbanBoard from './KanbanBoard';
import SaveToast, { SaveToastState } from '@/components/SaveToast';

export default function KanbanPage() {
  const [saveState, setSaveState] = useState<SaveToastState>(null);
  const BUILD_STAMP = "v1.4-TOAST-" + new Date().toISOString().slice(11, 16);
  
  return (
    <main style={{ 
        minHeight: '100vh', background: '#0D0D1A', color: '#fff', 
        padding: "24px 32px", display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
    }}>
      <SaveToast state={saveState} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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
        <KanbanBoard onSaveStateChange={setSaveState} />
      </div>
    </main>
  );
}
