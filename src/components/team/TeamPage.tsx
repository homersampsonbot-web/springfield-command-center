'use client';

import React from 'react';
import { HEADSHOTS } from './headshots';
import { HomerAvatar } from '../control-room/agents/HomerAvatar';
import { MargeAvatar } from '../control-room/agents/MargeAvatar';
import { LisaAvatar } from '../control-room/agents/LisaAvatar';
import { BartAvatar } from '../control-room/agents/BartAvatar';
import { MaggieAvatar } from '../control-room/agents/MaggieAvatar';
import { ANIMATION_CSS } from '../control-room/animations';

const FONT_MONO = '"Courier New", "Lucida Console", monospace';

const TEAM = [
  {
    id: 'maggie' as const,
    name: 'Maggie',
    role: 'Orchestrator',
    subtitle: 'Central Command',
    model: 'Gemini 2.5 Flash',
    platform: 'Vercel Edge',
    color: '#EC4899',
    bio: 'Maggie is the silent conductor of Springfield — she sees everything and speaks only when summoned. Every message passes through her classification envelope before routing to the right agent. She moderates team threads when conversations go unresolved and never blocks the system flow.',
    responsibilities: ['Message classification and envelope tagging','Thread routing decisions','Debate trigger detection','Team thread moderation (10+ unresolved messages)'],
  },
  {
    id: 'homer' as const,
    name: 'Homer',
    role: 'Execution Engine',
    subtitle: 'Infrastructure Operations',
    model: 'OpenClaw (Claude-backed)',
    platform: 'AWS EC2 · 3.131.96.117',
    color: '#F97316',
    bio: 'Homer is the muscle of Springfield. He runs deployments, executes directives, manages the PM2 fleet, and keeps infrastructure alive. He reports to SMS every hour via Telegram and checks with Marge before major production decisions.',
    responsibilities: ['Task and directive execution','PM2 process management and health','GitHub deployments to master branch','Hourly Telegram status reports','Neon bridge polling and job dispatch'],
  },
  {
    id: 'marge' as const,
    name: 'Marge',
    role: 'Architecture Lead',
    subtitle: 'Governance & Review',
    model: 'Claude Sonnet (Anthropic)',
    platform: 'Claude.ai',
    color: '#3B82F6',
    bio: 'Marge is the architect and governor of Springfield. Nothing ships without her approval on major decisions. She reviews implementations, enforces the three-strikes escalation rule, classifies all proposals as INTERVENTION, BACKLOG, or REJECT, and holds the team to scope discipline.',
    responsibilities: ['Architecture review and governance decisions','Escalation handling (3+ failed fixes)','Scope classification: INTERVENTION / BACKLOG / REJECT','Production deployment approvals','Sprint planning and task queue governance'],
  },
  {
    id: 'lisa' as const,
    name: 'Lisa',
    role: 'Strategy & Implementation',
    subtitle: 'Analysis & Relay Ops',
    model: 'GPT-4o (OpenAI)',
    platform: 'ChatGPT relay · Bart Windows',
    color: '#A855F7',
    bio: "Lisa is Springfield's strategist and primary implementer. She translates Marge's architectural decisions into working code, writes implementation briefs, handles relay infrastructure, and brings analytical precision to every task. She escalates to Marge after three failed attempts without exception.",
    responsibilities: ['Feature implementation and code delivery','Implementation briefs and technical proposals','Relay infrastructure management','Strategy analysis and planning','Maggie classification and routing systems'],
  },
  {
    id: 'bart' as const,
    name: 'Bart',
    role: 'Browser Agent / QA',
    subtitle: 'GUI Ops & Validation',
    model: 'Windows EC2 Host',
    platform: '18.190.203.220 · Playwright',
    color: '#22C55E',
    bio: "Bart is Springfield's browser agent and QA engine. He hosts the Chrome sessions powering the Marge and Lisa relays, runs Playwright automation for end-to-end validation, and is the proving test for the Ubuntu migration MVP.",
    responsibilities: ['Marge and Lisa relay session hosting (Chrome)','Browser automation via Playwright','UI testing and validation','Exec server at port 3005','Ubuntu migration MVP proving test'],
  },
];

const AVATAR_MAP = {
  maggie: MaggieAvatar,
  homer: HomerAvatar,
  marge: MargeAvatar,
  lisa: LisaAvatar,
  bart: BartAvatar,
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function TeamCard({ member }: { member: typeof TEAM[0] }) {
  const Avatar = AVATAR_MAP[member.id];
  const rgb = hexToRgb(member.color);
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(10,14,8,0.98) 0%, rgba(14,18,10,0.95) 100%)',
      border: `1px solid rgba(${rgb}, 0.3)`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: 'stationBoot 0.5s ease-out forwards',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 100, height: 100,
        background: `radial-gradient(circle at top right, rgba(${rgb}, 0.12) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 0,
        borderBottom: `1px solid rgba(${rgb}, 0.2)`,
        background: `rgba(${rgb}, 0.04)`,
        padding: '20px 20px 0',
      }}>
        <div style={{
          width: 110,
          height: 130,
          flexShrink: 0,
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
          border: `1px solid rgba(${rgb}, 0.3)`,
          borderBottom: 'none',
        }}>
          <img src={HEADSHOTS[member.id]} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
        <div style={{
          width: 90,
          height: 100,
          flexShrink: 0,
          background: `rgba(${rgb}, 0.06)`,
          border: `1px solid rgba(${rgb}, 0.2)`,
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          marginLeft: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Avatar state="idle" size={76}/>
        </div>
        <div style={{ paddingLeft: 16, paddingBottom: 16, flex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '0.25em', color: `rgba(${rgb}, 0.7)`, marginBottom: 4 }}> SPRINGFIELD COMMAND </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(220,240,200,0.95)', lineHeight: 1 }}> {member.name.toUpperCase()} </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.2em', color: member.color, marginTop: 6 }}> {member.role.toUpperCase()} </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'rgba(180,200,160,0.4)', marginTop: 4, letterSpacing: '0.1em' }}> {member.subtitle.toUpperCase()} </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'rgba(180,200,160,0.5)', letterSpacing: '0.08em' }}>◈ {member.model}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'rgba(180,200,160,0.4)', letterSpacing: '0.08em' }}>◉ {member.platform}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.7, color: 'rgba(180,200,160,0.6)', margin: 0 }}> {member.bio} </p>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '0.2em', color: `rgba(${rgb}, 0.5)`, marginBottom: 8 }}> PRIMARY RESPONSIBILITIES </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {member.responsibilities.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: member.color, fontSize: 9, flexShrink: 0, marginTop: 2 }}>◆</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, lineHeight: 1.5, color: 'rgba(180,200,160,0.65)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <style>{`
        @keyframes stationBoot {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }
        @media (max-width: 500px) {
          .team-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#0c0e0a',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(120,140,80,0.06) 0%, transparent 60%)',
        padding: '40px 28px',
        color: 'white',
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.3em', color: 'rgba(245,200,66,0.6)', marginBottom: 6 }}> SPRINGFIELD NUCLEAR COMMAND CENTER </div>
          <h1 style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(220,240,200,0.95)', margin: 0 }}> OPERATIONS TEAM </h1>
          <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'rgba(180,200,160,0.4)', marginTop: 10, letterSpacing: '0.08em' }}> Five agents. One command center. Zero d'oh. </p>
        </div>
        <div className="team-grid">
          {TEAM.map((member, i) => (
            <div key={member.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <TeamCard member={member}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
