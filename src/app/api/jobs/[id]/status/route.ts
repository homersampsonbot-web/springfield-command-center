import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function persistJobExecution(payload: {
  jobId: string;
  agent: string;
  status: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
}) {
  try {
    const gatewayUrl = (process.env.HOMER_GATEWAY_PUBLIC_URL || process.env.HOMER_GATEWAY_URL || "").trim();
    const gatewayKey = process.env.HOMER_GATEWAY_TOKEN || "c4c75fe2065fb96842e3690a3a6397fb";
    if (!gatewayUrl) return;
    await fetch(`${gatewayUrl.replace(/\/$/, "")}/persistence/job`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-springfield-key": gatewayKey },
      body: JSON.stringify(payload),
    });
  } catch {}
}

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
      console.warn(`Unauthorized status update for job ${jobId}. Received: ${apiKey}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map status
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
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update DB
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: targetStatus,
        lastError: error || null,
        updatedAt: new Date(),
        lastEventAt: new Date(),
      }
    });

    // Write Event
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

    const startTime = metadata?.startTime || updatedJob?.createdAt?.toISOString?.();
    const endTime = metadata?.endTime || new Date().toISOString();
    const durationMs = metadata?.durationMs || (startTime ? Date.parse(endTime) - Date.parse(startTime) : null);
    await persistJobExecution({
      jobId,
      agent: (updatedJob.owner || metadata?.executorHost || 'homer').toString().toLowerCase(),
      status: targetStatus,
      title: updatedJob.title,
      startTime,
      endTime,
      duration: durationMs ? `${(durationMs / 1000).toFixed(1)}s` : undefined,
    });

    return NextResponse.json({ success: true, jobId, status: targetStatus });
  } catch (e: any) {
    console.error("[SYNC_BACK_API_ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
