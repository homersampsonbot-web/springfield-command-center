import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const oldJob = await prisma.job.findUnique({ where: { id } });
    const job = await prisma.job.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        owner: body.owner,
        risk: body.risk,
        labels: body.labels,
        requiresApproval: body.requiresApproval,
        blockedReason: body.blockedReason,
        links: body.links,
        lastEventAt: new Date(),
      }
    });

    if (body.status && oldJob?.status !== body.status) {
      await prisma.jobEvent.create({
        data: {
          jobId: id,
          type: 'STATUS_CHANGE',
          message: `Status changed from ${oldJob?.status} to ${body.status}`,
          payload: { old: oldJob?.status, new: body.status }
        }
      });
    }

    return Response.json(job);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
