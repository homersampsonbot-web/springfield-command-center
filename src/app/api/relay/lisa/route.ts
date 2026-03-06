import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch("http://18.190.203.220:3004/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
