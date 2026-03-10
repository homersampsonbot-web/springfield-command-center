import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

async function persistMaggieEvent(payload: { agent?: string; type: string; timestamp?: string; payload?: any }) {
  try {
    const gatewayUrl = (process.env.HOMER_GATEWAY_PUBLIC_URL || process.env.HOMER_GATEWAY_URL || "").trim();
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";
    if (!gatewayUrl) return;
    await fetch(`${gatewayUrl.replace(/\/$/, "")}/persistence/maggie-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-springfield-key": gatewayKey },
      body: JSON.stringify({
        agent: payload.agent || "maggie",
        type: payload.type,
        timestamp: payload.timestamp || new Date().toISOString(),
        payload: payload.payload || {},
      }),
    });
  } catch {}
}

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Filter for Maggie-related activity
    // Types: DIRECTIVE_*, PLAN_*, SIMULATION_*, JOB_*, DEBATE_*, SYSTEM_* where actor is Maggie or relevant scope
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { type: { startsWith: 'DIRECTIVE_' } },
          { type: { startsWith: 'PLAN_' } },
          { type: { startsWith: 'SIMULATION_' } },
          { type: { startsWith: 'DEBATE_' } },
          { type: { startsWith: 'SYSTEM_' } },
          // Jobs explicitly tied to Maggie
          { AND: [{ type: { startsWith: 'JOB_' } }, { job: { owner: 'MAGGIE' } }] },
          { AND: [{ type: { startsWith: 'JOB_' } }, { payload: { path: ['executorHost'], equals: 'maggie' } }] }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(events);
  } catch (e: any) {
    console.error("[API MAGGIE EVENTS ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();
    const event = await prisma.event.create({
      data: {
        scope: body.scope || "SYSTEM",
        type: body.type || "EVENT",
        level: body.level || "INFO",
        message: body.message || "Maggie event",
        payload: body.payload || {},
      }
    });
    await persistMaggieEvent({ agent: body.agent || "maggie", type: event.type, timestamp: event.createdAt.toISOString(), payload: event.payload });
    return NextResponse.json(event);
  } catch (e: any) {
    console.error("[API MAGGIE EVENTS POST ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
