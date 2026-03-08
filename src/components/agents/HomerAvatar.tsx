import React from "react";

export default function HomerAvatar({ state = "idle", size = 180 }: { state?: string; size?: number }) {
  const isThinking = state === "thinking";
  const isActive = state === "active";
  
  return (
    <div className={`agent-container agent-${state}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        {/* Environment - Terminal */}
        <rect x="10" y="80" width="100" height="30" rx="4" fill="#202030" stroke="#404060" strokeWidth="1" />
        <rect x="25" y="45" width="30" height="25" rx="2" fill="#000" stroke="#505080" strokeWidth="1" />
        <rect x="65" y="45" width="30" height="25" rx="2" fill="#000" stroke="#505080" strokeWidth="1" />
        {(isThinking || isActive) && (
          <>
            <rect x="27" y="47" width="26" height="21" fill="rgba(0,255,100,0.1)" />
            <path d="M28 50 h15 M28 54 h10 M28 58 h12" stroke="#0f0" strokeWidth="1" opacity="0.6" />
          </>
        )}

        {/* Character */}
        <g transform="translate(0, 5)">
          {/* Head */}
          <path d="M45 70 C45 45, 75 45, 75 70 L75 95 L45 95 Z" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.5" />
          <path d="M58 52 Q60 42 62 52 M54 54 Q56 44 58 54" stroke="#2C1A00" strokeWidth="1.2" fill="none" />
          
          {/* Eyes */}
          <circle cx="53" cy="68" r="7.5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx="67" cy="68" r="7.5" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx={isThinking ? 54 : 53.5} cy="68" r="1.8" fill="#000" />
          <circle cx={isThinking ? 66 : 67.5} cy="68" r="1.8" fill="#000" />
          
          {/* Nose */}
          <path d="M60 72 Q65 72 65 77 Q65 82 60 82" stroke="#2C1A00" strokeWidth="1.2" fill="none" />
          
          {/* Muzzle */}
          <path d="M48 82 Q60 94 72 82" fill="#D1B271" stroke="#2C1A00" strokeWidth="1" />
          
          {/* Shirt */}
          <path d="M45 95 L52 102 L60 95 L68 102 L75 95" fill="#fff" stroke="#ccc" strokeWidth="0.8" />
        </g>
        
        {/* Prop: Donut */}
        <circle cx="105" cy="95" r="8" fill="#ff9ff3" stroke="#2C1A00" strokeWidth="1" />
        <circle cx="105" cy="95" r="3" fill="#2d3436" />
      </svg>
    </div>
  );
}
