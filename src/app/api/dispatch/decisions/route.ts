import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const decisions = await prisma.decisionLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json({ decisions });
  } catch (e: any) {
    return NextResponse.json({ decisions: [], error: e.message });
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { title, decision, decidedBy, context, jobId } = await req.json();
    if (!title || !decision || !decidedBy) {
      return NextResponse.json({ error: 'title, decision, decidedBy required' }, { status: 400 });
    }
    const entry = await prisma.decisionLedger.create({
      data: { title, decision, decidedBy, context, jobId }
    });
    return NextResponse.json({ entry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
