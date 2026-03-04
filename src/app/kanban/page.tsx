"use client";

import { useState } from 'react';
import KanbanBoard from './KanbanBoard';
import SaveToast, { SaveToastState } from '@/components/SaveToast';
import AppDrawer from '@/components/AppDrawer';

export default function KanbanPage() {
  const [saveState, setSaveState] = useState<SaveToastState>(null);
  const BUILD_STAMP = "v1.5-MOBILE-DND-" + new Date().toISOString().slice(11, 16);
  
  return (
    <main style={{ 
        minHeight: '100vh', 
        background: '#0D0D1A', 
        color: '#fff', 
        padding: "calc(env(safe-area-inset-top) + 64px) 24px 32px", 
        display: 'flex', 
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
    }}>
      <AppDrawer />
      <SaveToast state={saveState} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div style={{ paddingLeft: 8 }}>
            <h1 style={{ fontFamily: 'Permanent Marker', fontSize: 26, color: '#FFD90F', margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.02em' }}>
                🏗️ OPS
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Job Orchestration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,217,15,0.2)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,217,15,0.05)', fontWeight: 700 }}>
                {BUILD_STAMP}
            </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <KanbanBoard onSaveStateChange={setSaveState} />
      </div>
    </main>
  );
}
