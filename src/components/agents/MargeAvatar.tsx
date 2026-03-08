import React from "react";

export default function MargeAvatar({ state = "idle", size = 180 }: { state?: string; size?: number }) {
  const isThinking = state === "thinking";
  
  return (
    <div className={`agent-container agent-${state}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        {/* Environment - Drafting Table */}
        <path d="M15 95 L105 95 L110 110 L10 110 Z" fill="#2d3436" stroke="#404060" strokeWidth="1" />
        <rect x="25" y="98" width="50" height="10" fill="#74b9ff" stroke="#fff" strokeWidth="0.5" opacity="0.6" />
        <path d="M30 101 h15 M30 104 h20" stroke="#fff" strokeWidth="1" opacity="0.8" />

        {/* Character */}
        <g transform="translate(0, 5)">
          {/* Tall Hair */}
          <rect x="46" y="15" width="28" height="60" rx="14" fill="#2F8DFF" stroke="#103060" strokeWidth="1.8" />
          
          {/* Head */}
          <circle cx="60" cy="78" r="22" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Eyes */}
          <circle cx="53" cy="76" r="8" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx="67" cy="76" r="8" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx={isThinking ? 54 : 53} cy="76" r="2" fill="#000" />
          <circle cx={isThinking ? 66 : 67} cy="76" r="2" fill="#000" />
          
          {/* Necklace */}
          <circle cx="48" cy="94" r="3.5" fill="#ff4d4d" stroke="#600" strokeWidth="0.5" />
          <circle cx="54" cy="97" r="3.5" fill="#ff4d4d" stroke="#600" strokeWidth="0.5" />
          <circle cx="60" cy="98" r="3.5" fill="#ff4d4d" stroke="#600" strokeWidth="0.5" />
          <circle cx="66" cy="97" r="3.5" fill="#ff4d4d" stroke="#600" strokeWidth="0.5" />
          <circle cx="72" cy="94" r="3.5" fill="#ff4d4d" stroke="#600" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}
