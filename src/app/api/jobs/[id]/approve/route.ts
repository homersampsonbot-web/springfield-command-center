import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.update({
      where: { id },
      data: {
        requiresApproval: false,
        lastEventAt: new Date(),
      }
    });

    await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: 'APPROVAL',
        message: 'Job approved for execution',
      }
    });

    return Response.json(job);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
