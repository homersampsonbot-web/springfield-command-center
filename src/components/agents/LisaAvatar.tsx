import React from "react";

export default function LisaAvatar({ state = "idle", size = 180 }: { state?: string; size?: number }) {
  const isThinking = state === "thinking";
  
  return (
    <div className={`agent-container agent-${state}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        {/* Environment - Strategy Board */}
        <rect x="20" y="20" width="80" height="60" fill="#fff" stroke="#444" strokeWidth="2" />
        <path d="M30 35 h40 M30 45 h50 M30 55 h30" stroke="#2c3e50" strokeWidth="1.5" opacity="0.4" />
        <circle cx="85" cy="40" r="5" fill="#e74c3c" opacity="0.6" />

        {/* Character */}
        <g transform="translate(0, 5)">
          {/* Spiky Hair */}
          <polygon points="60,40 70,48 83,45 80,58 95,62 80,66 83,79 70,76 60,85 50,76 37,79 40,66 25,62 40,58 37,45 50,48" fill="#FED90F" stroke="#3A2B00" strokeWidth="1.8" />
          
          {/* Head */}
          <circle cx="60" cy="72" r="18" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Eyes */}
          <circle cx="54" cy="70" r="6.5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx="66" cy="70" r="6.5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx={isThinking ? 55 : 54} cy="70" r="1.5" fill="#000" />
          <circle cx={isThinking ? 65 : 66} cy="70" r="1.5" fill="#000" />

          {/* Necklace */}
          <circle cx="50" cy="88" r="2.8" fill="#fff" stroke="#eee" strokeWidth="0.5" />
          <circle cx="56" cy="91" r="2.8" fill="#fff" stroke="#eee" strokeWidth="0.5" />
          <circle cx="64" cy="91" r="2.8" fill="#fff" stroke="#eee" strokeWidth="0.5" />
          <circle cx="70" cy="88" r="2.8" fill="#fff" stroke="#eee" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}
