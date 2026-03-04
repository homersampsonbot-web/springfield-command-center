import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_STATUSES = ["QUEUED", "IN_PROGRESS", "BLOCKED", "QA", "DONE"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const oldJob = await prisma.job.findUnique({ where: { id } });
    if (!oldJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        status,
        lastEventAt: new Date(),
      }
    });

    if (oldJob.status !== status) {
      await prisma.jobEvent.create({
        data: {
          jobId: id,
          type: 'STATUS_CHANGE',
          message: `Status changed from ${oldJob.status} to ${status}`,
          payload: { old: oldJob.status, new: status }
        }
      });
    }

    return NextResponse.json(job);
  } catch (e: any) {
    console.error("[API PATCH JOB ERROR]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
