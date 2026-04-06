import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";
export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const r = await fetch("https://homer.margebot.com/api/marge-relay-health", {
      headers: { "x-springfield-key": process.env.SPRINGFIELD_KEY || "" },
      signal: AbortSignal.timeout(5000)
    });
    const d = await r.json();
    return NextResponse.json(d);
  } catch (e: any) {
    return NextResponse.json({ status: "offline", error: e.message });
  }
}
