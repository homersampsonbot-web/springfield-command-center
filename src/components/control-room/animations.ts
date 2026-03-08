// Springfield Power Plant Control Room — Animation System v2
// Shared infrastructure. No per-agent hardcoding.

export type AgentState = 'idle' | 'thinking' | 'active' | 'complete' | 'failed' | 'offline' | 'rate_limited';

export const ANIMATION_CLASSES: Record<AgentState, string> = {
  idle: 'state-idle',
  thinking: 'state-thinking',
  active: 'state-active',
  complete: 'state-complete',
  failed: 'state-failed',
  offline: 'state-offline',
  rate_limited: 'state-rate-limited',
};

export const STATE_COLORS: Record<AgentState, string> = {
  idle: '#7a8a6a',
  thinking: '#f5c842',
  active: '#00ff88',
  complete: '#00cc66',
  failed: '#ff3333',
  offline: '#3a3a4a',
  rate_limited: '#ff9900',
};

export const STATE_LABELS: Record<AgentState, string> = {
  idle: 'STANDBY',
  thinking: 'PROCESSING',
  active: 'ONLINE',
  complete: 'COMPLETE',
  failed: 'FAULT',
  offline: 'OFFLINE',
  rate_limited: 'THROTTLED',
};

export const ANIMATION_CSS = `
  @keyframes machineBreath {
    0%, 100% { opacity: 0.75; }
    50% { opacity: 1; }
  }
  @keyframes amberPulse {
    0%, 100% { box-shadow: 0 0 8px 2px rgba(245,200,66,0.4), 0 0 0 1px rgba(245,200,66,0.2); }
    50% { box-shadow: 0 0 22px 6px rgba(245,200,66,0.8), 0 0 0 1px rgba(245,200,66,0.5); }
  }
  @keyframes greenRun {
    0%, 100% { box-shadow: 0 0 10px 3px rgba(0,255,136,0.35), 0 0 0 1px rgba(0,255,136,0.25); }
    50% { box-shadow: 0 0 28px 8px rgba(0,255,136,0.75), 0 0 0 1px rgba(0,255,136,0.5); }
  }
  @keyframes redAlert {
    0%, 100% { box-shadow: 0 0 8px 2px rgba(255,51,51,0.5), 0 0 0 1px rgba(255,51,51,0.4); }
    50% { box-shadow: 0 0 24px 8px rgba(255,51,51,0.9), 0 0 0 1px rgba(255,51,51,0.7); }
  }
  @keyframes successFlash {
    0% { box-shadow: 0 0 30px 10px rgba(0,204,102,0.9); }
    100% { box-shadow: 0 0 8px 2px rgba(0,204,102,0.3); }
  }
  @keyframes tickerScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes stationBoot {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes warningBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes consoleFade {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  @keyframes indicatorPulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.3); opacity: 1; }
  }
  @keyframes meterFlicker {
    0%, 95%, 100% { opacity: 1; }
    96% { opacity: 0.6; }
    98% { opacity: 0.8; }
  }

  .state-idle .station-console {
    animation: machineBreath 3.5s ease-in-out infinite;
  }
  .state-idle .status-light {
    background: #7a8a6a;
    animation: machineBreath 3.5s ease-in-out infinite;
  }
  .state-thinking .station-console {
    animation: amberPulse 1.4s ease-in-out infinite;
    border-color: rgba(245,200,66,0.5) !important;
  }
  .state-thinking .status-light {
    background: #f5c842;
    animation: warningBlink 0.8s ease-in-out infinite;
  }
  .state-active .station-console {
    animation: greenRun 1.2s ease-in-out infinite;
    border-color: rgba(0,255,136,0.5) !important;
  }
  .state-active .status-light {
    background: #00ff88;
    animation: indicatorPulse 1s ease-in-out infinite;
  }
  .state-complete .station-console {
    animation: successFlash 2.5s ease-out forwards;
    border-color: rgba(0,204,102,0.5) !important;
  }
  .state-complete .status-light {
    background: #00cc66;
  }
  .state-failed .station-console {
    animation: redAlert 0.7s ease-in-out infinite;
    border-color: rgba(255,51,51,0.6) !important;
  }
  .state-failed .status-light {
    background: #ff3333;
    animation: warningBlink 0.4s ease-in-out infinite;
  }
  .state-offline .station-console {
    opacity: 0.3;
    filter: grayscale(1) brightness(0.5);
  }
  .state-offline .status-light {
    background: #3a3a4a;
  }
  .state-rate-limited .station-console {
    animation: amberPulse 2s ease-in-out infinite;
    border-color: rgba(255,153,0,0.4) !important;
  }
  .state-rate-limited .status-light {
    background: #ff9900;
    animation: warningBlink 1.5s ease-in-out infinite;
  }
`;
