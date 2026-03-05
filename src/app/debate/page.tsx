"use client";

import { useEffect, useState } from "react";

const TRIGGERS = ["HIGH_RISK", "ARCH_DECISION", "PARITY_UNCERTAIN", "REPEATED_FAILURE", "MANUAL"];
const STATES = ["PROPOSED", "DECIDED", "IMPLEMENTING", "VERIFIED", "DONE"];

export default function DebatePage() {
  const [debates, setDebates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [context, setContext] = useState("");

  const fetchDebates = async () => {
    setLoading(true);
    const res = await fetch("/api/debates");
    if (res.status === 503) {
      setError("DB offline — read-only mode");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDebates(data || []);
    setLoading(false);
  };

  const selectDebate = async (id: string) => {
    const res = await fetch(`/api/debates/${id}`);
    if (res.status === 503) {
      setError("DB offline — read-only mode");
      return;
    }
    const data = await res.json();
    setSelected(data);
  };

  const createDebate = async () => {
    const res = await fetch("/api/debates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, trigger, context }),
    });
    if (res.status === 503) {
      setError("DB offline — read-only mode");
      return;
    }
    const data = await res.json();
    setTitle("");
    setContext("");
    await fetchDebates();
    setSelected(data);
  };

  const patchDebate = async (patch: any) => {
    if (!selected) return;
    const res = await fetch(`/api/debates/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSelected(data);
    await fetchDebates();
  };

  useEffect(() => {
    fetchDebates();
  }, []);

  return (
    <main style={{ padding: 24, color: "white" }}>
      <h1 style={{ fontFamily: "Permanent Marker", color: "#FFD90F" }}>Debates</h1>
      {error && <div style={{ margin: "12px 0", color: "#ff6b6b" }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <section style={{ background: "rgba(0,0,0,0.35)", padding: 16, borderRadius: 12 }}>
          <h3>New Debate</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={inputStyle} />
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} style={inputStyle}>
            {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context (markdown)" style={{ ...inputStyle, minHeight: 100 }} />
          <button onClick={createDebate} style={btnStyle}>Create Debate</button>

          <h3 style={{ marginTop: 16 }}>Debate List</h3>
          {loading && <div>Loading...</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {debates.map((d) => (
              <button key={d.id} onClick={() => selectDebate(d.id)} style={{ ...btnStyle, textAlign: "left" }}>
                {d.title} <span style={{ opacity: 0.6 }}>({d.state})</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ background: "rgba(0,0,0,0.35)", padding: 16, borderRadius: 12 }}>
          {!selected && <div>Select a debate to view details.</div>}
          {selected && (
            <>
              <h2>{selected.title}</h2>
              <div style={{ opacity: 0.7 }}>Trigger: {selected.trigger}</div>

              <h3>Options (JSON)</h3>
              <textarea defaultValue={JSON.stringify(selected.options || [], null, 2)} onBlur={(e) => patchDebate({ options: JSON.parse(e.target.value || "[]") })} style={{ ...inputStyle, minHeight: 120 }} />

              <h3>Recommendation</h3>
              <textarea defaultValue={selected.recommendation || ""} onBlur={(e) => patchDebate({ recommendation: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} />

              <h3>Decision</h3>
              <textarea defaultValue={selected.decision || ""} onBlur={(e) => patchDebate({ decision: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} />
              <select defaultValue={selected.decisionBy || ""} onChange={(e) => patchDebate({ decisionBy: e.target.value })} style={inputStyle}>
                <option value="">Decision By...</option>
                <option value="marge">marge</option>
                <option value="sms">sms</option>
              </select>

              <h3>State</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATES.map((s) => (
                  <button key={s} onClick={() => patchDebate({ state: s })} style={{ ...btnStyle, opacity: selected.state === s ? 1 : 0.5 }}>
                    {s}
                  </button>
                ))}
              </div>

              <h3>Verification</h3>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={selected.bartVerified || false} onChange={(e) => patchDebate({ bartVerified: e.target.checked })} /> Bart Verified
              </label>
              <input defaultValue={selected.bartEvidenceUrl || ""} onBlur={(e) => patchDebate({ bartEvidenceUrl: e.target.value })} placeholder="Bart Evidence URL" style={inputStyle} />

              <h3>SMS Override</h3>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={selected.smsOverride || false} onChange={(e) => patchDebate({ smsOverride: e.target.checked })} /> SMS Override
              </label>
              <textarea defaultValue={selected.smsOverrideNote || ""} onBlur={(e) => patchDebate({ smsOverrideNote: e.target.value })} placeholder="Override note (required if smsOverride)" style={{ ...inputStyle, minHeight: 60 }} />

              <h3>Decision Card</h3>
              <div style={{ background: "rgba(0,0,0,0.4)", padding: 12, borderRadius: 8 }}>
                <div>State: {selected.state}</div>
                <div>Decision: {selected.decision || "—"}</div>
                <div>Decision By: {selected.decisionBy || "—"}</div>
                <div>Bart Verified: {selected.bartVerified ? "yes" : "no"}</div>
                <div>SMS Override: {selected.smsOverride ? "yes" : "no"}</div>
              </div>

              <button onClick={() => alert("Maggie draft coming soon") } style={{ ...btnStyle, marginTop: 12 }}>
                Ask Maggie to Draft Options
              </button>

              <button disabled={!(selected.state === "DECIDED" || selected.state === "IMPLEMENTING" || selected.state === "VERIFIED" || selected.state === "DONE") || !(selected.bartVerified || selected.smsOverride)} style={{ ...btnStyle, marginTop: 12, opacity: (!(selected.state === "DECIDED" || selected.state === "IMPLEMENTING" || selected.state === "VERIFIED" || selected.state === "DONE") || !(selected.bartVerified || selected.smsOverride)) ? 0.5 : 1 }}>
                Promote to Prod
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 8,
  padding: 8,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
};

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,217,15,0.3)",
  background: "rgba(0,0,0,0.35)",
  color: "#FFD90F",
  cursor: "pointer",
};
