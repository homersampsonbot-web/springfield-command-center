"use client";

import React from 'react';
import Link from 'next/link';
import { Menu, X, Layout, Zap, Users } from 'lucide-react';

export default function AppDrawer({ isOpen, onOpen, onClose }: { isOpen: boolean; onOpen: () => void; onClose: () => void; authStamp?: string }) {
  const navItems = [
    { label: 'Mission Control', icon: <Zap size={18} />, href: '/' },
    { label: 'Control Room', icon: <Layout size={18} />, href: '/control-room' },
    { label: 'Kanban Ops', icon: <Layout size={18} />, href: '/kanban' },
    { label: 'Debates', icon: <Layout size={18} />, href: '/debate' },
    { label: 'Team', icon: <Users size={18} />, href: '/team' },
  ];

  return (
    <>
      <button
        onClick={isOpen ? onClose : onOpen}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          left: 12,
          zIndex: 110,
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

      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: 340,
          background: '#0D0D1A',
          borderRight: '1px solid rgba(255,217,15,0.2)',
          zIndex: 100,
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
          <Link
            key={idx}
            href={item.href}
            onClick={onClose}
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
              border: '1px solid transparent'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,217,15,0.05)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            <span style={{ color: '#FFD90F' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
