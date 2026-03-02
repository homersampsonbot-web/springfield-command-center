'use client';
import { useState, useEffect, useRef } from 'react';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [results, setResults] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, {role:string,text:string}[]>>({});
  const [chatInput, setChatInput] = useState<Record<string,string>>({});
  const [gatewayStatus, setGatewayStatus] = useState<Record<string,string>>({ homer: 'checking', marge: 'checking', lisa: 'checking', bart: 'checking', zilliz: 'checking' });
  const [activeTab, setActiveTab] = useState('directives');
  const [debateTopic, setDebateTopic] = useState('');
  const [debateResponses, setDebateResponses] = useState<{marge?:string, lisa?:string} | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [toast, setToast] = useState<{message:string, type:string} | null>(null);
  const lastResultId = useRef<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/results`, {
          headers: { 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' }
        });
        const d = await r.json();
        if (d.results && d.results.length > 0) {
          const latest = d.results[0];
          setResults(d.results.slice(0, 10));
          
          if (lastResultId.current && latest.taskId !== lastResultId.current) {
             setToast({ 
               message: `Task ${latest.status.toUpperCase()}: ${latest.result.slice(0,40)}...`, 
               type: latest.status === 'failed' ? 'error' : 'success' 
             });
             setTimeout(() => setToast(null), 5000);
          }
          lastResultId.current = latest.taskId;
        }
      } catch {}
      
      try {
        const s = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
        const sData = await s.json();
        setGatewayStatus(prev => ({ ...prev, homer: sData.status === 'alive' ? 'online' : 'offline' }));
      } catch {
        setGatewayStatus(prev => ({ ...prev, homer: 'offline' }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [auth]);

  const handleLogin = async () => {
    if (pin === '1234' || pin === '5092') { // Local PIN check for demo/simplicity or replace with real auth
      setAuth(true);
    } else {
      alert('Invalid PIN');
      setPin('');
    }
  };

  if (!auth) return (
    <div style={{ minHeight:'100vh', background:'#0D0D1A', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24 }}>
      <div style={{ fontFamily:'Permanent Marker', fontSize:48, color:'#FFD90F', textShadow:'0 0 30px #FFD90F88', display:'flex', alignItems:'center', gap:12 }}>
        <img src="/icons/homer.webp" alt="Homer" style={{ width:48, height:48, borderRadius:'50%', border:'2px solid #FFD90F', objectFit:'cover' }} />
        SPRINGFIELD
      </div>
      <div style={{ fontFamily:'Permanent Marker', fontSize:24, color:'#fff', marginBottom:16 }}>Command Center</div>
      <input 
        type="password" 
        placeholder="Enter PIN" 
        value={pin} 
        onChange={e => setPin(e.target.value)} 
        onKeyDown={e => e.key === 'Enter' && handleLogin()} 
        style={{ padding:'12px 24px', borderRadius:12, border:'2px solid #FFD90F', background:'#1a1a2e', color:'#fff', fontSize:18, textAlign:'center', outline:'none' }} 
      />
      <button 
        onClick={handleLogin} 
        style={{ padding:'12px 32px', background:'#FFD90F', color:'#000', border:'none', borderRadius:12, fontFamily:'Permanent Marker', fontSize:20, cursor:'pointer' }}
      > 
        ENTER 
      </button>
    </div>
  );

  const sendDirective = async () => {
    if (!directive.trim()) return;
    setStatus('Dispatching...');
    try {
      const r = await fetch(`${BASE}/task`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' }, 
        body: JSON.stringify({ directive }) 
      });
      const d = await r.json();
      setStatus(`✅ Dispatched — Task ID: ${d.taskId?.slice(0,8)}`);
      setDirective('');
    } catch {
      setStatus('❌ Send failed');
    }
  };

  const sendDebate = async () => {
    if (!debateTopic.trim()) return;
    setIsDebating(true);
    setDebateResponses(null);
    try {
      const r = await fetch(`${BASE}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' },
        body: JSON.stringify({ topic: debateTopic })
      });
      const d = await r.json();
      setDebateResponses(d);
    } catch {
      alert('Debate failed');
    } finally {
      setIsDebating(false);
    }
  };

  const sendChat = async (agentId: string) => {
    const msg = chatInput[agentId];
    if (!msg?.trim()) return;
    setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'user', text:msg }] }));
    setChatInput(c => ({ ...c, [agentId]: '' }));
    
    let url = `${BASE}/ask`;
    if (agentId === 'marge') url = 'http://18.190.203.220:3003/relay';
    if (agentId === 'lisa') url = 'http://18.190.203.220:3004/relay';

    try {
      const r = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' }, 
        body: JSON.stringify({ message: msg }) 
      });
      const d = await r.json();
      setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'assistant', text: d.response || d.reply || 'No response' }] }));
    } catch {
      setChatMessages(m => ({ ...m, [agentId]: [...(m[agentId]||[]), { role:'assistant', text:'Connection failed.' }] }));
    }
  };

  const glassCard = { 
    background:'rgba(255,255,255,0.05)', 
    border:'1px solid rgba(255,217,15,0.2)', 
    borderRadius:16, 
    padding:20, 
    backdropFilter:'blur(10px)' 
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D1A', padding:'12px', paddingBottom:80, maxWidth:'100vw', overflowX:'hidden' }}>
      {toast && (
        <div style={{ 
          position:'fixed', top:20, right:20, left:20, zIndex:1000,
          background: toast.type === 'error' ? '#FF4444' : '#7ED321',
          color: '#fff', padding: '12px 20px', borderRadius: 12,
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, sans-serif', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', lineHeight:1, gap:0 }}>
          <span style={{ fontSize:20, display:'block', margin:0, padding:0 }}>🍩</span>
          <div style={{ fontFamily:'Permanent Marker', fontSize:19, color:'#FFD90F', margin:0, padding:0, lineHeight:1 }}>Springfield</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['homer', 'marge', 'lisa', 'bart'].map(agent => (
             <div key={agent} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus[agent]==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
              <img src={`/icons/${agent}.webp`} alt={agent} style={{ width:23, height:23, borderRadius:'50%', objectFit:'cover', border:'1px solid #FFD90F' }} />
              {agent.toUpperCase()} <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus[agent]==='online'?'#7ED321':'#FF4444' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...glassCard, border:'2px solid #FFD90F', marginBottom:20 }}>
        <div style={{ fontFamily:'Permanent Marker', fontSize:28, color:'#FFD90F', textAlign:'center', marginBottom:16 }}>🎙️ PODIUM</div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {['directives','homer','marge','lisa','debate','terminal','kanban'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ flex:1, padding:'10px', background: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.05)', color: activeTab===tab ? '#000' : '#fff', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:12, cursor:'pointer', textTransform:'uppercase' }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === 'directives' && (
          <>
            <textarea 
              value={directive} 
              onChange={e => setDirective(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && e.metaKey && sendDirective()} 
              placeholder="Issue a new directive..." 
              rows={4} 
              style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,217,15,0.4)', borderRadius:10, padding:12, color:'#FFD90F', fontSize:15, resize:'none', outline:'none', marginBottom:12 }} 
            />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>{status}</span>
              <button 
                onClick={sendDirective} 
                style={{ padding:'10px 24px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:16, cursor:'pointer' }}
              > 
                DISPATCH ➤ 
              </button>
            </div>
          </>
        )}

        {['homer','marge','lisa'].includes(activeTab) && (
          <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:10, padding:12 }}>
            <div style={{ marginBottom:8, color:'#FFD90F', fontFamily:'Permanent Marker' }}>{activeTab.toUpperCase()} Direct Chat</div>
            <div style={{ minHeight:120, maxHeight:200, overflowY:'auto', fontSize:13, color:'#fff', marginBottom:8, padding:8 }}>
              {(chatMessages[activeTab]||[]).map((m,i) => (
                <div key={i} style={{ color: m.role==='user' ? '#FFD90F' : '#fff', marginBottom:8, background:'rgba(255,255,255,0.05)', padding:8, borderRadius:8 }}>
                  <strong>{m.role==='user'?'You':'Agent'}:</strong> {m.text}
                </div>
              ))}
              {!(chatMessages[activeTab]||[]).length && <span style={{color:'rgba(255,255,255,0.3)'}}>No messages yet.</span>}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input 
                value={chatInput[activeTab]||''} 
                onChange={e => setChatInput(c=>({...c, [activeTab]:e.target.value}))} 
                onKeyDown={e => e.key==='Enter' && sendChat(activeTab)} 
                placeholder={`Message ${activeTab}...`} 
                style={{ flex:1, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px', color:'#fff', fontSize:14, outline:'none' }} 
              />
              <button 
                onClick={() => sendChat(activeTab)} 
                style={{ padding:'10px 20px', background:'#FFD90F', color:'#000', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}
              >➤</button>
            </div>
          </div>
        )}

        {activeTab === 'debate' && (
          <div style={{ ...glassCard, padding:12 }}>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input 
                value={debateTopic} 
                onChange={e => setDebateTopic(e.target.value)} 
                placeholder="Topic for debate..." 
                style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,217,15,0.4)', borderRadius:10, padding:10, color:'#FFD90F', fontSize:14, outline:'none' }} 
              />
              <button 
                onClick={sendDebate} 
                disabled={isDebating}
                style={{ padding:'8px 18px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:14, cursor:'pointer', opacity: isDebating ? 0.5 : 1 }}
              > 
                {isDebating ? 'THINKING...' : 'DEBATE'} 
              </button>
            </div>
            {debateResponses && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ background:'rgba(74,144,217,0.1)', border:'1px solid #4A90D9', borderRadius:12, padding:12 }}>
                  <div style={{ fontFamily:'Permanent Marker', color:'#4A90D9', marginBottom:8 }}>MARGE</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', whiteSpace:'pre-wrap' }}>{debateResponses.marge}</div>
                </div>
                <div style={{ background:'rgba(126,211,33,0.1)', border:'1px solid #7ED321', borderRadius:12, padding:12 }}>
                  <div style={{ fontFamily:'Permanent Marker', color:'#7ED321', marginBottom:8 }}>LISA</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', whiteSpace:'pre-wrap' }}>{debateResponses.lisa}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div style={{ ...glassCard, padding:12 }}>
            <div style={{ background:'#000', borderRadius:8, padding:12, minHeight:300, fontFamily:'monospace', fontSize:12, color:'#00FF41', overflowY:'auto', maxHeight:400 }}>
              {results.length ? results.map((r,i) => (
                <div key={i} style={{ marginBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:8 }}>
                  <span style={{ color:'#FFD90F' }}>[{new Date(r.receivedAt||r.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span style={{ color: r.status==='complete'?'#00FF41':'#FF4444' }}>{r.status?.toUpperCase()}</span>{' '}
                  {r.result}
                </div>
              )) : <span style={{ color:'rgba(255,255,255,0.3)' }}>Waiting for logs...</span>}
            </div>
          </div>
        )}

        {activeTab === 'kanban' && (
          <div style={{ ...glassCard, padding:0, overflow:'hidden' }}>
            <iframe src="https://kanban-board-one-ecru.vercel.app" style={{ width:'100%', height:500, border:'none', background:'#0D0D1A' }} />
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
