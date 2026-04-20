import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const gatewayUrl = (process.env.HOMER_GATEWAY_PUBLIC_URL || process.env.HOMER_GATEWAY_URL || "").trim();
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "314e60bced474eb381ac8655eefd3525";
    if (!gatewayUrl) return NextResponse.json({ tracesByAgent: {} });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "6";
    const agent = searchParams.get("agent");

    const url = new URL(`${gatewayUrl.replace(/\/$/, "")}/persistence/traces`);
    if (limit) url.searchParams.set("limit", limit);
    if (agent) url.searchParams.set("agent", agent);

    const res = await fetch(url.toString(), {
      headers: { "x-springfield-key": gatewayKey },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("gateway_unreachable");
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, tracesByAgent: {} }, { status: 500 });
  }
}
