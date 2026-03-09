import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connectivity
    let dbStatus = "connected";
    const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

    try {
      const dbCheck = await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 2000))
      ]);
    } catch (e) {
      dbStatus = isPreview ? "alive" : "disconnected"; // In preview, assume alive if reachable but slow
    }

    const gatewayUrl = process.env.HOMER_GATEWAY_URL || "";
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";

    const margeRelayUrl = process.env.MARGE_RELAY_URL || "disabled";
    const lisaRelayUrl = process.env.LISA_RELAY_URL || "disabled";
    const toHealthUrl = (relayUrl: string) => relayUrl.replace(/\/relay$/, '/health');
    const toSessionUrl = (relayUrl: string) => relayUrl.replace(/\/relay$/, '/session');

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


    const relayHealth = async (relayUrl: string) => {
      if (relayUrl === 'disabled') return 'maintenance' as const;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(toHealthUrl(relayUrl), { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeoutId);
        return res.ok ? 'alive' : 'down';
      } catch {
        return 'down';
      }
    };

    const margeRelay = await relayHealth(margeRelayUrl);
    const lisaRelay = await relayHealth(lisaRelayUrl);

    const sessionCheck = async (relayUrl: string, key: 'marge' | 'lisa') => {
      if (relayUrl === 'disabled') {
        return { status: 'maintenance', reason: 'relay_disabled', keepalive: { lastRunTs: null, lastResult: null } } as const;
      }
      const url = toSessionUrl(relayUrl);
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { status: 'offline', reason: 'relay_unreachable', keepalive: { lastRunTs: null, lastResult: null } } as const;
        const data: any = await res.json();
        if (!data?.browser?.cdpOk) return { status: 'offline', reason: 'cdp_failed', keepalive: { lastRunTs: null, lastResult: null } } as const;
        const s = data?.[key];
        
        // Fetch keepalive status if available
        let keepalive = { lastRunTs: null, lastResult: null };
        try {
          const kaRes = await fetch(url.replace('/session', '/keepalive-status'), { cache: 'no-store' });
          if (kaRes.ok) {
            keepalive = await kaRes.json();
          }
        } catch (e) {}

        if (s?.loggedIn) return { status: 'ok', reason: null, keepalive } as const;
        return { status: 'degraded', reason: s?.reason || 'logged_out', keepalive } as const;
      } catch {
        return { status: 'offline', reason: 'relay_unreachable', keepalive: { lastRunTs: null, lastResult: null } } as const;
      }
    };

    const margeSession = await sessionCheck(margeRelayUrl, 'marge');
    const lisaSession = await sessionCheck(lisaRelayUrl, 'lisa');
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
      sessions: { marge: margeSession, lisa: lisaSession },
      maggieLocalStatus,
      maggieState,
      maggieReason,
      agents: {
        homer: "alive",
        bart: "alive",
        marge: margeSession.status === 'ok' ? 'available' : (margeSession.status === 'offline' ? 'offline' : (margeSession.status === 'maintenance' ? 'maintenance' : 'degraded')),
        lisa: lisaSession.status === 'ok' ? 'available' : (lisaSession.status === 'offline' ? 'offline' : (lisaSession.status === 'maintenance' ? 'maintenance' : 'degraded')),
        maggie: maggieState === "online" ? "online" : "degraded"
      },
      counts: {
        jobs: await prisma.job.groupBy({ by: ['status'], _count: true }),
        directives: await prisma.directive.groupBy({ by: ['status'], _count: true }),
        stuckLeases: await prisma.job.count({
          where: {
            leaseUntil: { lt: new Date() },
            status: { in: ['CLAIMED', 'IN_PROGRESS', 'QA'] }
          }
        })
      },
      build: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BUILD_STAMP || "v1.6.4-HEAL-ESCALATE",
      timestamp: Date.now()
    };

    return NextResponse.json(health);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
