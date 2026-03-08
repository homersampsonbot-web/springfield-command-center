import React from "react";

export default function BartSVG({ size = 120, state = "idle" }: { size?: number; state?: string }) {
  const isActive = state === "active" || state === "thinking";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Bart">
      <defs>
        <filter id="glow-bart" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* QA/Browser Station */}
      <rect x="10" y="70" width="100" height="40" rx="4" fill="#4b4b4b" />
      <rect x="20" y="35" width="40" height="30" rx="2" fill="#000" stroke="#00d8ff" strokeWidth="1" />
      <rect x="65" y="40" width="35" height="25" rx="2" fill="#000" stroke="#444" strokeWidth="1" />
      
      {isActive && (
        <rect x="22" y="37" width="36" height="26" fill="rgba(0,216,255,0.1)" />
      )}

      {/* Bart Character */}
      <g style={{ filter: isActive ? 'url(#glow-bart)' : 'none' }}>
        {/* Spiky Hair - Iconic Bart silhouette */}
        <polygon points="45,45 45,30 50,40 55,30 60,40 65,30 70,40 75,30 75,45" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Head */}
        <rect x="45" y="45" width="30" height="35" rx="2" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Eyes */}
        <circle cx="53" cy="58" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="67" cy="58" r="6" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="54" cy="58" r="1.5" fill="#000" />
        <circle cx="68" cy="58" r="1.5" fill="#000" />
        
        {/* Nose */}
        <path d="M60 62 Q64 62 64 66 Q64 70 60 70" stroke="#2C1A00" strokeWidth="1" fill="none" />
        
        {/* Mouth */}
        <path d="M52 75 Q60 78 68 75" stroke="#2C1A00" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Skateboard prop */}
      <rect x="90" y="95" width="25" height="6" rx="3" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
      <circle cx="95" cy="103" r="3" fill="#333" />
      <circle cx="110" cy="103" r="3" fill="#333" />
    </svg>
  );
}
