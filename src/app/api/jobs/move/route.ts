import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { jobId, toStatus } = await req.json();

    if (!jobId || !toStatus) {
      return NextResponse.json({ error: "Missing jobId or toStatus" }, { status: 400 });
    }

    const oldJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!oldJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: toStatus,
        lastEventAt: new Date()
      },
    });

    // Log the event
    await prisma.event.create({
      data: {
        jobId: jobId,
        scope: "JOB",
        type: "STATUS_CHANGE",
        level: "INFO",
        message: `Status moved from ${oldJob.status} to ${toStatus}`,
        payload: { from: oldJob.status, to: toStatus }
      },
    });

    return NextResponse.json(job);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
