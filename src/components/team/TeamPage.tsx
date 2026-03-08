'use client';

import React from 'react';
import { HomerAvatar } from '../control-room/agents/HomerAvatar';
import { MargeAvatar } from '../control-room/agents/MargeAvatar';
import { LisaAvatar } from '../control-room/agents/LisaAvatar';
import { BartAvatar } from '../control-room/agents/BartAvatar';
import { MaggieAvatar } from '../control-room/agents/MaggieAvatar';
import { ANIMATION_CSS } from '../control-room/animations';

const TEAM = [
  {
    id: 'maggie' as const,
    name: 'Maggie',
    role: 'Orchestrator',
    model: 'Gemini 2.5 Flash',
    platform: 'Vercel Edge',
    color: '#EC4899',
    bio: 'Maggie sits at the center of Springfield operations — the silent conductor who sees everything. She classifies every incoming message, routes it to the right agent, and moderates team threads when conversations go unresolved. She never speaks unless called upon.',
    responsibilities: [
      'Message classification and envelope tagging',
      'Thread routing decisions',
      'Debate trigger detection',
      'Team thread moderation (10+ unresolved messages)',
    ],
  },
  {
    id: 'homer' as const,
    name: 'Homer',
    role: 'Execution Engine',
    model: 'OpenClaw (Claude-backed)',
    platform: 'AWS EC2 — 3.131.96.117',
    color: '#F97316',
    bio: 'Homer is the muscle of Springfield. He runs deployments, executes directives, manages infrastructure, and keeps the PM2 process fleet alive. He checks in with Marge before major decisions and reports back to SMS via Telegram every hour.',
    responsibilities: [
      'Task and directive execution',
      'PM2 process management and health',
      'GitHub deployments to master branch',
      'Hourly Telegram status reports',
      'Neon bridge polling and job dispatch',
    ],
  },
  {
    id: 'marge' as const,
    name: 'Marge',
    role: 'Architecture Lead',
    model: 'Claude Sonnet (Anthropic)',
    platform: 'Claude.ai / API',
    color: '#3B82F6',
    bio: 'Marge is the architect and governor of Springfield. Nothing reaches production without her sign-off on major decisions. She reviews implementations, enforces the three-strikes escalation rule, classifies all new proposals as INTERVENTION, BACKLOG, or REJECT, and holds the team to scope discipline.',
    responsibilities: [
      'Architecture review and governance decisions',
      'Escalation handling (3+ failed fixes)',
      'Scope classification: INTERVENTION / BACKLOG / REJECT',
      'Production deployment approvals',
      'Sprint planning and task queue governance',
    ],
  },
  {
    id: 'lisa' as const,
    name: 'Lisa',
    role: 'Strategy & Implementation',
    model: 'GPT-4o (OpenAI)',
    platform: 'ChatGPT relay — Bart Windows',
    color: '#A855F7',
    bio: 'Lisa is Springfield\'s strategist and primary implementer. She translates Marge\'s architectural decisions into working code, writes implementation briefs, handles relay infrastructure, and brings analytical precision to every task. She escalates to Marge after three failed attempts without exception.',
    responsibilities: [
      'Feature implementation and code delivery',
      'Implementation briefs and technical proposals',
      'Relay infrastructure management',
      'Strategy analysis and planning',
      'Maggie classification and routing systems',
    ],
  },
  {
    id: 'bart' as const,
    name: 'Bart',
    role: 'Browser Agent / QA',
    model: 'Windows EC2 Host',
    platform: '18.190.203.220 — Playwright',
    color: '#22C55E',
    bio: 'Bart is Springfield\'s browser agent and QA engine. He hosts the Chrome sessions that power the Marge and Lisa relays, runs Playwright automation for end-to-end validation, and will eventually migrate to Ubuntu for more reliable session management.',
    responsibilities: [
      'Marge and Lisa relay session hosting (Chrome)',
      'Browser automation via Playwright',
      'UI testing and validation',
      'Exec server at port 3005',
      'Ubuntu migration MVP proving test',
    ],
  },
];

function TeamMemberCard({ member }: { member: typeof TEAM[0] }) {
  const AvatarMap = {
    maggie: MaggieAvatar,
    homer: HomerAvatar,
    marge: MargeAvatar,
    lisa: LisaAvatar,
    bart: BartAvatar,
  };
  const Avatar = AvatarMap[member.id];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(20,20,35,0.9) 100%)',
      border: `1px solid rgba(${hexToRgb(member.color)}, 0.3)`,
      borderRadius: '16px',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'stationEntrance 0.5s ease-out forwards',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '80px', height: '80px',
        background: `radial-gradient(circle at top right, rgba(${hexToRgb(member.color)}, 0.15) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          background: `rgba(${hexToRgb(member.color)}, 0.08)`,
          border: `1px solid rgba(${hexToRgb(member.color)}, 0.2)`,
          borderRadius: '50%',
          padding: '8px',
          flexShrink: 0,
        }}>
          <Avatar state="idle" size={72} />
        </div>
        <div>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.95)',
          }}>
            {member.name}
          </div>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: member.color,
            marginTop: '4px',
          }}>
            {member.role.toUpperCase()}
          </div>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.3)',
            marginTop: '6px',
          }}>
            {member.model} · {member.platform}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: `rgba(${hexToRgb(member.color)}, 0.15)` }} />

      {/* Bio */}
      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        lineHeight: 1.7,
        color: 'rgba(255,255,255,0.55)',
        margin: 0,
      }}>
        {member.bio}
      </p>

      {/* Responsibilities */}
      <div>
        <div style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '10px',
        }}>
          PRIMARY RESPONSIBILITIES
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {member.responsibilities.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: member.color, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>◆</span>
              <span style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.6)',
              }}>
                {r}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function TeamPage() {
  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <style>{`
        @keyframes stationEntrance {
          0% { opacity: 0; transform: translateY(20px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }
        @media (max-width: 480px) {
          .team-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.05) 0%, transparent 60%)',
        padding: '40px 32px',
        color: 'white',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: 'rgba(245,200,66,0.6)',
            marginBottom: '8px',
          }}>
            SPRINGFIELD COMMAND CENTER
          </div>
          <h1 style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.95)',
            margin: 0,
          }}>
            THE TEAM
          </h1>
          <p style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '12px',
            letterSpacing: '0.08em',
          }}>
            Five agents. One command center. Zero d'oh.
          </p>
        </div>

        {/* Team grid */}
        <div className="team-grid">
          {TEAM.map((member, i) => (
            <div key={member.id} style={{ animationDelay: `${i * 0.08}s` }}>
              <TeamMemberCard member={member} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
