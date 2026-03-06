import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Maggie v2: Approval typically moves a job from BLOCKED or QA to its next state.
    // For MVP, we'll mark as IN_PROGRESS if it was requiring approval.
    const job = await prisma.job.update({
      where: { id },
      data: {
        requiresApproval: false,
        status: "IN_PROGRESS", 
        lastEventAt: new Date(),
      }
    });

    await prisma.event.create({
      data: {
        jobId: id,
        scope: 'JOB',
        type: 'JOB_APPROVED',
        level: 'INFO',
        message: 'Job approved for execution',
        payload: { approvedBy: "SMS" }
      }
    });

    return NextResponse.json(job);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
