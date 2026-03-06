import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

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
