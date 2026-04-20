import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const relayUrl = (!process.env.MARGE_RELAY_URL || process.env.MARGE_RELAY_URL === "disabled") ? "https://homer.margebot.com/api/marge-relay" : process.env.MARGE_RELAY_URL;
    if (relayUrl === "disabled") {
      return NextResponse.json({ error: "Relay is in maintenance", relay: "marge", status: "maintenance" }, { status: 503 });
    }
    async function callRelay() {
      return fetch(relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-springfield-key": process.env.SPRINGFIELD_KEY || "314e60bced474eb381ac8655eefd3525" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
    }

    let res;
    try {
      res = await callRelay();
    } catch {
      // retry once if relay times out
      res = await callRelay();
    }

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      return NextResponse.json({ 
        error: "Relay returned non-JSON response", 
        raw: raw,
        relay: "marge"
      }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ 
      error: "Relay proxy failure", 
      message: err.message 
    }, { status: 500 });
  }
}
