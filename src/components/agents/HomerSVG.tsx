import React from "react";

export default function HomerSVG({ size = 120, state = "idle" }: { size?: number; state?: string }) {
  const isActive = state === "active" || state === "thinking";
  const isFailed = state === "failed";
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Homer">
      <defs>
        <filter id="glow-homer" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Workstation background */}
      <rect x="10" y="70" width="100" height="40" rx="4" fill="#2d3436" />
      <rect x="25" y="40" width="30" height="25" rx="2" fill="#000" stroke="#444" strokeWidth="1" />
      <rect x="65" y="40" width="30" height="25" rx="2" fill="#000" stroke="#444" strokeWidth="1" />
      
      {/* Dynamic Screen Content */}
      {isActive && (
        <>
          <rect x="27" y="42" width="26" height="21" fill="rgba(0,255,0,0.1)" />
          <path d="M28 45 h10 M28 48 h15 M28 51 h12" stroke="#0f0" strokeWidth="1" opacity="0.6" />
          <rect x="67" y="42" width="26" height="21" fill="rgba(0,255,0,0.1)" />
          <path d="M68 45 h10 M68 48 h15 M68 51 h12" stroke="#0f0" strokeWidth="1" opacity="0.6" />
        </>
      )}
      
      {/* Homer Character */}
      <g style={{ filter: isActive ? 'url(#glow-homer)' : 'none' }}>
        {/* Head Shape - more Homer-like silhouette */}
        <path d="M45 60 C45 40, 75 40, 75 60 L75 85 L45 85 Z" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
        
        {/* Hair - the two hairs on top */}
        <path d="M58 45 Q60 35 62 45 M55 47 Q57 37 59 47" stroke="#2C1A00" strokeWidth="1" fill="none" />
        
        {/* Eyes */}
        <circle cx="53" cy="58" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="67" cy="58" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="54" cy="58" r="1.5" fill="#000" />
        <circle cx="68" cy="58" r="1.5" fill="#000" />
        
        {/* Nose */}
        <path d="M60 62 Q64 62 64 66 Q64 70 60 70" stroke="#2C1A00" strokeWidth="1" fill="none" />
        
        {/* Muzzle / Mouth Area */}
        <path d="M48 72 Q60 82 72 72" fill="#D1B271" stroke="#2C1A00" strokeWidth="1" />
        
        {/* Shirt collar */}
        <path d="M45 85 L52 90 L60 85 L68 90 L75 85" fill="#fff" stroke="#ccc" strokeWidth="0.5" />
      </g>
      
      {/* Donut Prop */}
      <circle cx="100" cy="85" r="8" fill="#ff9ff3" stroke="#2C1A00" strokeWidth="1" />
      <circle cx="100" cy="85" r="3" fill="#2d3436" />
    </svg>
  );
}
