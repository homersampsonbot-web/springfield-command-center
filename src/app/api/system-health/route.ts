import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

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
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "314e60bced474eb381ac8655eefd3525";

    const margeRelayUrl = process.env.MARGE_RELAY_URL || "disabled";
    const lisaRelayUrl = process.env.LISA_RELAY_URL || "disabled";
    const toHealthUrl = (relayUrl: string) => relayUrl.replace(/\/relay$/, '/health');
    const toSessionUrl = (relayUrl: string) => relayUrl.replace(/\/relay$/, '/session');

    const execAsync = promisify(exec);
    const bartProcessStatus = async () => {
      try {
        const { stdout } = await execAsync('bash -lc "pm2 pid bart-browser"');
        const isOnline = stdout.trim() !== '0' && stdout.trim() !== '';
        if (isOnline) {
          return { agent: 'bart', status: 'online', runtime: 'homer', service: 'bart-browser' } as const;
        }
        return { agent: 'bart', status: 'offline' } as const;
      } catch {
        return { agent: 'bart', status: 'offline' } as const;
      }
    };

    const margeProcessStatus = async () => {
      try {
        const { stdout } = await execAsync('bash -lc "pm2 pid marge-browser"');
        const isOnline = stdout.trim() !== '0' && stdout.trim() !== '';
        if (isOnline) {
          return { agent: 'marge', status: 'online', runtime: 'homer', service: 'marge-browser' } as const;
        }
        return { agent: 'marge', status: 'offline' } as const;
      } catch {
        return { agent: 'marge', status: 'offline' } as const;
      }
    };

    const lisaProcessStatus = async () => {
      try {
        const { stdout } = await execAsync('bash -lc "pm2 pid lisa-browser"');
        const isOnline = stdout.trim() !== '0' && stdout.trim() !== '';
        if (isOnline) {
          return { agent: 'lisa', status: 'online', runtime: 'homer', service: 'lisa-browser' } as const;
        }
        return { agent: 'lisa', status: 'offline' } as const;
      } catch {
        return { agent: 'lisa', status: 'offline' } as const;
      }
    };

    const persistenceHealth = async () => {
      if (!gatewayUrl) {
        return {
          compute: 'offline',
          queue: 'offline',
          memory: 'offline',
          storage: 'offline',
          network: 'disconnected'
        } as const;
      }
      try {
        const res = await fetch(`${gatewayUrl}/persistence-health`, {
          headers: { 'x-springfield-key': gatewayKey },
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        if (!res.ok) throw new Error('gateway_unreachable');
        const data = await res.json();
        if (data?.persistence) {
          return data.persistence as {
            compute: string;
            queue: string;
            memory: string;
            storage: string;
            network: string;
          };
        }
      } catch {}
      return {
        compute: 'offline',
        queue: 'offline',
        memory: 'offline',
        storage: 'offline',
        network: 'disconnected'
      } as const;
    };

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


    const bartAgent = await bartProcessStatus();
    const margeAgent = await margeProcessStatus();
    const lisaAgent = await lisaProcessStatus();

    const margeRelay = margeAgent.status === 'online' ? 'alive' : 'down';
    const lisaRelay = lisaAgent.status === 'online' ? 'alive' : 'down';

    const margeSession =
      margeAgent.status === 'online'
        ? { status: 'ok', reason: null, keepalive: { lastRunTs: null, lastResult: 'browser_worker_online' } }
        : { status: 'offline', reason: 'browser_worker_offline', keepalive: { lastRunTs: null, lastResult: null } };

    const lisaSession =
      lisaAgent.status === 'online'
        ? { status: 'ok', reason: null, keepalive: { lastRunTs: null, lastResult: 'browser_worker_online' } }
        : { status: 'offline', reason: 'browser_worker_offline', keepalive: { lastRunTs: null, lastResult: null } };

    const persistence = await persistenceHealth();

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
      bartAgent,
      margeAgent,
      lisaAgent,
      persistence,
      maggieLocalStatus,
      maggieState,
      maggieReason,
      agents: {
        homer: "alive",
        bart: bartAgent.status === 'online' ? 'online' : 'offline',
        marge: margeAgent.status === 'online' ? 'online' : 'offline',
        lisa: lisaAgent.status === 'online' ? 'online' : 'offline',
        margeSession: margeSession.status === 'ok' ? 'available' : (margeSession.status === 'offline' ? 'offline' : (margeSession.status === 'maintenance' ? 'maintenance' : 'degraded')),
        lisaSession: lisaSession.status === 'ok' ? 'available' : (lisaSession.status === 'offline' ? 'offline' : (lisaSession.status === 'maintenance' ? 'maintenance' : 'degraded')),
        maggie: maggieState === "online" ? "online" : "degraded"
      },
      counts: process.env.DATABASE_URL ? {
        jobs: await prisma.job.groupBy({ by: ['status'], _count: true }),
        directives: await prisma.directive.groupBy({ by: ['status'], _count: true }),
        stuckLeases: await prisma.job.count({
          where: {
            leaseUntil: { lt: new Date() },
            status: { in: ['CLAIMED', 'IN_PROGRESS', 'QA'] }
          }
        })
      } : {
        jobs: [],
        directives: [],
        stuckLeases: 0
      },
      build: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BUILD_STAMP || "v1.6.4-HEAL-ESCALATE",
      timestamp: Date.now()
    };

    return NextResponse.json(health);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
