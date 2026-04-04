import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Only send last 3 messages to avoid context overflow
    const trimmedBody = {
      ...body,
      messages: (body.messages || []).slice(-3)
    };
    const res = await fetch("https://homer.margebot.com/dispatch-claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb"
      },
      body: JSON.stringify(trimmedBody),
      signal: AbortSignal.timeout(55000)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, response: "No response" }, { status: 502 });
  }
}
