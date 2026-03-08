import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface LisaAvatarProps {
  state: AgentState;
  size?: number;
}

export const LisaAvatar: React.FC<LisaAvatarProps> = ({ state, size = 100 }) => {
  const glowColor = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lisa-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#lisa-glow)" />
      {/* Body - red dress */}
      <ellipse cx="50" cy="82" rx="16" ry="12" fill="#DC2626" />
      {/* Neck */}
      <rect x="45" y="68" width="10" height="7" rx="3" fill="#F5C542" />
      {/* Head - slightly smaller than Homer/Marge */}
      <ellipse cx="50" cy="60" rx="17" ry="18" fill="#F5C542" />
      {/* Eyes - wide and bright */}
      <circle cx="43" cy="57" r="3.5" fill="white" />
      <circle cx="57" cy="57" r="3.5" fill="white" />
      <circle cx="43.5" cy="57.5" r="2" fill="#2a1a0a" />
      <circle cx="57.5" cy="57.5" r="2" fill="#2a1a0a" />
      <circle cx="44" cy="56.5" r="0.8" fill="white" opacity="0.6" />
      <circle cx="58" cy="56.5" r="0.8" fill="white" opacity="0.6" />
      {/* Eyelashes - prominent */}
      <path d="M40 55 Q41.5 53.5 43 54.5" stroke="#2a1a0a" strokeWidth="1.2" fill="none" />
      <path d="M54.5 55 Q56 53.5 57.5 54.5" stroke="#2a1a0a" strokeWidth="1.2" fill="none" />
      {/* Nose */}
      <ellipse cx="50" cy="62" rx="2.5" ry="2" fill="#E8A830" />
      {/* Smile - bright */}
      <path d="M44 67 Q50 71 56 67" stroke="#c07020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="33" cy="59" rx="3" ry="3.5" fill="#F5C542" />
      <ellipse cx="67" cy="59" rx="3" ry="3.5" fill="#F5C542" />
      {/* Lisa's starfish hair - spiky points */}
      <path d="M33 52 Q36 42 42 44 Q40 36 46 38 Q46 30 50 32 Q54 30 54 38 Q60 36 58 44 Q64 42 67 52" fill="#F5C542" stroke="#E8A830" strokeWidth="1" />
      {/* Hair outline points */}
      <path d="M42 44 Q40 36 46 38" stroke="#E8A830" strokeWidth="1" fill="none" />
      <path d="M46 38 Q46 30 50 32" stroke="#E8A830" strokeWidth="1" fill="none" />
      <path d="M50 32 Q54 30 54 38" stroke="#E8A830" strokeWidth="1" fill="none" />
      <path d="M54 38 Q60 36 58 44" stroke="#E8A830" strokeWidth="1" fill="none" />
      {/* State dot */}
      <circle cx="82" cy="18" r="5" fill={glowColor} opacity="0.9" />
    </svg>
  );
};
