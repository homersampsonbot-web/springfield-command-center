"use client";

import React, { useState } from 'react';
import { Menu, X, Layout, Zap, Users, ExternalLink } from 'lucide-react';

export default function AppDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  const navItems = [
    { label: 'Mission Control', icon: <Zap size={18} />, href: '/' },
    { label: 'Kanban Ops', icon: <Layout size={18} />, href: '/kanban' },
    { label: 'Team', icon: <Users size={18} />, href: '#' },
    { label: 'Relays', icon: <ExternalLink size={18} />, href: '#' },
  ];

  return (
    <>
      <button
        onClick={toggleDrawer}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top) + 12px)',
          left: 12,
          zIndex: 10000,
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'rgba(20,20,40,0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,217,15,0.3)',
          color: '#FFD90F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        }}
        aria-label="Open Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={toggleDrawer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: '#0D0D1A',
          borderRight: '1px solid rgba(255,217,15,0.2)',
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '80px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontFamily: 'Permanent Marker', color: '#FFD90F', fontSize: 24, marginBottom: 20, paddingLeft: 12 }}>
          SPRINGFIELD
        </div>
        
        {navItems.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 500,
              transition: 'background 0.2s',
              border: '1px solid transparent',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,217,15,0.05)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            <span style={{ color: '#FFD90F' }}>{item.icon}</span>
            {item.label}
          </a>
        ))}

        <div style={{ marginTop: 'auto', padding: 12, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          COMMAND CENTER v1.5
        </div>
      </div>
    </>
  );
}
