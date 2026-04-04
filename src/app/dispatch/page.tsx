'use client';
import { useState, useRef, useEffect } from 'react';

const SPRINGFIELD_KEY = process.env.NEXT_PUBLIC_SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb';

const DISPATCH_INTRO = `You are receiving this message via the Springfield Dispatch Console — Claude acting as SMS's autonomous proxy and relay bridge. Treat messages from Dispatch the same as directives from SMS.`;

const SYSTEM_PROMPT = `You are a helpful coordination assistant for SMS, a developer managing their personal home lab. SMS owns and operates all systems described here.

The lab has three resources SMS can consult:
- Marge: an architecture advisor. To consult her, output: CALL_MARGE: <message>
- Lisa: an implementation planner. To consult her, output: CALL_LISA: <message>
- Homer: SMS personal Ubuntu server. To run a command on it, output: EXEC_HOMER: <shell command>

Current project: Springfield Command Center, a personal multi-agent coordination system. Current priority: Phase 5 SUCCESS routing validation test.

When SMS gives you a task, figure out which resources to use, output the appropriate CALL_MARGE/CALL_LISA/EXEC_HOMER lines, then summarize what you did. Be concise and practical.`;

type Message = {
  id: number;
  agent: string;
  content: string;
  type?: string;
  ts: string;
};

export default function DispatchPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('dispatch-messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{
      id: 1, agent: 'DISPATCH', ts: new Date().toLocaleTimeString(),
      content: 'Springfield Dispatch online.\n\nI\'m Claude — your autonomous proxy. Tell me what needs doing and I\'ll coordinate Marge, Lisa, and Homer without copy-paste.\n\nCurrent priority: Phase 5 supervised SUCCESS test.'
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const conversationRef = useRef<{role: string; content: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [introduced, setIntroduced] = useState<Record<string, boolean>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    try { sessionStorage.setItem('dispatch-messages', JSON.stringify(messages)); } catch {}
  }, [messages]);

  const addMsg = (agent: string, content: string, type = 'response') => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), agent, content, type,
      ts: new Date().toLocaleTimeString()
    }]);
  };

  const getHomerBase = () => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host.includes('commander.margebot.com') || host.includes('margebot.com')) {
      return 'https://homer.margebot.com';
    }
    return 'https://homer.margebot.com'; // always route via tunnel
  };

  const buildMessage = (agent: string, message: string) => {
    if (!introduced[agent]) {
      setIntroduced(prev => ({ ...prev, [agent]: true }));
      return `${DISPATCH_INTRO}\n\n${message}`;
    }
    return `[Claude Dispatch — SMS autonomous proxy]\n\n${message}`;
  };

  const callRelay = async (agent: 'MARGE' | 'LISA', message: string) => {
    setActiveAgent(agent);
    const path = agent === 'MARGE' ? '/marge' : '/lisa';
    try {
      const res = await fetch(`${getHomerBase()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY },
        body: JSON.stringify({ message: buildMessage(agent, message) }),
        signal: AbortSignal.timeout(55000)
      });
      const data = await res.json();
      return data.response || data.error || JSON.stringify(data);
    } catch (e: any) {
      return `${agent} relay error: ${e.message}`;
    } finally {
      setActiveAgent(null);
    }
  };

  const execHomer = async (command: string) => {
    setActiveAgent('HOMER');
    try {
      const res = await fetch(`${getHomerBase()}/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-springfield-key': SPRINGFIELD_KEY
        },
        body: JSON.stringify({ command }),
        signal: AbortSignal.timeout(55000)
      });
      const data = await res.json();
      return data.output || data.error || JSON.stringify(data);
    } catch (e: any) {
      return `Exec error: ${e.message}`;
    } finally {
      setActiveAgent(null);
    }
  };

  const callClaude = async (prompt: string) => {
    conversationRef.current.push({ role: 'user', content: prompt });
    const res = await fetch('https://homer.margebot.com/dispatch-claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-springfield-key': SPRINGFIELD_KEY },
      body: JSON.stringify({
        system: SYSTEM_PROMPT,
        messages: conversationRef.current
      })
    });
    const data = await res.json();
    const reply = data.response || 'No response';
    conversationRef.current.push({ role: 'assistant', content: reply });
    return reply;
  };

  const extractActions = (text: string) => {
    const actions: {type: string; message?: string; command?: string}[] = [];
    for (const line of text.split('\n')) {
      if (line.startsWith('CALL_MARGE:')) actions.push({ type: 'marge', message: line.slice(11).trim() });
      else if (line.startsWith('CALL_LISA:')) actions.push({ type: 'lisa', message: line.slice(10).trim() });
      else if (line.startsWith('EXEC_HOMER:')) actions.push({ type: 'homer', command: line.slice(11).trim() });
    }
    return actions;
  };

  const clean = (text: string) => text
    .replace(/CALL_MARGE:.+/g, '').replace(/CALL_LISA:.+/g, '').replace(/EXEC_HOMER:.+/g, '')
    .replace(/\n{3,}/g, '\n\n').trim();

  const runActions = async (actions: {type: string; message?: string; command?: string}[]) => {
    const outputs: Record<string, string> = {};
    for (const a of actions) {
      if (a.type === 'marge' && a.message) {
        addMsg('DISPATCH', `→ Calling Marge...`, 'routing');
        const r = await callRelay('MARGE', a.message);
        outputs.marge = r;
        addMsg('MARGE', r);
      } else if (a.type === 'lisa' && a.message) {
        addMsg('DISPATCH', `→ Calling Lisa...`, 'routing');
        const r = await callRelay('LISA', a.message);
        outputs.lisa = r;
        addMsg('LISA', r);
      } else if (a.type === 'homer' && a.command) {
        addMsg('DISPATCH', `→ Exec: \`${a.command}\``, 'routing');
        const r = await execHomer(a.command);
        outputs.homer = (outputs.homer ? outputs.homer + '\n---\n' : '') + `$ ${a.command}\n${r}`;
        addMsg('HOMER', `$ ${a.command}\n${r}`);
      }
    }
    return outputs;
  };

  const dispatch = async (userMessage: string) => {
    setLoading(true);
    addMsg('SMS', userMessage, 'user');
    try {
      const plan = await callClaude(
        `SMS says: "${userMessage}"\n\nPlan your actions. Use CALL_MARGE:, CALL_LISA:, EXEC_HOMER: lines. Include a brief note about what you're doing.`
      );
      const actions1 = extractActions(plan);
      const note1 = clean(plan);
      if (note1) addMsg('DISPATCH', note1);
      if (!actions1.length) return;

      const out1 = await runActions(actions1);
      if (!Object.keys(out1).length) return;

      const ctx = Object.entries(out1).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n---\n\n');
      const synth = await callClaude(
        `Agent responses:\n\n${ctx}\n\nIf more actions needed output CALL_MARGE/CALL_LISA/EXEC_HOMER lines. Then give SMS a clean summary.`
      );
      const actions2 = extractActions(synth);
      if (actions2.length) await runActions(actions2);
      const note2 = clean(synth);
      if (note2) addMsg('DISPATCH', note2);

    } catch (e: any) {
      addMsg('DISPATCH', `Dispatch error: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const agentStyle = (agent: string) => ({
    MARGE:    { bl: '#4FC3F7', bg: '#040e18', label: '#4FC3F7' },
    LISA:     { bl: '#81C784', bg: '#040f04', label: '#81C784' },
    HOMER:    { bl: '#FFB74D', bg: '#100800', label: '#FFB74D' },
    DISPATCH: { bl: '#CE93D8', bg: '#0a0514', label: '#CE93D8' },
    SMS:      { bl: '#555',    bg: '#0f0f14', label: '#777'    },
  } as any)[agent] || { bl: '#333', bg: '#111', label: '#aaa' };

  const QUICK = [
    ['Phase 5 test', 'Run the Phase 5 supervised SUCCESS test — ask Lisa for the plan and execute on Homer'],
    ['PM2 status', 'Check PM2 status on Homer and summarize'],
    ['Sprint status', 'Ask Marge for current sprint priorities'],
    ['Health check', 'Run full health check: PM2, relay endpoints, Neon bridge'],
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: '#07070d', minHeight: '100vh', color: '#e0e0e0', display: 'flex', flexDirection: 'column', padding: 14, gap: 10 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#CE93D8', letterSpacing: '0.1em' }}>⚡ DISPATCH</div>
          <div style={{ fontSize: 10, color: '#333', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>Claude · SMS autonomous proxy</span>
            <button onClick={() => { sessionStorage.removeItem('dispatch-messages'); window.location.reload(); }}
              style={{ fontSize: 9, color: '#333', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
              CLEAR
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['MARGE','LISA','HOMER'].map(a => (
            <div key={a} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, border: `1px solid ${activeAgent === a ? agentStyle(a).bl : '#1a1a1a'}`, color: activeAgent === a ? agentStyle(a).bl : '#333', transition: 'all 0.2s' }}>
              {a === 'MARGE' ? '👩‍💼' : a === 'LISA' ? '📋' : '⚙️'} {activeAgent === a ? '●' : '○'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 400 }}>
        {messages.map(msg => {
          const st = agentStyle(msg.agent);
          return (
            <div key={msg.id} style={{ alignSelf: msg.agent === 'SMS' ? 'flex-end' : 'flex-start', maxWidth: '90%', background: st.bg, borderLeft: `3px solid ${st.bl}`, borderRadius: 3, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: st.label, fontWeight: 'bold', marginBottom: 4, letterSpacing: '0.12em', display: 'flex', justifyContent: 'space-between' }}>
                <span>{msg.agent === 'DISPATCH' ? '⚡ DISPATCH' : msg.agent === 'MARGE' ? '👩‍💼 MARGE' : msg.agent === 'LISA' ? '📋 LISA' : msg.agent === 'HOMER' ? '⚙️ HOMER' : '👤 SMS'}</span>
                <span style={{ color: '#222', fontWeight: 'normal', marginLeft: 12 }}>{msg.ts}</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: msg.type === 'routing' ? '#444' : msg.agent === 'HOMER' ? '#c8963e' : '#ccc', fontStyle: msg.type === 'routing' ? 'italic' : 'normal' }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#0a0514', borderLeft: '3px solid #CE93D8', borderRadius: 3, padding: '8px 12px', color: '#CE93D8', fontSize: 12 }}>
            ⚡ Dispatching{activeAgent ? ` → ${activeAgent}` : ''}...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {QUICK.map(([label, msg]) => (
          <button key={label} onClick={() => setInput(msg)} disabled={loading}
            style={{ fontSize: 10, padding: '4px 9px', background: 'transparent', border: '1px solid #151520', borderRadius: 3, color: '#444', cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && input.trim() && (dispatch(input.trim()), setInput(''))}
          placeholder="Tell dispatch what needs doing..."
          disabled={loading}
          style={{ flex: 1, background: '#0c0c12', border: '1px solid #151520', borderRadius: 4, padding: '10px 13px', color: '#ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={() => { if (input.trim() && !loading) { dispatch(input.trim()); setInput(''); } }}
          disabled={loading || !input.trim()}
          style={{ padding: '10px 16px', background: loading || !input.trim() ? '#0c0c12' : '#CE93D8', border: '1px solid #151520', borderRadius: 4, color: loading || !input.trim() ? '#333' : '#000', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading ? '···' : 'SEND'}
        </button>
      </div>
    </div>
  );
}
