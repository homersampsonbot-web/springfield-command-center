// Springfield Control Room — Canonical Animation System
// All state transitions defined here. No per-agent hardcoding.
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
  idle: '#4a4a6a',
  thinking: '#f5c842',
  active: '#42d9f5',
  complete: '#42f57e',
  failed: '#f54242',
  offline: '#2a2a3a',
  rate_limited: '#f5a142',
};

export const STATE_LABELS: Record<AgentState, string> = {
  idle: 'IDLE',
  thinking: 'THINKING',
  active: 'ACTIVE',
  complete: 'COMPLETE',
  failed: 'FAILED',
  offline: 'OFFLINE',
  rate_limited: 'RATE LIMITED',
};

export const ANIMATION_CSS = `
  @keyframes breathe {
    0%, 100% { opacity: 0.85; transform: translateY(0px); }
    50% { opacity: 1; transform: translateY(-2px); }
  }
  @keyframes thinkingPulse {
    0%, 100% { box-shadow: 0 0 12px 2px rgba(245,200,66,0.3), inset 0 0 20px rgba(245,200,66,0.05); }
    50% { box-shadow: 0 0 28px 8px rgba(245,200,66,0.7), inset 0 0 30px rgba(245,200,66,0.15); }
  }
  @keyframes activePulse {
    0%, 100% { box-shadow: 0 0 16px 4px rgba(66,217,245,0.4), inset 0 0 20px rgba(66,217,245,0.08); }
    50% { box-shadow: 0 0 32px 10px rgba(66,217,245,0.8), inset 0 0 30px rgba(66,217,245,0.18); }
  }
  @keyframes failedPulse {
    0%, 100% { box-shadow: 0 0 12px 2px rgba(245,66,66,0.4); }
    50% { box-shadow: 0 0 24px 8px rgba(245,66,66,0.8); }
  }
  @keyframes completeFade {
    0% { box-shadow: 0 0 30px 10px rgba(66,245,126,0.8); }
    100% { box-shadow: 0 0 12px 3px rgba(66,245,126,0.3); }
  }
  @keyframes tickerScroll {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  @keyframes stationEntrance {
    0% { opacity: 0; transform: translateY(20px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes glowFlicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.7; }
    94% { opacity: 1; }
    97% { opacity: 0.8; }
    98% { opacity: 1; }
  }
  @keyframes rateLimitedBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes screenGlow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  .state-idle .station-card {
    animation: breathe 4s ease-in-out infinite;
    box-shadow: 0 0 8px 1px rgba(74,74,106,0.4);
  }
  .state-thinking .station-card {
    animation: thinkingPulse 1.4s ease-in-out infinite;
    border-color: rgba(245,200,66,0.6) !important;
  }
  .state-active .station-card {
    animation: activePulse 1.2s ease-in-out infinite;
    border-color: rgba(66,217,245,0.7) !important;
  }
  .state-complete .station-card {
    animation: completeFade 2s ease-out forwards;
    border-color: rgba(66,245,126,0.6) !important;
  }
  .state-failed .station-card {
    animation: failedPulse 0.8s ease-in-out infinite;
    border-color: rgba(245,66,66,0.7) !important;
  }
  .state-offline .station-card {
    opacity: 0.45;
    filter: grayscale(0.8);
  }
  .state-rate-limited .station-card {
    animation: rateLimitedBlink 1s ease-in-out infinite;
    border-color: rgba(245,161,66,0.6) !important;
  }
`;
