export async function submitDirective(text: string) {
  const r = await fetch("/api/directives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error || "Failed to submit directive");
  
  return d as { ok: true; id: string };
}
