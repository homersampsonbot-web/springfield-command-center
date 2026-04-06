import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const contexts = await prisma.flandersContext.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { id: true, type: true, summary: true, detail: true, createdAt: true }
    });
    return NextResponse.json({ contexts });
  } catch (e: any) {
    return NextResponse.json({ contexts: [], error: e.message });
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { type, summary, detail, jobId } = await req.json();
    if (!type || !summary) return NextResponse.json({ error: 'type and summary required' }, { status: 400 });
    const days = type === 'DECISION' ? 30 : 14;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const context = await prisma.flandersContext.create({
      data: { type, summary, detail, jobId, expiresAt }
    });
    return NextResponse.json({ context });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
