import React from 'react';
import { AgentState, STATE_COLORS } from '../animations';

interface MaggieAvatarProps {
  state: AgentState;
  size?: number;
}

export const MaggieAvatar: React.FC<MaggieAvatarProps> = ({ state, size = 120 }) => {
  const glowColor = STATE_COLORS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="maggie-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maggie-halo" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Orchestrator halo ring */}
      <circle cx="60" cy="60" r="56" fill="url(#maggie-glow)" />
      <circle cx="60" cy="60" r="54" stroke={glowColor} strokeWidth="0.5" strokeOpacity="0.4" fill="none" strokeDasharray="4 4" />
      {/* Body - blue onesie */}
      <ellipse cx="60" cy="98" rx="22" ry="16" fill="#3B82F6" />
      {/* Neck/onesie collar */}
      <ellipse cx="60" cy="82" rx="12" ry="7" fill="#3B82F6" />
      {/* Head - bigger (baby proportions) */}
      <ellipse cx="60" cy="66" rx="26" ry="28" fill="#F5C542" />
      {/* Big baby eyes */}
      <circle cx="51" cy="61" r="5.5" fill="white" />
      <circle cx="69" cy="61" r="5.5" fill="white" />
      <circle cx="52" cy="62" r="3.2" fill="#1a0a0a" />
      <circle cx="70" cy="62" r="3.2" fill="#1a0a0a" />
      {/* Eye shine */}
      <circle cx="53" cy="60.5" r="1.2" fill="white" opacity="0.8" />
      <circle cx="71" cy="60.5" r="1.2" fill="white" opacity="0.8" />
      {/* Tiny eyebrows */}
      <path d="M47 56 Q51 54.5 54 56" stroke="#c07020" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M66 56 Q69 54.5 73 56" stroke="#c07020" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Nose - tiny */}
      <ellipse cx="60" cy="69" rx="3" ry="2" fill="#E8A830" />
      {/* Pacifier */}
      <circle cx="60" cy="76" r="5" fill="#E5E7EB" />
      <circle cx="60" cy="76" r="3" fill="#D1D5DB" />
      <rect x="55" y="74" width="10" height="4" rx="2" fill="#9CA3AF" />
      {/* Ears */}
      <ellipse cx="34" cy="66" rx="4" ry="5" fill="#F5C542" />
      <ellipse cx="86" cy="66" rx="4" ry="5" fill="#F5C542" />
      {/* Maggie's iconic bow/hair */}
      <path d="M48 42 Q52 36 56 42 Q60 36 64 42 Q68 36 72 42" fill="#C2185B" />
      <circle cx="60" cy="40" r="4" fill="#E91E63" />
      {/* State dot — larger for hub */}
      <circle cx="96" cy="24" r="6" fill={glowColor} opacity="0.95" />
      <circle cx="96" cy="24" r="10" fill={glowColor} opacity="0.2" />
    </svg>
  );
};
