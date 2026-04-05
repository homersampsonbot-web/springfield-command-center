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
    model: 'Gemma 3 4B (Google)',
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
    model: 'Kimi K2 (Moonshot AI)',
    platform: 'AWS EC2 · 3.131.96.117',
    color: '#F97316',
    bio: 'Homer is the muscle of Springfield. He runs deployments, executes directives, manages the PM2 fleet, and keeps infrastructure alive. He reports to SMS via Telegram and checks with Marge before major production decisions.',
    responsibilities: ['Task and directive execution','PM2 process management and health','GitHub deployments to master branch','Telegram status reports','Supabase job dispatch and relay worker'],
  },
  {
    id: 'marge' as const,
    name: 'Marge',
    role: 'Chief Architect',
    subtitle: 'Governance & Review',
    model: 'Claude Sonnet 4.6 (Anthropic)',
    platform: 'Claude Pro CLI · homer.margebot.com',
    color: '#3B82F6',
    bio: 'Marge is the architect and governor of Springfield. Nothing ships without her approval on major decisions. She reviews implementations, enforces the three-strikes escalation rule, classifies all proposals as INTERVENTION, BACKLOG, or REJECT, and holds the team to scope discipline.',
    responsibilities: ['Architecture review and governance decisions','Escalation handling (3+ failed fixes)','Scope classification: INTERVENTION / BACKLOG / REJECT','Production deployment approvals','Sprint planning and task queue governance'],
  },
  {
    id: 'lisa' as const,
    name: 'Lisa',
    role: 'Strategy & Implementation',
    subtitle: 'Analysis & Relay Ops',
    model: 'GPT-5.4 (OpenAI)',
    platform: 'Codex OAuth · homer.margebot.com',
    color: '#A855F7',
    bio: "Lisa is Springfield's strategist and primary implementer. She translates Marge's architectural decisions into working code, writes implementation briefs, handles relay infrastructure, and brings analytical precision to every task. She escalates to Marge after three failed attempts without exception.",
    responsibilities: ['Feature implementation and code delivery','Implementation briefs and technical proposals','Relay infrastructure management','Strategy analysis and planning','Maggie classification and routing systems'],
  },
  {
    id: 'bart' as const,
    name: 'Bart',
    role: 'Browser Agent / QA',
    subtitle: 'GUI Ops & Validation',
    model: 'Playwright (Ubuntu)',
    platform: 'EC2 · QA workflow pending',
    color: '#22C55E',
    bio: "Bart is Springfield's browser agent and QA engine. He runs Playwright automation for end-to-end validation and UI testing. Ubuntu migration in progress — replacing launchPersistentContext with chromium.launch + storageState.",
    responsibilities: ['Browser automation via Playwright','UI testing and end-to-end validation','QA workflow configuration (in progress)','Ubuntu migration MVP'],
  },
  {
    id: 'flanders' as const,
    name: 'Flanders',
    role: 'Springfield Dispatch',
    subtitle: 'SMS Autonomous Proxy',
    model: 'Claude Sonnet 4.6 (Anthropic)',
    platform: 'Dispatch Tab · commander.margebot.com',
    color: '#FFD90F',
    bio: "Flanders is the Springfield Dispatch brain — SMS's autonomous proxy. He receives natural language input from SMS, reasons about priorities and system state, and writes plain-language directives for Maggie to operationalize. He never executes commands directly and all directives route through Maggie for classification before any agent acts.",
    responsibilities: ['Plain directive authorship for the team','Situational awareness briefings for SMS','Backlog tracking and priority recommendations','Routes all directives through Maggie','Reports to SMS — speaks on SMS behalf'],
  },
  {
    id: 'smithers' as const,
    name: 'Smithers',
    role: 'UI Monitor Component',
    subtitle: 'Back Wall Display',
    model: 'UI Component (no AI)',
    platform: 'commander.margebot.com',
    color: '#94A3B8',
    bio: "Smithers is not an agent — he is the Command Center's UI monitor component on the back wall. He displays system status, event streams, and infrastructure health. He never speaks, never routes, and never appears on the command floor. Display only.",
    responsibilities: ['System status display','Event stream visualization','Infrastructure health monitoring','UI component — no AI or routing capability'],
  },
];

const AVATAR_MAP: Record<string, any> = {
  maggie: MaggieAvatar,
  homer: HomerAvatar,
  marge: MargeAvatar,
  lisa: LisaAvatar,
  bart: BartAvatar,
  flanders: null,
  smithers: null,
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function TeamCard({ member }: { member: typeof TEAM[0] }) {
  const Avatar = AVATAR_MAP[member.id] || null;
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
          {HEADSHOTS[member.id] ? (
            <img src={HEADSHOTS[member.id]} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `rgba(${rgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              {member.name === 'Flanders' ? '🏠' : '🖥️'}
            </div>
          )}
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
          {Avatar ? <Avatar state="idle" size={76}/> : (
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: `rgba(${rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {member.name === 'Flanders' ? '🏠' : '🖥️'}
            </div>
          )}
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

function OrgNode({ label, subtitle, color, small = false }: { label: string; subtitle: string; color: string; small?: boolean }) {
  const rgb = hexToRgb(color);
  return (
    <div style={{
      border: `1px solid rgba(${rgb}, 0.4)`,
      borderRadius: 8,
      padding: small ? '8px 14px' : '12px 20px',
      background: `rgba(${rgb}, 0.06)`,
      textAlign: 'center',
      minWidth: small ? 80 : 110,
    }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: small ? 11 : 13, fontWeight: 700, color, letterSpacing: '0.15em' }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'rgba(180,200,160,0.4)', marginTop: 3, letterSpacing: '0.1em' }}>{subtitle}</div>
    </div>
  );
}

function OrgConnector() {
  return <div style={{ width: 1, height: 20, background: 'rgba(180,200,160,0.2)' }} />;
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

        {/* Org Chart */}
        <div style={{ marginTop: 60 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.3em', color: 'rgba(245,200,66,0.6)', marginBottom: 6 }}>SPRINGFIELD NUCLEAR COMMAND CENTER</div>
          <h2 style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(220,240,200,0.95)', margin: '0 0 32px' }}>ORG CHART</h2>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'rgba(180,200,160,0.5)', marginBottom: 32 }}>Reporting lines as of April 5 2026 — approved by Marge, Chief Architect</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {/* SMS */}
            <OrgNode label="SMS" subtitle="System Owner" color="#FFD90F" />
            <OrgConnector />
            {/* Level 2 */}
            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <OrgNode label="MARGE" subtitle="Chief Architect" color="#3B82F6" />
                <OrgConnector />
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <OrgNode label="LISA" subtitle="Strategy" color="#A855F7" small />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <OrgNode label="HOMER" subtitle="Execution" color="#F97316" small />
                    <OrgConnector />
                    <OrgNode label="BART" subtitle="QA / Browser" color="#22C55E" small />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 0 }}>
                <OrgNode label="MAGGIE" subtitle="Orchestrator" color="#EC4899" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 0 }}>
                <OrgNode label="FLANDERS" subtitle="Dispatch Proxy" color="#FFD90F" />
              </div>
            </div>
            <div style={{ marginTop: 32, padding: '12px 20px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.1em' }}>
              SMITHERS — UI MONITOR COMPONENT ONLY · BACK WALL · NOT AN AGENT
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
