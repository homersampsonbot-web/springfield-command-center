import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connectivity
    let dbStatus = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = "disconnected";
    }

    const gatewayUrl = process.env.HOMER_GATEWAY_URL || "";
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";

    // 1) Fetch Marge health via Gateway proxy
    let margeStatus = "offline";
    try {
      const res = await fetch(`${gatewayUrl}/marge-health`, {
        headers: { 'x-springfield-key': gatewayKey },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (res.ok) {
        const data = await res.json();
        margeStatus = data.status || "offline";
      }
    } catch (e) {}


    const relayHealth = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeoutId);
        return res.ok ? 'alive' : 'down';
      } catch {
        return 'down';
      }
    };

    const margeRelay = await relayHealth('http://18.190.203.220:3003/health');
    const lisaRelay = await relayHealth('http://18.190.203.220:3004/health');
    // 2) Maggie Logic & Contract Test
    const maggieProvider = process.env.MAGGIE_PROVIDER || "gemini";
    let maggieLocalStatus = "offline";
    let maggieState = "degraded";
    let maggieReason = "initial_check";

    // Maggie Local Status Check
    const maggieLocalUrl = process.env.MAGGIE_LOCAL_URL || "http://maggie.local:8080";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const maggieResp = await fetch(`${maggieLocalUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (maggieResp.ok) maggieLocalStatus = "online";
    } catch (e) {}

    // Contract Test (Simulated or Internal Call)
    // For now, we check if we can reach the provider or if the env vars exist
    if (process.env.GEMINI_API_KEY) {
      maggieState = "online";
      maggieReason = "provider_nominal";
    } else {
      maggieReason = "missing_api_key";
    }

    const health = {
      gateway: "online",
      database: dbStatus,
      queue: "connected",
      maggieProvider,
      relays: { marge: margeRelay, lisa: lisaRelay },
      sessions: { marge: "unknown", lisa: "unknown" },
      maggieLocalStatus,
      maggieState,
      maggieReason,
      agents: {
        homer: "alive",
        bart: "alive",
        marge: margeStatus,
        lisa: "available",
        maggie: maggieState === "online" ? "online" : "degraded"
      },
      build: "v1.6.4-HEAL-ESCALATE",
      timestamp: Date.now()
    };

    return NextResponse.json(health);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
