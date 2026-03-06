import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAppAuth(req);
    const { id: jobId } = await params;
    const body = await req.json();
    const { status, result, error, metadata } = body;

    if (!['DONE', 'FAILED', 'IN_PROGRESS', 'CLAIMED'].includes(status)) {
      // Map incoming "COMPLETE" to "DONE" for schema compatibility
      const targetStatus = status === 'COMPLETE' ? 'DONE' : status;
      if (!['DONE', 'FAILED', 'IN_PROGRESS', 'CLAIMED'].includes(targetStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    const targetStatus = status === 'COMPLETE' ? 'DONE' : status;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: targetStatus as any,
        lastError: error || null,
        updatedAt: new Date(),
        lastEventAt: new Date(),
      }
    });

    const eventType = targetStatus === 'DONE' ? 'JOB_COMPLETED' : 
                     targetStatus === 'FAILED' ? 'JOB_FAILED' : 'JOB_STATUS_UPDATED';

    await prisma.event.create({
      data: {
        jobId,
        scope: 'JOB',
        type: eventType,
        level: targetStatus === 'FAILED' ? 'ERROR' : 'INFO',
        message: targetStatus === 'DONE' ? `Job completed successfully` : (error || `Job status updated to ${targetStatus}`),
        payload: { 
          result, 
          metadata,
          executorHost: metadata?.executorHost || 'homer'
        }
      }
    });

    return NextResponse.json({ success: true, jobId, status: targetStatus });
  } catch (e: any) {
    console.error("[API JOB STATUS UPDATE ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
