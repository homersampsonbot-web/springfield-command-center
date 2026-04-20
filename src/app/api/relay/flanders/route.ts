import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.message === "__relay_debug__") {
      return NextResponse.json({ ok: true, relay: "flanders", target: "https://homer.margebot.com/api/flanders-relay" });
    }

    // Inject team thread context prefix so Flanders knows he's in team chat
    const enhanced = `[TEAM THREAD - you are Flanders, SMS proxy and dispatch brain. Be concise, max 3 sentences. Write directives starting with DIRECTIVE: if action is needed.] ${body.message || ''}`;

    const relayUrl = process.env.FLANDERS_RELAY_URL || "https://homer.margebot.com/api/flanders-relay";
    const res = await fetch(relayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-springfield-key": process.env.SPRINGFIELD_KEY || "314e60bced474eb381ac8655eefd3525"
      },
      body: JSON.stringify({ ...body, message: enhanced }),
      signal: AbortSignal.timeout(280000),
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
      return NextResponse.json({
        ...data,
        _springfield: { agent: "FLANDERS", status: "RESPONDED", timestamp: new Date().toISOString() }
      }, { status: res.status });
    } catch (e) {
      return NextResponse.json({ error: "Relay returned non-JSON", raw, relay: "flanders" }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Relay proxy failure", message: err.message }, { status: 500 });
  }
}
