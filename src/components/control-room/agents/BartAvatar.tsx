import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface BartAvatarProps {
  state: AgentState;
  size?: number;
}

export const BartAvatar: React.FC<BartAvatarProps> = ({ state, size = 100 }) => {
  const glowColor = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bart-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bart-glow)" />
      {/* Body - orange shirt */}
      <ellipse cx="50" cy="82" rx="16" ry="12" fill="#F97316" />
      {/* Neck */}
      <rect x="45" y="69" width="10" height="7" rx="3" fill="#F5C542" />
      {/* Head */}
      <ellipse cx="50" cy="61" rx="18" ry="19" fill="#F5C542" />
      {/* Eyes - mischievous */}
      <circle cx="43" cy="58" r="3.5" fill="white" />
      <circle cx="57" cy="58" r="3.5" fill="white" />
      <circle cx="43.5" cy="58.5" r="2.2" fill="#2a1a0a" />
      <circle cx="57.5" cy="58.5" r="2.2" fill="#2a1a0a" />
      <circle cx="44" cy="57.5" r="0.9" fill="white" opacity="0.6" />
      <circle cx="58" cy="57.5" r="0.9" fill="white" opacity="0.6" />
      {/* Mischievous eyebrows - angled inward */}
      <path d="M39.5 54 Q42 52.5 45 53.5" stroke="#2a1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M55 53.5 Q58 52.5 60.5 54" stroke="#2a1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="50" cy="63" rx="3" ry="2.5" fill="#E8A830" />
      {/* Smirk */}
      <path d="M44 68 Q49 72 56 69" stroke="#c07020" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="32" cy="60" rx="3.5" ry="4" fill="#F5C542" />
      <ellipse cx="68" cy="60" rx="3.5" ry="4" fill="#F5C542" />
      {/* Bart's spiky hair - 9 spikes */}
      <path d="M32 54 L36 40 L40 52 L43 36 L46 50 L50 34 L54 50 L57 36 L60 52 L64 40 L68 54" 
            fill="#F5C542" stroke="#E8A830" strokeWidth="1" strokeLinejoin="round" />
      {/* State dot */}
      <circle cx="82" cy="18" r="5" fill={glowColor} opacity="0.9" />
    </svg>
  );
};
