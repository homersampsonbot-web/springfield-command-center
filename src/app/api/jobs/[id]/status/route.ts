import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json();
    const { status, result, error, metadata } = body;

    // Security: Validate Springfield API Key
    const apiKey = req.headers.get("x-springfield-key");
    const validKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";

    if (apiKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map incoming status to JobStatus enum
    let targetStatus: any;
    if (status === 'COMPLETE' || status === 'DONE') {
      targetStatus = 'DONE';
    } else if (status === 'FAILED') {
      targetStatus = 'FAILED';
    } else if (status === 'IN_PROGRESS') {
      targetStatus = 'IN_PROGRESS';
    } else if (status === 'CLAIMED') {
      targetStatus = 'CLAIMED';
    } else {
      return NextResponse.json({ error: "Invalid status: " + status }, { status: 400 });
    }

    // Update Job in Postgres
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: targetStatus,
        lastError: error || null,
        updatedAt: new Date(),
        lastEventAt: new Date(),
      }
    });

    // Create Event record
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
