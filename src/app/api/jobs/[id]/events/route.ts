import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const events = await prisma.jobEvent.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(events);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const event = await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: body.type || 'LOG',
        message: body.message,
        payload: body.payload || {}
      }
    });

    await prisma.job.update({
      where: { id },
      data: { lastEventAt: new Date() }
    });

    return NextResponse.json(event);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
