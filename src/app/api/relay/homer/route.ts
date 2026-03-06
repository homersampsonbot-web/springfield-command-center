import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch("https://homer.margebot.com/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-springfield-key": process.env.SPRINGFIELD_KEY || "c4c75fe2065fb96842e3690a3a6397fb"
      },
      body: JSON.stringify(body)
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      return NextResponse.json({ 
        error: "Relay returned non-JSON response", 
        preview: raw.slice(0, 200),
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
