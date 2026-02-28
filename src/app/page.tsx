'use client';
import { useState, useEffect, useRef } from 'react';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "";

export default function Home() {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const [directive, setDirective] = useState('');
  const [status, setStatus] = useState('Standby');
  const [results, setResults] = useState<any[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<Record<string,string>>({ homer: 'checking', marge: 'checking', lisa: 'checking', bart: 'checking', zilliz: 'checking' });
  const [activeTab, setActiveTab] = useState('debate');
  const [debateTopic, setDebateTopic] = useState('');
  const [debateResponses, setDebateResponses] = useState<{marge?:string, lisa?:string} | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [toast, setToast] = useState<{message:string, type:string} | null>(null);
  const lastResultId = useRef<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/api/results`);
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
        const s = await fetch(`${BASE}/api/status`, { signal: AbortSignal.timeout(3000) });
        const sData = await s.json();
        setGatewayStatus(prev => ({ ...prev, ...sData }));
      } catch {
        setGatewayStatus(prev => ({ ...prev, homer: 'offline', marge: 'offline', lisa: 'offline', bart: 'offline', zilliz: 'offline' }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [auth]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        setAuth(true);
      } else {
        alert('Invalid PIN');
        setPin('');
      }
    } catch (e) {
      alert('Authentication error');
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
      const r = await fetch(`${BASE}/api/directive`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
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
      const r = await fetch(`${BASE}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: debateTopic })
      });
      const d = await r.json();
      setDebateResponses(d.responses);
    } catch {
      alert('Debate failed');
    } finally {
      setIsDebating(false);
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
      {/* Toast */}
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

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>🍩</span>
          <div style={{ fontFamily:'Permanent Marker', fontSize:19, color:'#FFD90F' }}>Springfield</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus.homer==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
            <img src="/icons/homer.webp" alt="Homer" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', border:'1px solid #FFD90F' }} />
            HOMER <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus.homer==='online'?'#7ED321':'#FF4444' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus.marge==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
            <img src="/icons/marge.webp" alt="Marge" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', border:'1px solid #4A90D9' }} />
            MARGE <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus.marge==='online'?'#7ED321':'#FF4444' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus.lisa==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
            <img src="/icons/lisa.webp" alt="Lisa" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', border:'1px solid #7ED321' }} />
            LISA <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus.lisa==='online'?'#7ED321':'#FF4444' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus.bart==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
            <img src="/icons/bart.webp" alt="Bart" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', border:'1px solid #FF6B35' }} />
            BART <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus.bart==='online'?'#7ED321':'#FF4444' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, border:'1px solid', borderColor: gatewayStatus.zilliz==='online'?'#7ED321':'#FF4444', color:'#fff', fontSize:11, fontWeight:600 }}>
            <span style={{ color:'#00B4D8', fontWeight:900, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>Z</span>
            ZILLIZ <span style={{ width:8, height:8, borderRadius:'50%', background: gatewayStatus.zilliz==='online'?'#7ED321':'#FF4444' }} />
          </div>
        </div>
      </div>

      {/* Podium */}
      <div style={{ ...glassCard, border:'2px solid #FFD90F', marginBottom:20 }}>
        <div style={{ fontFamily:'Permanent Marker', fontSize:28, color:'#FFD90F', textAlign:'center', marginBottom:16 }}>🎙️ PODIUM</div>
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
      </div>

      {/* Tab Nav */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['debate','terminal','kanban'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ flex:1, padding:'10px', background: activeTab===tab ? '#FFD90F' : 'rgba(255,255,255,0.05)', color: activeTab===tab ? '#000' : '#fff', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:14, cursor:'pointer', textTransform:'uppercase' }}
          >
            {tab === 'debate' ? '⚖️ Debate' : tab === 'terminal' ? '💻 Terminal' : '📋 Kanban'}
          </button>
        ))}
      </div>

      {/* Debate Tab */}
      {activeTab === 'debate' && (
        <div style={{ ...glassCard }}>
          <div style={{ fontFamily:'Permanent Marker', fontSize:22, color:'#FFD90F', textAlign:'center', marginBottom:16 }}>⚖️ STRATEGIC DEBATE</div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input 
              value={debateTopic} 
              onChange={e => setDebateTopic(e.target.value)} 
              placeholder="Topic for debate..." 
              style={{ flex:1, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,217,15,0.4)', borderRadius:10, padding:12, color:'#FFD90F', fontSize:15, outline:'none' }} 
            />
            <button 
              onClick={sendDebate} 
              disabled={isDebating}
              style={{ padding:'10px 24px', background:'#FFD90F', color:'#000', border:'none', borderRadius:10, fontFamily:'Permanent Marker', fontSize:16, cursor:'pointer', opacity: isDebating ? 0.5 : 1 }}
            > 
              {isDebating ? 'THINKING...' : 'DEBATE'} 
            </button>
          </div>
          
          {debateResponses && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:'rgba(74,144,217,0.1)', border:'1px solid #4A90D9', borderRadius:12, padding:12 }}>
                <div style={{ fontFamily:'Permanent Marker', color:'#4A90D9', marginBottom:8 }}>MARGE (ARCHITECTURE)</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', whiteSpace:'pre-wrap' }}>{debateResponses.marge}</div>
              </div>
              <div style={{ background:'rgba(126,211,33,0.1)', border:'1px solid #7ED321', borderRadius:12, padding:12 }}>
                <div style={{ fontFamily:'Permanent Marker', color:'#7ED321', marginBottom:8 }}>LISA (STRATEGY)</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', whiteSpace:'pre-wrap' }}>{debateResponses.lisa}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terminal Tab */}
      {activeTab === 'terminal' && (
        <div style={{ ...glassCard }}>
          <div style={{ fontFamily:'Permanent Marker', fontSize:18, color:'#FFD90F', marginBottom:12 }}>⚡ Homer's Terminal</div>
          <div style={{ background:'#000', borderRadius:8, padding:12, minHeight:200, fontFamily:'monospace', fontSize:12, color:'#00FF41', overflowY:'auto', maxHeight:400 }}>
            {results.length ? results.map((r,i) => (
              <div key={i} style={{ marginBottom:8, borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:8 }}>
                <span style={{ color:'#FFD90F' }}>[{new Date(r.receivedAt||r.timestamp).toLocaleTimeString()}]</span>{' '}
                <span style={{ color: r.status==='complete'?'#00FF41':'#FF4444' }}>{r.status?.toUpperCase()}</span>{' '}
                {r.result?.slice(0,100)}
              </div>
            )) : <span style={{ color:'rgba(255,255,255,0.3)' }}>Waiting for Homer...</span>}
          </div>
        </div>
      )}

      {/* Kanban Tab */}
      {activeTab === 'kanban' && (
        <div style={{ ...glassCard, padding:0, overflow:'hidden' }}>
          <div style={{ fontFamily:'Permanent Marker', fontSize:18, color:'#FFD90F', padding:16, borderBottom:'1px solid rgba(255,217,15,0.2)' }}>📋 SPRINGFIELD OPS</div>
          <iframe src="https://kanban-board-one-ecru.vercel.app" style={{ width:'100%', height:500, border:'none', background:'#0D0D1A' }} />
        </div>
      )}

      {/* Bottom padding */}
      <div style={{ height:20 }} />
      
      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
