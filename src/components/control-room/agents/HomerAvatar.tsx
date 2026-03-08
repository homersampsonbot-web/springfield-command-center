import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface HomerAvatarProps {
  state: AgentState;
  size?: number;
}

export const HomerAvatar: React.FC<HomerAvatarProps> = ({ state, size = 100 }) => {
  const glowColor = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="homer-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ambient glow */}
      <circle cx="50" cy="50" r="48" fill="url(#homer-glow)" />
      {/* Body / shirt - grey */}
      <ellipse cx="50" cy="78" rx="22" ry="16" fill="#5a5a6e" />
      {/* White shirt collar */}
      <ellipse cx="50" cy="65" rx="10" ry="6" fill="#e8e8f0" />
      {/* Head - Homer yellow */}
      <ellipse cx="50" cy="46" rx="22" ry="24" fill="#F5C542" />
      {/* Stubble / five o'clock shadow - lower face */}
      <ellipse cx="50" cy="60" rx="14" ry="7" fill="#E8B030" opacity="0.5" />
      {/* Eyes */}
      <circle cx="41" cy="43" r="4.5" fill="white" />
      <circle cx="59" cy="43" r="4.5" fill="white" />
      <circle cx="42" cy="43.5" r="2.5" fill="#2a1a0a" />
      <circle cx="60" cy="43.5" r="2.5" fill="#2a1a0a" />
      {/* Eye whites shine */}
      <circle cx="43" cy="42" r="1" fill="white" opacity="0.6" />
      <circle cx="61" cy="42" r="1" fill="white" opacity="0.6" />
      {/* Nose */}
      <ellipse cx="50" cy="51" rx="5" ry="4" fill="#E8A830" />
      {/* Mouth - slight grin */}
      <path d="M43 57 Q50 62 57 57" stroke="#c07020" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Ear left */}
      <ellipse cx="28" cy="46" rx="4" ry="5" fill="#F5C542" />
      {/* Ear right */}
      <ellipse cx="72" cy="46" rx="4" ry="5" fill="#F5C542" />
      {/* Hair - Homer's signature few strands */}
      <path d="M35 28 Q38 18 44 22" stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M44 22 Q50 16 56 22" stroke="#2a1a0a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* State indicator dot */}
      <circle cx="82" cy="18" r="5" fill={glowColor} opacity="0.9" />
    </svg>
  );
};
