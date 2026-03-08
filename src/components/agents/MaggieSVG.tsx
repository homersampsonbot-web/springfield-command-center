import React from "react";

export default function MaggieSVG({ size = 120, state = "idle" }: { size?: number; state?: string }) {
  const isActive = state === "active" || state === "thinking";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Maggie">
      <defs>
        <filter id="glow-maggie" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Central Orchestration Console */}
      <circle cx="60" cy="80" r="35" fill="#1e272e" stroke="#00d8ff" strokeWidth="1" opacity="0.3" />
      <path d="M40 85 q20 -10 40 0" stroke="#00d8ff" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Maggie Character */}
      <g style={{ filter: isActive ? 'url(#glow-maggie)' : 'none' }}>
        {/* Hair - Similar spike to Lisa but smaller */}
        <polygon points="60,35 66,42 75,40 73,48 82,52 73,56 75,64 66,62 60,69 54,62 45,64 47,56 38,52 47,48 45,40 54,42" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Head */}
        <circle cx="60" cy="65" r="16" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Eyes */}
        <circle cx="54" cy="63" r="5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="66" cy="63" r="5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="55" cy="63" r="1" fill="#000" />
        <circle cx="67" cy="63" r="1" fill="#000" />
        
        {/* Pacifier */}
        <circle cx="60" cy="72" r="4" fill="#ff4d4d" stroke="#2C1A00" strokeWidth="1" />
        
        {/* Blue Bow */}
        <path d="M50 45 q10 -10 20 0 l-5 5 q-5 5 -10 0 Z" fill="#6BCBFF" stroke="#103060" strokeWidth="1" />
      </g>
    </svg>
  );
}
