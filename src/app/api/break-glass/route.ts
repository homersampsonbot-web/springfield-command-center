import { NextRequest, NextResponse } from "next/server";
const ACTIONS = new Set([ "restart_cloudflared", "restart_gateway_user", "watchdog_tail" ]);
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-break-glass-token") || "";
  if (!process.env.BREAK_GLASS_TOKEN || token !== process.env.BREAK_GLASS_TOKEN) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!ACTIONS.has(body.action)) return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  const gatewayUrl = process.env.HOMER_GATEWAY_URL || "";
  const gatewayToken = process.env.HOMER_GATEWAY_TOKEN || "";
  const cmd = body.action === "restart_cloudflared" ? "sudo systemctl restart cloudflared" : body.action === "restart_gateway_user" ? "systemctl --user restart openclaw-gateway || true" : "sudo tail -n 60 /var/log/springfield/watchdog.log || true";
  const res = await fetch(gatewayUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${gatewayToken}` }, body: JSON.stringify({ cmd }) });
  return NextResponse.json({ ok: res.ok, action: body.action, data: await res.json().catch(() => ({})) });
}
