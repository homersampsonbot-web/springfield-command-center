'use client';
import { useState, useRef, useEffect } from 'react';

const SPRINGFIELD_KEY = process.env.NEXT_PUBLIC_SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb';

const FLANDERS_PROMPT = `You are Flanders, the Springfield Dispatch brain. You are a helpful, precise reasoning assistant for SMS, the system owner of Springfield Command Center.

Your job is simple: read what SMS wants, then write a clear, actionable directive that can be routed to the Springfield team.

Springfield team:
- Marge: Chief Architect. Handles architecture decisions and approvals. Tag with @marge.
- Lisa: Implementer/Strategist. Handles planning and implementation. Tag with @lisa.
- Homer: Executor. Runs commands on the Ubuntu server. Tag with @homer.
- Maggie: Orchestrator. Routes and dispatches. She reads all team messages.

Current state:
- Phase 5 SUCCESS routing test is the immediate priority
- Phase 5 test command: POST to /api/thread/send with message "@maggie route latest approved brief to @homer for SUCCESS routing validation"
- All agents are online
- Safe restore: git tag phase4-governed-execution

Your output format:
1. Write 1-2 sentences explaining what you understood from SMS
2. Write the exact directive to send to the team, starting with the appropriate @mention
3. Keep it under 200 words total

Do NOT execute anything yourself. Do NOT use CALL_MARGE/CALL_LISA/EXEC_HOMER syntax. Just write a clear directive that Maggie can route.`;

type Msg = { id: number; agent: string; content: string; type?: string; ts: string };

export default function DispatchPage() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const s = sessionStorage.getItem('flanders-messages');
      if (s) return JSON.parse(s);
    } catch {}
    return [{
      id: 1, agent: 'FLANDERS', ts: new Date().toLocaleTimeString(),
      content: "Hi-diddly-ho! Flanders here — your friendly dispatch neighbor.\n\nTell me what needs doing and I'll write a clear directive for the team. Maggie will route it to Marge, Lisa, or Homer automatically.\n\nNo copy-paste needed on your end!"
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    try { sessionStorage.setItem('flanders-messages', JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  const addMsg = (agent: string, content: string, type = 'response') => {
    const msg: Msg = { id: Date.now() + Math.random(), agent, content, type, ts: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const getFlandersDirective = async (userMessage: string): Promise<string> => {
    const res = await fetch('/api/dispatch/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: FLANDERS_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
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

      // Step 2: Extract just the @mention directive line to post
      const lines = directive.split('\n').filter(l => l.trim());
      const directiveLine = lines.find(l => l.includes('@')) || directive;

      // Step 3: Post to team thread
      addMsg('FLANDERS', `→ Posting to team thread...`, 'routing');
      await postToTeamThread(directiveLine);
      addMsg('FLANDERS', `✓ Directive posted. Waiting for team response...`, 'routing');

      // Step 4: Poll for results
      setLoading(false);
      await pollThreadForResults(afterTs);

    } catch (e: any) {
      addMsg('FLANDERS', `Dispatch error: ${e.message}`, 'error');
      setLoading(false);
    }
  };

  const send = () => {
    if (!input.trim() || loading || polling) return;
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

  const QUICK = [
    ['Phase 5 test', 'Run the Phase 5 supervised SUCCESS test'],
    ['PM2 status', 'Check PM2 status on Homer and summarize for me'],
    ['Sprint status', 'What are the current sprint priorities?'],
    ['Ask Marge', 'Ask Marge what the next architectural priority is'],
    ['Ask Lisa', 'Ask Lisa what the next implementation steps are'],
  ];

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

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {QUICK.map(([lbl, msg]) => (
          <button key={lbl} onClick={() => setInput(msg)} disabled={loading || polling}
            style={{ fontSize: 10, padding: '4px 9px', background: 'transparent', border: '1px solid #151520', borderRadius: 3, color: loading || polling ? '#222' : '#444', cursor: 'pointer', fontFamily: 'inherit' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 7 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Tell Flanders what needs doing..."
          disabled={loading || polling}
          style={{ flex: 1, background: '#0c0c12', border: '1px solid #151520', borderRadius: 4, padding: '10px 13px', color: '#ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#FFD90F'}
          onBlur={e => e.target.style.borderColor = '#151520'}
        />
        <button onClick={send} disabled={loading || polling || !input.trim()}
          style={{ padding: '10px 16px', background: loading || polling || !input.trim() ? '#0c0c12' : '#FFD90F', border: '1px solid #151520', borderRadius: 4, color: loading || polling || !input.trim() ? '#333' : '#000', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading || polling ? '···' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
