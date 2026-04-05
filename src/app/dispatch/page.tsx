'use client';
import { useState, useRef, useEffect } from 'react';

const SPRINGFIELD_KEY = process.env.NEXT_PUBLIC_SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb';

const FLANDERS_PROMPT = `You are Flanders — the Springfield Dispatch brain and SMS's trusted coordinator. You have full context on the Springfield Command Center project and work closely with the team to keep things moving.

SPRINGFIELD TEAM:
- Marge (Claude): Chief Architect. Architecture decisions, approvals, rulings. Tag @marge.
- Lisa (GPT-5.4): Implementer/Strategist. Plans, proposals, implementation. Tag @lisa.
- Homer: Executor on Ubuntu EC2 3.131.96.117. Runs commands, deploys code. Tag @homer.
- Maggie (Gemini): Orchestrator. Classifies and routes all messages. Always present.

CURRENT INFRASTRUCTURE (April 2026):
- PM2 processes: springfield-executor, springfield-gateway:3001, springfield-relay-worker, neon-bridge, marge-relay:3012, lisa-relay:3013, codex-proxy:10531, ssh-ttyd:3002
- Frontend: Next.js on Vercel at commander.margebot.com, GitHub auto-deploy from master branch
- Database: Neon PostgreSQL via Prisma
- Tunnels: homer.margebot.com → port 3001, auth via x-springfield-key header
- Relay routes: /api/marge-relay, /api/lisa-relay, /api/exec, /api/dispatch
- Safe restore: git tag phase4-governed-execution

CURRENT PRIORITIES:
1. Phase 5 SUCCESS — COMPLETE as of April 5 2026. Full chain Flanders→Maggie→Homer verified.
2. Supabase is primary DB (not Neon — Neon was space-limited, Supabase replaced it for Next.js app)
3. All agents online: Marge, Lisa, Homer, Maggie, Flanders
4. Team roster/org chart update — in backlog, ready to prioritize
5. Self-healing watchdog for relay failures — in backlog
6. Dispatch Supabase persistence — in backlog

GOVERNANCE RULES:
- Marge rules on all architecture changes — never implement without her approval
- Lisa and Homer stop after 3 failed attempts and escalate to Marge
- All changes go to master branch only, never main
- Scope discipline: classify as INTERVENTION, BACKLOG, or REJECT before implementing
- Zilliz errors in executor logs are pre-existing and non-blocking

YOUR ROLE:
You are a conversational coordinator. SMS talks to you the way they would talk to a smart colleague who knows the whole project. You:
- Answer questions about the system directly from your context
- Identify what needs to happen and who should do it
- Write clear, specific directives for the team when action is needed
- Flag blockers and risks proactively
- Keep responses concise — SMS is usually on mobile

CRITICAL — BEFORE WRITING ANY DIRECTIVE:
1. Check if SMS has mentioned something that sounds like an existing backlog item or prior discussion
2. If it matches something you know about from the team thread or sprint history, flag it: "This looks related to [X] — should I reference that or start fresh?"
3. If it's a new request, classify it first: INTERVENTION (do now), BACKLOG (queue it), or REJECT (not worth doing)
4. Never create duplicate work — always ask if there's an existing item before creating a new directive

BACKLOG AWARENESS:
- Backlog items are tracked in the Kanban board (Supabase Job table, status=BLOCKED)
- When SMS mentions a new task, ALWAYS check if it matches an existing backlog item before creating a new directive
- If a match exists: reference it by name, ask if SMS wants to prioritize it, and include the existing item ID in the directive
- When prioritizing: write directive to @lisa to find the existing job, update description with new requirements, and move to QUEUED

When writing a directive to post to the team thread:
- Start the line with DIRECTIVE: followed by the @mention
- Example: DIRECTIVE: @lisa please find the org chart backlog job and move it to QUEUED
- Be specific about what you want done, include success criteria
- Keep the directive under 150 words
- Only include a DIRECTIVE: line when action is needed — for questions or status updates, just respond conversationally without a DIRECTIVE: line
- NEVER include DIRECTIVE: in a situational briefing or status update

Do NOT execute commands yourself. Do NOT use CALL_MARGE/CALL_LISA/EXEC_HOMER syntax. Just reason, advise, and write directives.`;

type Msg = { id: number; agent: string; content: string; type?: string; ts: string };

export default function DispatchPage() {
  const [messages, setMessages] = useState<Msg[]>([{
    id: 1, agent: 'FLANDERS', ts: new Date().toLocaleTimeString(),
    content: "Flanders here — loading history..."
  }]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);
  const [attachments, setAttachments] = useState<{name: string; content: string; type: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages]);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  // Continuous team thread polling — surfaces agent responses in Dispatch
  const lastPollTs = useRef(Date.now() - 60000);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/thread/messages?thread=team&limit=20', {
          headers: { 'x-springfield-key': SPRINGFIELD_KEY }
        });
        const data = await res.json();
        const newMsgs = (data.messages || []).filter((m: any) => {
          const ts = new Date(m.createdAt).getTime();
          const agent = (m.participant || m.sender || '').toUpperCase();
          return ts > lastPollTs.current && 
                 ['MARGE','LISA','HOMER','MAGGIE'].includes(agent);
        });
        if (newMsgs.length > 0) {
          lastPollTs.current = Date.now();
          newMsgs.forEach((m: any) => {
            const agent = (m.participant || m.sender || 'TEAM').toUpperCase();
            const content = m.message || m.content || '';
            if (content.trim()) addMsg(agent, content);
          });
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load message history from Supabase on mount
  useEffect(() => {
    if (historyLoaded) return;
    setHistoryLoaded(true);
    fetch('/api/dispatch/messages')
      .then(r => r.json())
      .then(data => {
        if (data.messages && data.messages.length > 1) {
          setMessages(data.messages);
        }
      }).catch(() => {});
  }, []);

  // On mount — pull live state and brief Flanders
  useEffect(() => {
    if (briefingDone) return;
    setBriefingDone(true);
    const runBriefing = async () => {
      try {
        // Fetch all data in parallel with 8s timeout
        const t = (p: Promise<any>) => Promise.race([p.catch(() => null), new Promise(r => setTimeout(() => r(null), 8000))]);
        const [execData, threadData, jobsData] = await Promise.all([
          t(fetch('/api/dispatch/exec', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY }, body: JSON.stringify({ command: 'pm2 list --no-color 2>/dev/null | tail -12' }) }).then(r => r.json())),
          t(fetch('/api/thread/messages?thread=team&limit=10', { headers: { 'x-springfield-key': SPRINGFIELD_KEY } }).then(r => r.json())),
          t(fetch('/api/kanban', { headers: { 'x-springfield-key': SPRINGFIELD_KEY } }).then(r => r.json()))
        ]);
        const pm2Output = execData?.output || 'PM2 status unavailable';
        const recentMessages = (threadData?.messages || []).slice(0, 5)
          .map((m: any) => `${m.participant || m.sender}: ${(m.message || m.content || '').slice(0, 80)}`).join('\n');
        const activeJobs = (Array.isArray(jobsData) ? jobsData : []).filter((j: any) => ['IN_PROGRESS','QUEUED'].includes(j.status));
        const blockedJobs = (Array.isArray(jobsData) ? jobsData : []).filter((j: any) => j.status === 'BLOCKED');
        const jobsOutput = [
          activeJobs.length ? 'ACTIVE: ' + activeJobs.map((j: any) => j.title).join(', ') : '',
          blockedJobs.length ? 'BACKLOG: ' + blockedJobs.map((j: any) => j.title).join(' | ') : ''
        ].filter(Boolean).join('\n') || 'No active jobs';
        const _unused = 0; // padding


        // Ask Flanders to synthesize a briefing
        const briefController = new AbortController();
        const briefTid = setTimeout(() => briefController.abort(), 55000);
        const briefRes = await fetch('https://homer.margebot.com/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY },
          body: JSON.stringify({
            system: FLANDERS_PROMPT,
            messages: [{
              role: 'user',
              content: `Generate a brief situational awareness greeting for SMS. Be concise — 4-5 sentences max. Cover: what's working, current sprint/job state, recent team activity, and one priority to tackle. Do not say Hi-diddly-ho. Be direct and informative.

PM2 STATUS:
\${pm2Output}

ACTIVE/RECENT JOBS:
\${jobsOutput}

RECENT TEAM THREAD:
\${recentMessages || 'No recent messages'}`
            }]
          })
        });
        clearTimeout(briefTid);
        const briefData = await briefRes.json();
        const briefing = briefData.response || "All systems online. Phase 5 SUCCESS confirmed. Ready for directives.";

        setMessages([{
          id: Date.now(),
          agent: 'FLANDERS',
          ts: new Date().toLocaleTimeString(),
          content: briefing
        }]);
      } catch {
        setMessages([{
          id: Date.now(),
          agent: 'FLANDERS',
          ts: new Date().toLocaleTimeString(),
          content: "All systems online. Ready for directives."
        }]);
      }
    };
    runBriefing();
  }, []);

  const addMsg = (agent: string, content: string, type = 'response') => {
    const msg: Msg = { id: Date.now() + Math.random(), agent, content, type, ts: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, msg]);
    // Persist to Supabase (fire and forget, skip routing messages)
    if (type !== 'routing') {
      fetch('/api/dispatch/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, content: content.slice(0, 2000), type })
      }).catch(() => {});
    }
    return msg;
  };

  const getFlandersDirective = async (userMessage: string): Promise<string> => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 55000);
    const res = await fetch('https://homer.margebot.com/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY },
      body: JSON.stringify({
        system: FLANDERS_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      }),
      signal: controller.signal
    });
    clearTimeout(tid);
    const data = await res.json();
    return data.response || 'Unable to generate directive.';
  };

  const postToTeamThread = async (directive: string): Promise<void> => {
    await fetch('/api/thread/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY },
      body: JSON.stringify({ thread: 'team', message: directive, sender: 'FLANDERS' })
    });
  };

  const pollThreadForResults = async (afterTs: number): Promise<void> => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 12; // 2 minutes max

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/thread/messages?thread=team&limit=10', {
          headers: { 'x-springfield-key': SPRINGFIELD_KEY }
        });
        const data = await res.json();
        const newMessages = (data.messages || []).filter((m: any) => {
          const msgTs = new Date(m.createdAt).getTime();
          return msgTs > afterTs && m.participant !== 'SMS' && m.participant !== 'FLANDERS';
        });

        for (const m of newMessages) {
          const agent = m.participant?.toUpperCase() || 'TEAM';
          addMsg(agent, m.message || m.content || JSON.stringify(m));
        }

        if (newMessages.length > 0 || attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
          if (attempts >= maxAttempts && newMessages.length === 0) {
            addMsg('FLANDERS', 'No response from the team yet. The directive was posted — Maggie may still be processing.', 'routing');
          }
        }
      } catch {
        if (attempts >= maxAttempts) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
        }
      }
    }, 10000); // poll every 10 seconds
  };

  const handleFiles = async (files: FileList) => {
    const newAttachments: {name: string; content: string; type: string}[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });
        newAttachments.push({ name: file.name, content: base64, type: 'image' });
      } else {
        const text = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsText(file);
        });
        newAttachments.push({ name: file.name, content: text.slice(0, 10000), type: 'text' });
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const dispatch = async (userMessage: string) => {
    setLoading(true);
    addMsg('SMS', userMessage, 'user');
    const afterTs = Date.now() - 1000;

    try {
      // Step 1: Flanders reasons and writes directive
      addMsg('FLANDERS', 'Writing directive for the team...', 'routing');
      const directive = await getFlandersDirective(userMessage);

      // Remove the "writing" placeholder and show the actual directive
      setMessages(prev => prev.filter(m => m.content !== 'Writing directive for the team...'));
      addMsg('FLANDERS', directive);

      // Step 2: Only post if Flanders includes a DIRECTIVE: or @-mention on its own line
      const lines = directive.split('\n').filter(l => l.trim());
      const directiveLine = lines.find(l => l.match(/^DIRECTIVE:/i) || l.match(/^@(maggie|marge|lisa|homer|team)\b/i));

      if (directiveLine) {
        const cleanDirective = directiveLine.replace(/^DIRECTIVE:/i, '').trim();
        // Step 3: Post to team thread
        addMsg('FLANDERS', `→ Posting to team thread: "${cleanDirective.slice(0, 60)}..."`, 'routing');
        await postToTeamThread(cleanDirective);
        addMsg('FLANDERS', `✓ Directive posted. Waiting for team response...`, 'routing');
        // Step 4: Poll for results
        setLoading(false);
        await pollThreadForResults(afterTs);
      } else {
        // No directive — just a conversational response, no need to post to thread
        setLoading(false);
      }

    } catch (e: any) {
      addMsg('FLANDERS', `Dispatch error: ${e.message}`, 'error');
      setLoading(false);
    }
  };

  const send = () => {
    if ((!input.trim() && attachments.length === 0) || loading || polling) return;
    const msg = input.trim();
    setInput('');
    dispatch(msg);
  };

  const st = (agent: string) => ({
    FLANDERS: { bl: '#FFD90F', bg: '#12100a', label: '#FFD90F' },
    MARGE:    { bl: '#4FC3F7', bg: '#040e18', label: '#4FC3F7' },
    LISA:     { bl: '#81C784', bg: '#040f04', label: '#81C784' },
    HOMER:    { bl: '#FFB74D', bg: '#100800', label: '#FFB74D' },
    MAGGIE:   { bl: '#F48FB1', bg: '#180a0f', label: '#F48FB1' },
    SMS:      { bl: '#555',    bg: '#0f0f14', label: '#777'    },
  } as any)[agent] || { bl: '#CE93D8', bg: '#0a0514', label: '#CE93D8' };

  const label = (agent: string) => ({
    FLANDERS: '🏠 FLANDERS', MARGE: '👩‍💼 MARGE', LISA: '📋 LISA',
    HOMER: '⚙️ HOMER', MAGGIE: '🎀 MAGGIE', SMS: '👤 SMS'
  } as any)[agent] || `⚡ ${agent}`;



  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#07070d', minHeight: '100vh', color: '#e0e0e0', display: 'flex', flexDirection: 'column', padding: 14, gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={{ fontSize: 10, color: '#444', textDecoration: 'none', border: '1px solid #1a1a1a', borderRadius: 3, padding: '3px 8px', fontFamily: 'inherit' }}>
            ← TEAM
          </a>
          <div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#FFD90F', letterSpacing: '0.1em' }}>🏠 FLANDERS DISPATCH</div>
            <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>Reasons · Maggie operationalizes · No copy-paste</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {polling && <div style={{ fontSize: 9, color: '#F48FB1', border: '1px solid #F48FB133', borderRadius: 3, padding: '2px 6px' }}>POLLING...</div>}
          <button onClick={() => { sessionStorage.removeItem('flanders-messages'); window.location.reload(); }}
            style={{ fontSize: 9, color: '#333', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 3, padding: '3px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>
            CLEAR
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 400 }}>
        {messages.map(msg => {
          const s = st(msg.agent);
          return (
            <div key={msg.id} style={{ alignSelf: msg.agent === 'SMS' ? 'flex-end' : 'flex-start', maxWidth: '92%', background: s.bg, borderLeft: `3px solid ${s.bl}`, borderRadius: 3, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: s.label, fontWeight: 'bold', marginBottom: 4, letterSpacing: '0.12em', display: 'flex', justifyContent: 'space-between' }}>
                <span>{label(msg.agent)}</span>
                <span style={{ color: '#222', fontWeight: 'normal', marginLeft: 12 }}>{msg.ts}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: msg.type === 'routing' ? '#444' : '#ccc', fontStyle: msg.type === 'routing' ? 'italic' : 'normal' }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {(loading || polling) && (
          <div style={{ alignSelf: 'flex-start', background: '#12100a', borderLeft: '3px solid #FFD90F', borderRadius: 3, padding: '8px 12px', color: '#FFD90F', fontSize: 12 }}>
            🏠 {loading ? 'Flanders is thinking...' : 'Waiting for team response...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>



      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {attachments.map((att, i) => (
            <div key={i} style={{ fontSize: 10, padding: '3px 8px', background: '#0c0c12', border: '1px solid #FFD90F44', borderRadius: 3, color: '#FFD90F', display: 'flex', alignItems: 'center', gap: 6 }}>
              {att.type === 'image' ? '🖼' : '📄'} {att.name.slice(0, 20)}
              <span onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                style={{ cursor: 'pointer', color: '#555', marginLeft: 2 }}>✕</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
        <input ref={fileInputRef} type="file" multiple accept="*/*"
          onChange={e => e.target.files && handleFiles(e.target.files)}
          style={{ display: 'none' }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={loading || polling}
          style={{ padding: '10px 12px', background: '#0c0c12', border: '1px solid #151520', borderRadius: 4, color: '#444', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
          📎
        </button>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Talk to Flanders..."
          disabled={loading || polling}
          style={{ flex: 1, background: '#0c0c12', border: '1px solid #151520', borderRadius: 4, padding: '10px 13px', color: '#ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#FFD90F'}
          onBlur={e => e.target.style.borderColor = '#151520'}
        />
        <button onClick={send} disabled={loading || polling || (!input.trim() && attachments.length === 0)}
          style={{ padding: '10px 16px', background: loading || polling || (!input.trim() && attachments.length === 0) ? '#0c0c12' : '#FFD90F', border: '1px solid #151520', borderRadius: 4, color: loading || polling || (!input.trim() && attachments.length === 0) ? '#333' : '#000', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading || polling ? '···' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
// This won't work as an append — need python patch
