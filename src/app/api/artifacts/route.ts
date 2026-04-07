import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

    const artifacts = await prisma.artifact.findMany({
      where: {
        ...(status && { status }),
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    return NextResponse.json({ artifacts });
  } catch (e: any) {
    return NextResponse.json({ artifacts: [], error: e.message });
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { type, title, content, authorAgent, jobId, threadRef, status } = await req.json();
    if (!type || !title || !content || !authorAgent) {
      return NextResponse.json({ error: 'type, title, content, authorAgent required' }, { status: 400 });
    }
    const artifact = await prisma.artifact.create({
      data: { type, title, content, authorAgent, jobId, threadRef, status: status || 'PENDING_REVIEW' }
    });
    return NextResponse.json({ artifact });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
