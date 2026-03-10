import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gatewayUrl = process.env.HOMER_GATEWAY_URL || "";
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";
    if (!gatewayUrl) {
      return NextResponse.json({
        persistence: {
          compute: "offline",
          queue: "offline",
          memory: "offline",
          storage: "offline",
          network: "disconnected",
        },
      });
    }

    const timeout = (ms: number) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

    const gatewayHealth = async () => {
      try {
        const res = (await Promise.race([
          fetch(`${gatewayUrl}/health`, { headers: { "x-springfield-key": gatewayKey }, cache: "no-store" }),
          timeout(1500),
        ])) as Response;
        return res.ok ? "online" : "offline";
      } catch (e: any) {
        return e?.message === "timeout" ? "degraded" : "offline";
      }
    };

    const persistenceHealth = async () => {
      try {
        const res = (await Promise.race([
          fetch(`${gatewayUrl}/persistence-health`, {
            headers: { "x-springfield-key": gatewayKey },
            cache: "no-store",
            next: { revalidate: 0 },
          }),
          timeout(2000),
        ])) as Response;
        if (!res.ok) throw new Error("gateway_unreachable");
        const data = await res.json();
        return data?.persistence || { redis: "offline", qdrant: "offline", tailscale: "disconnected" };
      } catch {
        return { redis: "offline", qdrant: "offline", tailscale: "disconnected" };
      }
    };

    const [compute, persistence] = await Promise.all([gatewayHealth(), persistenceHealth()]);

    const queue = persistence.redis === "healthy" ? "normal" : persistence.redis;
    const memory = persistence.qdrant === "healthy" ? "stable" : persistence.qdrant;
    const network = persistence.tailscale === "connected" ? "connected" : persistence.tailscale;

    let storage = "degraded";
    if (persistence.redis === "healthy" && persistence.qdrant === "healthy" && network === "connected") {
      storage = "healthy";
    } else if (persistence.redis === "offline" || persistence.qdrant === "offline") {
      storage = "offline";
    }

    return NextResponse.json({
      persistence: {
        compute,
        queue,
        memory,
        storage,
        network,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
