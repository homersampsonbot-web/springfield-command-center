import React from "react";

export default function MargeSVG({ size = 120, state = "idle" }: { size?: number; state?: string }) {
  const isActive = state === "active" || state === "thinking";
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Marge">
      <defs>
        <filter id="glow-marge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Blueprint Desk */}
      <rect x="10" y="85" width="100" height="25" fill="#54a0ff" stroke="#2e86de" strokeWidth="2" />
      <path d="M20 90 l15 0 M20 95 l25 0 M20 100 l20 0" stroke="white" strokeWidth="1" opacity="0.4" />
      <rect x="70" y="88" width="30" height="15" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="0.5" />

      {/* Marge Character */}
      <g style={{ filter: isActive ? 'url(#glow-marge)' : 'none' }}>
        {/* Hair - Iconic tall blue hair */}
        <rect x="46" y="10" width="28" height="55" rx="14" fill="#2F8DFF" stroke="#103060" strokeWidth="1.5" />
        
        {/* Head */}
        <circle cx="60" cy="70" r="22" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Eyes */}
        <circle cx="53" cy="68" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="67" cy="68" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="54" cy="68" r="1.5" fill="#000" />
        <circle cx="68" cy="68" r="1.5" fill="#000" />
        
        {/* Necklace */}
        <circle cx="48" cy="85" r="3" fill="#ff4d4d" />
        <circle cx="54" cy="88" r="3" fill="#ff4d4d" />
        <circle cx="60" cy="89" r="3" fill="#ff4d4d" />
        <circle cx="66" cy="88" r="3" fill="#ff4d4d" />
        <circle cx="72" cy="85" r="3" fill="#ff4d4d" />
      </g>
    </svg>
  );
}
