import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();
    const res = await fetch("https://homer.margebot.com/marge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
