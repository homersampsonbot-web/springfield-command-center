import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface MargeAvatarProps {
  state: AgentState;
  size?: number;
}

export const MargeAvatar: React.FC<MargeAvatarProps> = ({ state, size = 90 }) => {
  const c = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="m-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="45" cy="45" r="43" fill="url(#m-glow)"/>
      <path d="M18 90 Q22 70 45 67 Q68 70 72 90Z" fill="#1e2d5a"/>
      <path d="M38 67 L45 75 L35 72Z" fill="#2a3d6e"/>
      <path d="M52 67 L45 75 L55 72Z" fill="#2a3d6e"/>
      <ellipse cx="45" cy="65" rx="10" ry="3" fill="none" stroke="#d4d4d4" strokeWidth="2" strokeDasharray="3 2"/>
      <rect x="39" y="56" width="12" height="12" rx="5" fill="#F5C542"/>
      <ellipse cx="45" cy="50" rx="18" ry="20" fill="#F5C542"/>
      <rect x="27" y="44" width="32" height="10" rx="3" fill="#111" opacity="0.92"/>
      <rect x="28" y="45" width="13" height="8" rx="2" fill="#1a0a2e" opacity="0.95"/>
      <rect x="49" y="45" width="9" height="8" rx="2" fill="#1a0a2e" opacity="0.95"/>
      <rect x="41" y="47" width="8" height="3" fill="#222"/>
      <path d="M30 46 L36 46 L33 50Z" fill="white" opacity="0.12"/>
      <circle cx="27" cy="52" r="2" fill="#c0c0c0"/>
      <circle cx="63" cy="52" r="2" fill="#c0c0c0"/>
      <ellipse cx="45" cy="55" rx="3.5" ry="3" fill="#E8A830"/>
      <path d="M38 61 Q45 65 52 61" stroke="#c07020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="27" cy="50" rx="3.5" ry="4" fill="#F5C542"/>
      <ellipse cx="63" cy="50" rx="3.5" ry="4" fill="#F5C542"/>
      <path d="M27 44 Q24 26 32 14 Q38 4 45 2 Q52 4 58 14 Q66 26 63 44" fill="#1E3A8A"/>
      <path d="M30 42 Q28 24 34 12 Q40 4 45 2" fill="#2563EB" opacity="0.35"/>
      <path d="M38 6 Q40 18 38 30" stroke="#1E3A8A" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <path d="M45 2 Q45 16 44 28" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.4"/>
      <circle cx="74" cy="16" r="5" fill={c} opacity="0.95"/>
      <circle cx="74" cy="16" r="8" fill={c} opacity="0.2"/>
    </svg>
  );
};
