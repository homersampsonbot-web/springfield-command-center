'use client';

import dynamic from 'next/dynamic';

const ControlRoom = dynamic(
  () => import('@/components/control-room/ControlRoomScene'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh',
        background: '#0c0e0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", monospace',
        color: '#f5c842',
        fontSize: '13px',
        letterSpacing: '0.2em',
      }}>
        ◉ INITIALIZING CONTROL ROOM...
      </div>
    ),
  }
);

export default function ControlRoomPage() {
  return <ControlRoom />;
}
