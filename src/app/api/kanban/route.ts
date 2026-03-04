import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(jobs);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return Response.json({ error: "Missing id or status" }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: { status },
    });

    // Log the event
    await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: "STATUS_CHANGE",
        message: `Status changed to ${status}`,
      },
    });

    return Response.json(job);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
