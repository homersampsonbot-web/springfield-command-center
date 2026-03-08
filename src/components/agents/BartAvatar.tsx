import React from "react";

export default function BartAvatar({ state = "idle", size = 180 }: { state?: string; size?: number }) {
  const isThinking = state === "thinking";
  
  return (
    <div className={`agent-container agent-${state}`} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
        {/* Environment - QA Station */}
        <rect x="15" y="75" width="90" height="35" rx="4" fill="#4b4b4b" stroke="#333" strokeWidth="1" />
        <rect x="25" y="40" width="35" height="28" rx="2" fill="#000" stroke="#00d8ff" strokeWidth="1" />
        <rect x="65" y="45" width="30" height="22" rx="2" fill="#000" stroke="#444" strokeWidth="1" />
        {(state === "active" || isThinking) && (
           <rect x="27" y="42" width="31" height="24" fill="rgba(0,216,255,0.15)" />
        )}

        {/* Character */}
        <g transform="translate(0, 5)">
          {/* Spiky Hair */}
          <polygon points="45,45 45,28 50,38 55,28 60,38 65,28 70,38 75,28 75,45" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Head */}
          <rect x="45" y="45" width="30" height="38" rx="2" fill="#FED90F" stroke="#2C1A00" strokeWidth="1.8" />
          
          {/* Eyes */}
          <circle cx="53" cy="60" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx="67" cy="60" r="7" fill="#fff" stroke="#2C1A00" strokeWidth="1" />
          <circle cx={isThinking ? 54 : 53} cy="60" r="1.8" fill="#000" />
          <circle cx={isThinking ? 66 : 67} cy="60" r="1.8" fill="#000" />
          
          {/* Nose */}
          <path d="M60 65 Q65 65 65 70 Q65 75 60 75" stroke="#2C1A00" strokeWidth="1.2" fill="none" />
          
          {/* Mouth */}
          <path d="M52 78 Q60 82 68 78" stroke="#2C1A00" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        
        {/* Prop: Skateboard */}
        <rect x="90" y="100" width="28" height="6" rx="3" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
        <circle cx="96" cy="108" r="3" fill="#333" />
        <circle cx="112" cy="108" r="3" fill="#333" />
      </svg>
    </div>
  );
}
