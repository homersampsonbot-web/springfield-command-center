import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const relayUrl = process.env.LISA_RELAY_URL || "https://homer.margebot.com/lisa";
    if (relayUrl === "disabled") {
      return NextResponse.json({ error: "Relay is in maintenance", relay: "lisa", status: "maintenance" }, { status: 503 });
    }
    const res = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      return NextResponse.json({ 
        error: "Relay returned non-JSON response", 
        raw: raw,
        relay: "lisa"
      }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ 
      error: "Relay proxy failure", 
      message: err.message 
    }, { status: 500 });
  }
}
