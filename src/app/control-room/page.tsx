import dynamic from 'next/dynamic';

const ControlRoom = dynamic(
  () => import('@/components/control-room/ControlRoom'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", monospace',
        color: '#f5c842',
        fontSize: '14px',
        letterSpacing: '0.15em'
      }}>
        INITIALIZING CONTROL ROOM...
      </div>
    )
  }
);

export default function ControlRoomPage() {
  return <ControlRoom />;
}
