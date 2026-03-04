"use client";

import { useState } from 'react';
import KanbanBoard from './KanbanBoard';

export default function KanbanPage() {
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const BUILD_STAMP = "v1.3-PERSIST-" + new Date().toISOString().slice(11, 16);
  
  const handleStatusChange = (text: string, isError?: boolean) => {
    setStatusMsg({ text, isError });
    if (!isError) {
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <main style={{ 
        minHeight: '100vh', background: '#0D0D1A', color: '#fff', 
        padding: "24px 32px", display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
    }}>
      {/* Error/Status Banner */}
      {statusMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: statusMsg.isError ? '#FF4444' : '#7ED321',
          color: '#fff', padding: '8px 16px', textAlign: 'center',
          fontSize: 13, fontWeight: 600, boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
            <h1 style={{ fontFamily: 'Permanent Marker', fontSize: 32, color: '#FFD90F', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                🏗️ SPRINGFIELD MISSION CONTROL
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>Live Operations & Job Orchestration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                  BUILD: {BUILD_STAMP}
              </div>
              {statusMsg && !statusMsg.isError && (
                <div style={{ fontSize: 9, color: '#7ED321', fontWeight: 700 }}>SAVED ✓</div>
              )}
            </div>
            <a href="/" style={{ fontSize: 11, fontFamily: 'Permanent Marker', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                ← BACK TO PODIUM
            </a>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <KanbanBoard onStatusChange={handleStatusChange} />
      </div>
    </main>
  );
}
