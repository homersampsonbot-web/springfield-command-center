import React from "react";

export default function LisaSVG({ size = 120, state = "idle" }: { size?: number; state?: string }) {
  const isActive = state === "active" || state === "thinking";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Lisa">
      <defs>
        <filter id="glow-lisa" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Strategy Whiteboard */}
      <rect x="20" y="20" width="80" height="60" fill="#fff" stroke="#444" strokeWidth="2" />
      <path d="M30 35 h40 M30 45 h50 M30 55 h30" stroke="#2c3e50" strokeWidth="1.5" opacity="0.3" />
      <circle cx="85" cy="40" r="5" fill="#e74c3c" opacity="0.4" />

      {/* Lisa Character */}
      <g style={{ filter: isActive ? 'url(#glow-lisa)' : 'none' }}>
        {/* Spiky Hair */}
        <polygon points="60,35 68,45 80,42 78,55 90,60 78,65 80,78 68,75 60,85 52,75 40,78 42,65 30,60 42,55 40,42 52,45" fill="#FED90F" stroke="#3A2B00" strokeWidth="1.5" />
        
        {/* Head */}
        <circle cx="60" cy="70" r="18" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Eyes */}
        <circle cx="54" cy="68" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="66" cy="68" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="55" cy="68" r="1.5" fill="#000" />
        <circle cx="67" cy="68" r="1.5" fill="#000" />

        {/* Necklace */}
        <circle cx="50" cy="85" r="2.5" fill="#fff" stroke="#eee" strokeWidth="0.5" />
        <circle cx="56" cy="88" r="2.5" fill="#fff" stroke="#eee" strokeWidth="0.5" />
        <circle cx="64" cy="88" r="2.5" fill="#fff" stroke="#eee" strokeWidth="0.5" />
        <circle cx="70" cy="85" r="2.5" fill="#fff" stroke="#eee" strokeWidth="0.5" />
      </g>
    </svg>
  );
}
