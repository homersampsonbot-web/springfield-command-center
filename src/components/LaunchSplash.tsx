'use client';
import React from 'react';

type Health = {
  gateway?: string;
  database?: string;
  queue?: string;
  agents?: Record<string,string>;
  build?: string;
  timestamp?: number;
};

function isStandaloneMode() {
  // iOS Safari standalone + generic PWA display-mode
  // @ts-ignore
  const iosStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone === true;
  const displayModeStandalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || displayModeStandalone;
}

export default function LaunchSplash() {
  const [visible, setVisible] = React.useState(false);
  const [phase, setPhase] = React.useState<string>('Booting…');
  const [detail, setDetail] = React.useState<string>('Initializing');
  const [health, setHealth] = React.useState<Health | null>(null);
  const startRef = React.useRef<number>(0);
  const doneRef = React.useRef<boolean>(false);
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!isStandaloneMode()) return;
    
    setVisible(true);
    startRef.current = Date.now();
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      
      try {
        const r = await fetch('/api/system-health', { cache: 'no-store' });
        const d: Health = await r.json();
        if (cancelled) return;
        setHealth(d);

        const criticalReady = (d.gateway === 'online' || d.gateway === 'alive') && (d.database === 'connected');
        const elapsed = Date.now() - startRef.current;
        const MIN_MS = 4500;
        const MAX_MS = 15000;

        setPhase('System Check…');
        setDetail(`Gateway: ${d.gateway} · Database: ${d.database}`);

        if (elapsed >= MAX_MS) {
            setPhase('Boot Degraded');
            setDetail('Failsafe triggered. Proceeding in limited mode.');
            if (typeof window !== 'undefined') window.localStorage.setItem('boot_degraded', 'true');
            doneRef.current = true;
            setTimeout(() => { if (!cancelled) setVisible(false); }, 1500);
            return;
        }

        if (criticalReady && elapsed >= MIN_MS) {
            setPhase('Mission Control Ready');
            setDetail('All critical systems nominal.');
            if (typeof window !== 'undefined') window.localStorage.removeItem('boot_degraded');
            doneRef.current = true;
            setTimeout(() => { if (!cancelled) setVisible(false); }, 800);
            return;
        }

        // Fast polling during boot
        pollTimerRef.current = setTimeout(tick, 500);

      } catch (e: any) {
        setPhase('Connection Error');
        setDetail('Retrying link to command center…');
        const elapsed = Date.now() - startRef.current;
        if (elapsed >= 15000) {
            setVisible(false);
            return;
        }
        pollTimerRef.current = setTimeout(tick, 500);
      }
    }

    tick();
    
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080810',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/login-hero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 18,
        }}
      >
        <div
          style={{
            width: 'min(520px, 92vw)',
            borderRadius: 18,
            border: '1px solid rgba(255, 217, 15, 0.35)',
            background: 'rgba(10,10,16,0.75)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            padding: 20,
            color: 'rgba(255,255,255,0.92)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', fontSize: 14 }}>
              Command Center Boot
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>
              {health?.build ? `REV: ${health.build}` : 'INITIALIZING'}
            </div>
          </div>
          
          <div style={{ marginTop: 20, fontSize: 20, fontWeight: 800, color: '#FFD90F', letterSpacing: '0.02em' }}>
            {phase}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85, fontFamily: 'monospace' }}>
            {detail}
          </div>

          <div style={{ marginTop: 20, height: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
             <div style={{ 
               position: 'absolute', 
               left: 0, 
               top: 0, 
               height: '100%', 
               background: '#FFD90F', 
               boxShadow: '0 0 10px #FFD90F',
               width: `${Math.min(100, ((Date.now() - startRef.current) / 4500) * 100)}%`,
               transition: 'width 0.3s ease-out'
             }} />
          </div>
          
          <pre
            style={{
              marginTop: 20,
              fontSize: 11,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'rgba(255,255,255,0.5)',
              maxHeight: 120,
              overflow: 'hidden',
              fontFamily: 'monospace',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: 12
            }}
          >
            {`[BOOT] timestamp: ${new Date().toISOString()}
[BOOT] gateway: ${health?.gateway || 'polling...'}
[BOOT] database: ${health?.database || 'polling...'}
[BOOT] queue: ${health?.queue || 'polling...'}
[BOOT] critical_ready: ${((health?.gateway === 'online' || health?.gateway === 'alive') && (health?.database === 'connected'))}
[BOOT] elapsed_ms: ${Date.now() - startRef.current}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
