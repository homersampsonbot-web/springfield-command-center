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

  React.useEffect(() => {
    if (!isStandaloneMode()) return; // only show “app boot” when launched from home screen
    setVisible(true);
    startRef.current = Date.now();
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      try {
        setPhase('Connecting Gateway…');
        setDetail('Contacting gateway.margebot.com');
        const r = await fetch('/api/system-health', { cache: 'no-store' });
        const d: Health = await r.json();
        if (cancelled) return;
        setHealth(d);

        setPhase('Checking Database…');
        setDetail(`Neon: ${d.database ?? 'unknown'}`);
        
        setPhase('Connecting Queue…');
        setDetail(`Upstash: ${d.queue ?? 'unknown'}`);
        
        const agents = d.agents ?? {};
        const homer = agents.homer ?? 'unknown';
        const bart = agents.bart ?? 'unknown';
        const lisa = agents.lisa ?? 'unknown';
        const maggie = agents.maggie ?? 'unknown';
        
        setPhase('Agents Online…');
        setDetail(`Homer=${homer} · Bart=${bart} · Lisa=${lisa} · Maggie=${maggie}`);

        const ready = (d.gateway === 'online' || d.gateway === 'alive') && (d.database === 'connected') && (d.queue === 'connected');
        setPhase(ready ? 'Mission Control Ready' : 'Mission Control Limited');
        setDetail(ready ? 'All systems nominal' : 'Some subsystems degraded');
        doneRef.current = true;

        // Minimum splash time so it feels intentional
        const MIN_MS = 650;
        const elapsed = Date.now() - startRef.current;
        const wait = Math.max(0, MIN_MS - elapsed);
        
        setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
        }, wait);
      } catch (e: any) {
        setPhase('Boot Error');
        setDetail('Could not reach /api/system-health');
        doneRef.current = true;
        const MIN_MS = 650;
        const elapsed = Date.now() - startRef.current;
        const wait = Math.max(0, MIN_MS - elapsed);
        setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
        }, wait);
      }
    }
    tick();
    return () => {
      cancelled = true;
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
            background: 'rgba(10,10,16,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: 16,
            color: 'rgba(255,255,255,0.92)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              Command Center Boot
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {health?.build ? `Build ${health.build}` : ''}
            </div>
          </div>
          
          <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, color: '#FFD90F' }}>
            {phase}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            {detail}
          </div>

          <div style={{ marginTop: 14, height: 1, background: 'rgba(255,255,255,0.10)' }} />
          
          <pre
            style={{
              marginTop: 12,
              fontSize: 12,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              color: 'rgba(255,255,255,0.78)',
              maxHeight: 180,
              overflow: 'auto',
            }}
          >
            {`[${new Date().toISOString()}] boot.start
[${new Date().toISOString()}] health.poll /api/system-health
[${new Date().toISOString()}] gateway: ${health?.gateway ?? 'unknown'}
[${new Date().toISOString()}] database: ${health?.database ?? 'unknown'}
[${new Date().toISOString()}] queue: ${health?.queue ?? 'unknown'}
[${new Date().toISOString()}] agents: ${JSON.stringify(health?.agents ?? {}, null, 0)}
[${new Date().toISOString()}] boot.${doneRef.current ? 'done' : 'running'}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
