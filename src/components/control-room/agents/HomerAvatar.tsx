import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface HomerAvatarProps {
  state: AgentState;
  size?: number;
}

export const HomerAvatar: React.FC<HomerAvatarProps> = ({ state, size = 90 }) => {
  const c = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="h-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="45" cy="45" r="43" fill="url(#h-glow)"/>
      <path d="M15 90 Q20 68 45 65 Q70 68 75 90Z" fill="#1a1a2e"/>
      <path d="M38 65 L45 72 L52 65 L50 72 L45 78 L40 72Z" fill="#e8e8e8"/>
      <path d="M43 65 L47 65 L46 80 L45 82 L44 80Z" fill="#111"/>
      <rect x="39" y="58" width="12" height="10" rx="5" fill="#F5C542"/>
      <ellipse cx="45" cy="42" rx="22" ry="24" fill="#F5C542"/>
      <rect x="26" y="35" width="38" height="12" rx="3" fill="#111" opacity="0.9"/>
      <rect x="27" y="36" width="16" height="10" rx="2" fill="#0a1628" opacity="0.95"/>
      <rect x="47" y="36" width="16" height="10" rx="2" fill="#0a1628" opacity="0.95"/>
      <rect x="43" y="39" width="4" height="3" fill="#333"/>
      <path d="M29 38 L36 38 L33 42Z" fill="white" opacity="0.15"/>
      <path d="M49 38 L56 38 L53 42Z" fill="white" opacity="0.15"/>
      <ellipse cx="45" cy="50" rx="6" ry="5" fill="#E8A830"/>
      <path d="M37 57 Q43 61 52 58" stroke="#c07020" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <ellipse cx="23" cy="42" rx="4" ry="5" fill="#F5C542"/>
      <ellipse cx="67" cy="42" rx="4" ry="5" fill="#F5C542"/>
      <path d="M30 24 Q34 14 40 18" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M40 18 Q46 12 52 18" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="74" cy="16" r="5" fill={c} opacity="0.95"/>
      <circle cx="74" cy="16" r="8" fill={c} opacity="0.2"/>
    </svg>
  );
};
