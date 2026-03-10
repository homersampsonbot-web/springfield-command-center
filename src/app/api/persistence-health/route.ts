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

    const fetchWithRetry = async (url: string, attempt = 0): Promise<Response> => {
      try {
        const res = (await Promise.race([
          fetch(url, { cache: "no-store", next: { revalidate: 5 } }),
          timeout(2000),
        ])) as Response;
        return res;
      } catch (err) {
        if (attempt < 1) return fetchWithRetry(url, attempt + 1);
        throw err;
      }
    };

    const res = await fetchWithRetry(`${gatewayUrl}/persistence-health`);
    if (!res.ok) throw new Error("gateway_unreachable");
    const data = await res.json();

    const persistence = data?.persistence || { redis: "offline", qdrant: "offline", tailscale: "disconnected" };
    const compute = data?.compute || "offline";

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
    }, { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=30" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
