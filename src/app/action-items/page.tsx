"use client";
import { useEffect, useState } from "react";

const KEY = "c4c75fe2065fb96842e3690a3a6397fb";
const H = { "x-springfield-key": KEY };

type AttentionItem = { id: string; title: string; description: string; status: string; smsNote: string; owner: string; updatedAt: string; };
type Decision = { id: string; title: string; decision: string; decidedBy: string; context: string; createdAt: string; };
type Alert = { id: string; jobId: string; title: string; detail: string; level: string; };
type Heartbeat = { id: string; label: string; status: string; detail: string; };

export default function ActionItemsPage() {
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [attRes, decRes, healthRes, jobRes] = await Promise.all([
        fetch('/api/dispatch/attention', { headers: H }).then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/api/dispatch/decisions', { headers: H }).then(r => r.json()).catch(() => ({ decisions: [] })),
        fetch('/api/system-health', { headers: H }).then(r => r.json()).catch(() => ({})),
        fetch('/api/jobs?limit=20', { headers: H }).then(r => r.json()).catch(() => [])
      ]);
      setAttention(Array.isArray(attRes.items) ? attRes.items : []);
      setDecisions(Array.isArray(decRes.decisions) ? decRes.decisions.slice(0, 10) : []);
      // Check relay health directly via gateway proxy
      const checkRelay = async (path: string) => {
        try {
          const r = await fetch(path, { headers: H, signal: AbortSignal.timeout(3000) });
          const d = await r.json();
          return d?.status === 'alive' ? 'ALIVE' : 'OFFLINE';
        } catch { return 'OFFLINE'; }
      };
      const [margeStatus, lisaStatus, flandersStatus] = await Promise.all([
        checkRelay('/api/marge-relay-health'),
        checkRelay('/api/lisa-relay-health'),
        checkRelay('/api/flanders-relay-health'),
      ]);
      const hbItems = [
        { id: 'gateway', label: 'Homer / Gateway', status: healthRes?.gateway === 'online' ? 'ALIVE' : 'OFFLINE', detail: 'EC2 :3001' },
        { id: 'database', label: 'Database', status: healthRes?.database === 'connected' ? 'ALIVE' : 'OFFLINE', detail: 'Supabase' },
        { id: 'marge', label: 'Marge', status: margeStatus, detail: 'Claude Pro :3012' },
        { id: 'lisa', label: 'Lisa', status: lisaStatus, detail: 'GPT-5.4 :3013' },
        { id: 'flanders', label: 'Flanders', status: flandersStatus, detail: 'Claude Pro :3014' },
      ];
      setHeartbeats(hbItems);
      // Build alerts from failed jobs
      const jobs = Array.isArray(jobRes) ? jobRes : (Array.isArray(jobRes?.jobs) ? jobRes.jobs : []);
      setAlerts(jobs.filter((j: any) => j.status === 'FAILED').map((j: any) => ({
        id: j.id, jobId: j.id, title: j.title, detail: j.description || '', level: 'error'
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const dismissAttention = async (id: string) => {
    await fetch('/api/dispatch/attention', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: id, clear: true }) });
    load();
  };

  const style = {
    page: { background: '#0a0a0f', minHeight: '100vh', padding: '20px', fontFamily: 'monospace', color: '#e0e0e0' },
    title: { color: '#f0c040', fontFamily: 'serif', fontSize: 28, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 2 },
    sub: { color: '#666', fontSize: 12, marginBottom: 24 },
    section: { background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16, marginBottom: 16 },
    sectionTitle: { color: '#f0c040', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
    card: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 12, marginBottom: 8 },
    badge: (c: string) => ({ background: c, color: '#000', fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }),
    btn: { background: '#f0c040', color: '#000', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 'bold' },
    btnDanger: { background: '#cc4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 'bold' },
    empty: { color: '#444', fontSize: 12, fontStyle: 'italic' as const, padding: '8px 0' },
    heartRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1a1a' },
  };

  return (
    <div style={style.page}>
      <div style={style.title}>⚡ Action Items</div>
      <div style={style.sub}>SMS attention queue — items requiring your decision or review</div>

      {loading && <div style={{ color: '#666', fontSize: 12 }}>Loading...</div>}

      {/* SMS ATTENTION QUEUE */}
      <div style={style.section}>
        <div style={style.sectionTitle}>🔴 Needs Your Decision ({attention.length})</div>
        {attention.length === 0
          ? <div style={style.empty}>No items waiting for your attention</div>
          : attention.map(item => (
            <div key={item.id} style={style.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>{item.title}</div>
                  {item.smsNote && <div style={{ color: '#f0c040', fontSize: 12, marginBottom: 4 }}>💬 {item.smsNote}</div>}
                  <div style={{ color: '#888', fontSize: 11 }}>{item.owner} · {new Date(item.updatedAt).toLocaleString()}</div>
                </div>
                <button style={style.btn} onClick={() => dismissAttention(item.id)}>Dismiss</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* AGENT HEARTBEAT */}
      <div style={style.section}>
        <div style={style.sectionTitle}>💚 Agent Heartbeat</div>
        {heartbeats.length === 0
          ? <div style={style.empty}>No heartbeat data</div>
          : heartbeats.map((h, i) => (
            <div key={i} style={style.heartRow}>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: 13 }}>{h.label}</span>
                <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>{h.detail}</span>
              </div>
              <span style={style.badge(h.status === 'ALIVE' ? '#44cc44' : '#cc4444')}>{h.status}</span>
            </div>
          ))
        }
      </div>

      {/* SYSTEM ALERTS */}
      <div style={style.section}>
        <div style={style.sectionTitle}>🚨 System Alerts ({alerts.length})</div>
        {alerts.length === 0
          ? <div style={style.empty}>No system alerts</div>
          : alerts.map(alert => (
            <div key={alert.id} style={{ ...style.card, borderLeft: '3px solid #cc4444' }}>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: '#ff6666' }}>{alert.title}</div>
              <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{alert.detail?.slice(0, 120)}</div>
            </div>
          ))
        }
      </div>

      {/* DECISION LEDGER */}
      <div style={style.section}>
        <div style={style.sectionTitle}>📋 Decision Ledger — Recent Rulings</div>
        {decisions.length === 0
          ? <div style={style.empty}>No decisions recorded yet</div>
          : decisions.map(d => (
            <div key={d.id} style={style.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 13 }}>{d.title}</span>
                <span style={style.badge('#4488cc')}>{d.decidedBy}</span>
              </div>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{d.decision}</div>
              {d.context && <div style={{ color: '#666', fontSize: 11 }}>{d.context}</div>}
              <div style={{ color: '#444', fontSize: 10, marginTop: 4 }}>{new Date(d.createdAt).toLocaleString()}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
