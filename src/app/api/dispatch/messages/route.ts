import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

// GET — load recent dispatch messages
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { type: "DISPATCH_MESSAGE" },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, message: true, payload: true, createdAt: true }
    });
    const messages = events.map(e => ({
      id: e.id,
      agent: (e.payload as any)?.agent || 'FLANDERS',
      content: e.message || '',
      type: (e.payload as any)?.type || 'response',
      ts: new Date(e.createdAt).toLocaleTimeString()
    }));
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ messages: [], error: e.message });
  }
}

// POST — save a dispatch message
export async function POST(req: Request) {
  try {
    const { agent, content, type } = await req.json();
    if (!agent || !content) return NextResponse.json({ error: "missing fields" }, { status: 400 });
    // Don't persist routing/status messages
    if (type === 'routing') return NextResponse.json({ ok: true });
    await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "DISPATCH_MESSAGE",
        level: "INFO",
        message: content.slice(0, 2000),
        payload: { agent, type: type || 'response' }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
