'use client';
import { useEffect, useState } from 'react';

function isStandalone(): boolean {
  // iOS Safari standalone
  // @ts-ignore
  const iosStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone === true;
  // Modern display-mode
  const mqlStandalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches;
  return Boolean(iosStandalone || mqlStandalone);
}

export default function LaunchSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show when launched from Home Screen / standalone
    if (!isStandalone()) return;
    setShow(true);

    // Hide once the app has had a moment to render/hydrate.
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#080810',
        backgroundImage: 'url(/login-hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: 'min(560px, 92vw)',
          borderRadius: '20px',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,217,15,0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '14px 16px',
          marginBottom: 'env(safe-area-inset-bottom)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '12px',
          textAlign: 'center',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Loading Command Center…
      </div>
    </div>
  );
}
