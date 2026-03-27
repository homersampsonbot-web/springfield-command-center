import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.message === "__relay_debug__") {
      return NextResponse.json({
        ok: true,
        relay: "homer",
        target: "https://homer.margebot.com/chat"
      });
    }
    const res = await fetch("https://homer.margebot.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-springfield-key": process.env.SPRINGFIELD_KEY || "c4c75fe2065fb96842e3690a3a6397fb"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
      
      let status =
        data.status ||
        data.state ||
        data.phase ||
        (data.reply ? "ACKNOWLEDGED" : "UNKNOWN");

      status = String(status).toUpperCase();

      if (status.includes("PROGRESS")) status = "IN_PROGRESS";
      if (status.includes("COMPLETE")) status = "COMPLETE";
      if (status.includes("BLOCK") || data.error) status = "BLOCKED";

      return NextResponse.json({
        ...data,
        _springfield: {
          agent: "HOMER",
          status,
          timestamp: new Date().toISOString()
        }
      }, { status: res.status });

    } catch (e) {
      return NextResponse.json({ 
        error: "Relay returned non-JSON response", 
        raw: raw,
        relay: "homer"
      }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ 
      error: "Relay proxy failure", 
      message: err.message 
    }, { status: 500 });
  }
}
