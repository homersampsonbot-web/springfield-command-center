import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface MaggieAvatarProps {
  state: AgentState;
  size?: number;
}

export const MaggieAvatar: React.FC<MaggieAvatarProps> = ({ state, size = 110 }) => {
  const c = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mag-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="55" cy="55" r="52" fill="url(#mag-glow)"/>
      <circle cx="55" cy="55" r="50" stroke={c} strokeWidth="0.8" strokeOpacity="0.5" fill="none" strokeDasharray="5 4"/>
      <path d="M20 110 Q28 85 55 82 Q82 85 90 110Z" fill="#1a2550"/>
      <path d="M48 82 L55 90 L62 82 L60 90 L55 96 L50 90Z" fill="#e8e8f0"/>
      <path d="M53 82 L57 82 L56 97 L55 99 L54 97Z" fill="#e91e8c"/>
      <rect x="47" y="73" width="16" height="12" rx="7" fill="#F5C542"/>
      <ellipse cx="55" cy="58" rx="28" ry="30" fill="#F5C542"/>
      <rect x="34" y="32" width="42" height="12" rx="4" fill="#1a1a1a" opacity="0.88"/>
      <rect x="35" y="33" width="18" height="10" rx="3" fill="#0d1a3a" opacity="0.95"/>
      <rect x="57" y="33" width="18" height="10" rx="3" fill="#0d1a3a" opacity="0.95"/>
      <rect x="53" y="36" width="4" height="5" fill="#222"/>
      <circle cx="45" cy="54" r="7" fill="white"/>
      <circle cx="65" cy="54" r="7" fill="white"/>
      <circle cx="46" cy="55" r="4.5" fill="#2563EB"/>
      <circle cx="66" cy="55" r="4.5" fill="#2563EB"/>
      <circle cx="47" cy="53.5" r="1.8" fill="white" opacity="0.9"/>
      <circle cx="67" cy="53.5" r="1.8" fill="white" opacity="0.9"/>
      <path d="M39 47 Q44 45 49 47" stroke="#c07020" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M61 47 Q66 45 71 47" stroke="#c07020" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <ellipse cx="55" cy="62" rx="4" ry="3" fill="#E8A830"/>
      <circle cx="55" cy="70" r="6" fill="#f0f0f0"/>
      <circle cx="55" cy="70" r="4" fill="#E91E8C"/>
      <rect x="49" y="68" width="12" height="5" rx="2.5" fill="#bbb"/>
      <ellipse cx="27" cy="58" rx="5" ry="6" fill="#F5C542"/>
      <ellipse cx="83" cy="58" rx="5" ry="6" fill="#F5C542"/>
      <path d="M35 38 Q32 28 38 22 Q44 16 55 18 Q66 16 72 22 Q78 28 75 38" fill="#D4A530" opacity="0.9"/>
      <path d="M38 36 Q36 26 40 20 Q46 14 55 18" fill="#E8C040" opacity="0.4"/>
      <circle cx="88" cy="22" r="7" fill={c} opacity="0.95"/>
      <circle cx="88" cy="22" r="12" fill={c} opacity="0.2"/>
    </svg>
  );
};
