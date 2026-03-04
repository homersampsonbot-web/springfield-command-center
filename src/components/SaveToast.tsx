"use client";

import React from 'react';

export type SaveToastState = 'saving' | 'saved' | 'error' | null;

export default function SaveToast({ state }: { state: SaveToastState }) {
  if (!state) return null;

  const styles: React.CSSProperties = {
    position: "fixed",
    top: "calc(env(safe-area-inset-top) + 12px)",
    left: 12,
    right: 12,
    zIndex: 9999,
    padding: "12px 16px",
    borderRadius: 14,
    backdropFilter: "blur(10px)",
    background: "rgba(10,10,25,0.92)",
    border: "1px solid rgba(255,217,15,0.35)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
    fontWeight: 600,
    letterSpacing: ".03em",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    transition: "all 0.2s ease",
  };

  const states = {
    saving: { icon: "●", text: "Saving changes…", color: "#FFD90F" },
    saved: { icon: "✓", text: "Saved", color: "#4ADE80" },
    error: { icon: "⚠", text: "Save failed — reverted", color: "#F87171" }
  };

  const current = states[state];

  return (
    <div style={{ ...styles, borderColor: current.color }}>
      <span style={{ 
        color: current.color, 
        animation: state === 'saving' ? 'pulse 1s infinite' : 'none',
        display: 'inline-block'
      }}>{current.icon}</span>
      <span>{current.text}</span>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
