import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface LisaAvatarProps {
  state: AgentState;
  size?: number;
}

export const LisaAvatar: React.FC<LisaAvatarProps> = ({ state, size = 90 }) => {
  const c = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="l-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="45" cy="45" r="43" fill="url(#l-glow)"/>
      <path d="M16 90 Q22 68 45 65 Q68 68 74 90Z" fill="#2d4a7a"/>
      <path d="M36 65 L42 72 L32 70Z" fill="#3a5a8a"/>
      <path d="M54 65 L48 72 L58 70Z" fill="#3a5a8a"/>
      <rect x="39" y="58" width="12" height="10" rx="5" fill="#F5C542"/>
      <ellipse cx="45" cy="50" rx="18" ry="19" fill="#F5C542"/>
      <circle cx="37" cy="47" r="7" fill="#111" opacity="0.9"/>
      <circle cx="53" cy="47" r="7" fill="#111" opacity="0.9"/>
      <rect x="44" y="45" width="9" height="4" fill="#222"/>
      <circle cx="37" cy="47" r="5.5" fill="#0d1f3a" opacity="0.95"/>
      <circle cx="53" cy="47" r="5.5" fill="#0d1f3a" opacity="0.95"/>
      <path d="M33 44 L38 44 L35 48Z" fill="white" opacity="0.15"/>
      <path d="M49 44 L54 44 L51 48Z" fill="white" opacity="0.15"/>
      <ellipse cx="45" cy="55" rx="3" ry="2.5" fill="#E8A830"/>
      <path d="M39 61 Q45 65 51 61" stroke="#c07020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="27" cy="50" rx="3" ry="3.5" fill="#F5C542"/>
      <ellipse cx="63" cy="50" rx="3" ry="3.5" fill="#F5C542"/>
      <path d="M27 46 Q30 36 36 38 Q34 28 40 30 Q40 22 45 24 Q50 22 50 30 Q56 28 54 38 Q60 36 63 46" fill="#F5C542" stroke="#E8A830" strokeWidth="1"/>
      <circle cx="74" cy="16" r="5" fill={c} opacity="0.95"/>
      <circle cx="74" cy="16" r="8" fill={c} opacity="0.2"/>
    </svg>
  );
};
