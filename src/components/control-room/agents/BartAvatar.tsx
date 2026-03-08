import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface BartAvatarProps {
  state: AgentState;
  size?: number;
}

export const BartAvatar: React.FC<BartAvatarProps> = ({ state, size = 90 }) => {
  const c = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="b-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="45" cy="45" r="43" fill="url(#b-glow)"/>
      <path d="M16 90 Q22 70 45 67 Q68 70 74 90Z" fill="#cc2222"/>
      <path d="M43 67 L47 67 L46 82 L45 84 L44 82Z" fill="#1a6aa8"/>
      <rect x="39" y="59" width="12" height="11" rx="5" fill="#F5C542"/>
      <ellipse cx="45" cy="53" rx="19" ry="20" fill="#F5C542"/>
      <rect x="26" y="47" width="38" height="11" rx="3" fill="#111" opacity="0.92"/>
      <rect x="27" y="48" width="16" height="9" rx="2" fill="#0a1e34" opacity="0.95"/>
      <rect x="47" y="48" width="16" height="9" rx="2" fill="#0a1e34" opacity="0.95"/>
      <rect x="43" y="51" width="4" height="4" fill="#222"/>
      <path d="M29 49 L37 49 L34 54Z" fill="white" opacity="0.12"/>
      <path d="M35 64 Q45 70 55 65" stroke="#c07020" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M38 64 Q45 68 52 65 L50 67 Q45 70 40 67Z" fill="white" opacity="0.8"/>
      <ellipse cx="26" cy="53" rx="4" ry="4.5" fill="#F5C542"/>
      <ellipse cx="64" cy="53" rx="4" ry="4.5" fill="#F5C542"/>
      <path d="M26 48 L31 34 L36 46 L39 30 L43 44 L45 26 L47 44 L51 30 L55 46 L59 34 L64 48" fill="#F5C542" stroke="#E8A830" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M28 46 Q33 43 38 45" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M52 45 Q57 43 62 46" stroke="#1a0a00" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="74" cy="16" r="5" fill={c} opacity="0.95"/>
      <circle cx="74" cy="16" r="8" fill={c} opacity="0.2"/>
    </svg>
  );
};
