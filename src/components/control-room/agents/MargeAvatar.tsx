import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface MargeAvatarProps {
  state: AgentState;
  size?: number;
}

export const MargeAvatar: React.FC<MargeAvatarProps> = ({ state, size = 100 }) => {
  const glowColor = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="marge-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#marge-glow)" />
      {/* Body - red dress */}
      <ellipse cx="50" cy="80" rx="18" ry="14" fill="#C0392B" />
      {/* Neck */}
      <rect x="44" y="63" width="12" height="8" rx="4" fill="#F5C542" />
      {/* Head */}
      <ellipse cx="50" cy="58" rx="18" ry="20" fill="#F5C542" />
      {/* Eyes */}
      <circle cx="43" cy="55" r="3.5" fill="white" />
      <circle cx="57" cy="55" r="3.5" fill="white" />
      <circle cx="43.5" cy="55.5" r="2" fill="#2a1a0a" />
      <circle cx="57.5" cy="55.5" r="2" fill="#2a1a0a" />
      <circle cx="44" cy="54.5" r="0.8" fill="white" opacity="0.6" />
      <circle cx="58" cy="54.5" r="0.8" fill="white" opacity="0.6" />
      {/* Eyelashes */}
      <path d="M40 52.5 Q41 51 43 52" stroke="#2a1a0a" strokeWidth="1" fill="none" />
      <path d="M54 52.5 Q55 51 57 52" stroke="#2a1a0a" strokeWidth="1" fill="none" />
      {/* Nose */}
      <ellipse cx="50" cy="60" rx="3" ry="2.5" fill="#E8A830" />
      {/* Smile */}
      <path d="M44 65 Q50 69 56 65" stroke="#c07020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="32" cy="57" rx="3.5" ry="4" fill="#F5C542" />
      <ellipse cx="68" cy="57" rx="3.5" ry="4" fill="#F5C542" />
      {/* Marge's iconic tall blue hair */}
      <path d="M32 48 Q30 30 38 18 Q44 8 50 6 Q56 8 62 18 Q70 30 68 48" fill="#1E3A8A" />
      <path d="M35 46 Q33 28 40 16 Q46 7 50 6" fill="#2563EB" opacity="0.4" />
      {/* Hair texture lines */}
      <path d="M42 10 Q44 20 42 32" stroke="#1E3A8A" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M50 6 Q50 18 49 30" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.4" />
      {/* State dot */}
      <circle cx="82" cy="18" r="5" fill={glowColor} opacity="0.9" />
    </svg>
  );
};
