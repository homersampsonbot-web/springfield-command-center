import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: { events: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { updatedAt: 'desc' }
    });

    // Simple seed if empty
    if (jobs.length === 0) {
      const seedJobs = [
        { title: "Enable Maggie orchestration layer", owner: "MAGGIE", status: "INTAKE", risk: "HIGH" },
        { title: "Harden Cloudflare tunnel security", owner: "HOMER", status: "QUEUED", risk: "HIGH" },
        { title: "Improve Homer health monitoring", owner: "HOMER", status: "RUNNING", risk: "MED" },
        { title: "Add Bart visual validation pipeline", owner: "BART", status: "QUEUED", risk: "MED" },
        { title: "Build Command Center Kanban board", owner: "LISA", status: "RUNNING", risk: "LOW" },
        { title: "Implement structured directive routing", owner: "MARGE", status: "QUEUED", risk: "HIGH" },
        { title: "Add system health strip to UI", owner: "LISA", status: "INTAKE", risk: "LOW" },
        { title: "Configure secrets rotation policy", owner: "MARGE", status: "INTAKE", risk: "HIGH" },
      ];

      await prisma.job.createMany({
        data: seedJobs.map(j => ({ ...j as any, labels: [j.owner] }))
      });

      const newJobs = await prisma.job.findMany({ include: { events: true } });
      return Response.json(newJobs);
    }

    return Response.json(jobs);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const job = await prisma.job.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || 'QUEUED',
        owner: body.owner || 'MAGGIE',
        risk: body.risk || 'LOW',
        labels: body.labels || [],
        requiresApproval: !!body.requiresApproval,
      }
    });
    return Response.json(job);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
