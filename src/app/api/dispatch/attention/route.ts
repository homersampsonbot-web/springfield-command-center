import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const items = await prisma.job.findMany({
      where: { needsSms: true, status: { not: 'DONE' } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, description: true, status: true, smsNote: true, owner: true, updatedAt: true }
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message });
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { jobId, smsNote, clear } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    await prisma.job.update({
      where: { id: jobId },
      data: { needsSms: !clear, smsNote: clear ? null : smsNote }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
