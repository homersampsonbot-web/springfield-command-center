import React from "react";

export default function MaggieAvatar({ state = "idle", size = 180 }: { state?: string; size?: number }) {
  const isThinking = state === "thinking";

  return (
    <div className={`agent-container agent-${state}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        {/* Environment - Orchestration Console */}
        <circle cx="60" cy="85" r="40" fill="#1e272e" stroke="#00d8ff" strokeWidth="1" opacity="0.4" />
        <path d="M35 90 q25 -15 50 0" stroke="#00d8ff" strokeWidth="1.2" fill="none" opacity="0.6" />
        {(state === "active" || isThinking) && (
          <circle cx="60" cy="85" r="30" fill="none" stroke="#00d8ff" strokeWidth="0.5" opacity="0.3">
            <animate attributeName="r" values="30;35;30" dur="3s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Character */}
        <g transform="translate(0, 5)">
          {/* Hair spikes */}
          <polygon points="60,35 68,44 78,42 75,52 85,58 75,64 78,74 68,72 60,82 52,72 42,74 45,64 35,58 45,52 42,42 52,44" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Head */}
          <circle cx="60" cy="68" r="18" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Eyes */}
          <circle cx="53" cy="66" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx="67" cy="66" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx={isThinking ? 54 : 53.5} cy="66" r="1.5" fill="#000" />
          <circle cx={isThinking ? 66 : 66.5} cy="66" r="1.5" fill="#000" />
          
          {/* Pacifier */}
          <circle cx="60" cy="76" r="5" fill="#ff4d4d" stroke="#2C1A00" strokeWidth="1" />
          
          {/* Blue Bow */}
          <path d="M52 42 q8 -10 16 0 l-4 6 q-4 4 -8 0 Z" fill="#6BCBFF" stroke="#103060" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}
