"use client";
import { useState } from "react";
export default function BreakGlass() {
  const [out, setOut] = useState<any>(null);
  const run = async (action: string) => {
    const res = await fetch("/api/break-glass", { method: "POST", headers: { "Content-Type": "application/json", "x-break-glass-token": localStorage.getItem("BREAK_GLASS_TOKEN") || "" }, body: JSON.stringify({ action }) });
    setOut(await res.json());
  };
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h1>Break-Glass</h1>
      <input onChange={(e) => localStorage.setItem("BREAK_GLASS_TOKEN", e.target.value)} placeholder="Token" style={{ background: "#222", color: "#fff", padding: 8, marginBottom: 16, width: "100%" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => run("restart_cloudflared")}>Restart CF</button>
        <button onClick={() => run("restart_gateway_user")}>Restart Gateway</button>
        <button onClick={() => run("watchdog_tail")}>Tail Log</button>
      </div>
      <pre>{JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}
