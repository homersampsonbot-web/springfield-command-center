import { NextResponse } from "next/server";

export async function GET() {
  try {
    const gatewayUrl = process.env.HOMER_GATEWAY_PUBLIC_URL || process.env.HOMER_GATEWAY_URL || "";
    if (!gatewayUrl) {
      return NextResponse.json({
        persistence: {
          compute: "offline",
          queue: "offline",
          memory: "offline",
          storage: "offline",
          network: "disconnected",
        },
        debug: { error: "missing_gateway_url" },
      }, { headers: { "Cache-Control": "no-store" } });
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

    const targetUrl = `${gatewayUrl.replace(/\/$/, "")}/persistence-health`;
    let data: any = null;
    let error: string | null = null;
    try {
      const res = await fetchWithRetry(targetUrl);
      if (!res.ok) throw new Error(`gateway_unreachable_${res.status}`);
      data = await res.json();
    } catch (e: any) {
      error = e?.message || "gateway_unreachable";
    }

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
      debug: {
        source: targetUrl,
        error,
        raw: data,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
