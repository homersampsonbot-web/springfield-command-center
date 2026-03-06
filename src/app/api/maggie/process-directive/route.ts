import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDirectiveToJobs } from "@/lib/maggieProvider";

export async function POST(req: Request) {
  const { directiveId } = await req.json().catch(() => ({}));
  if (!directiveId) return NextResponse.json({ error: "Missing directiveId" }, { status: 400 });

  const directive = await prisma.directive.findUnique({ where: { id: directiveId } });
  if (!directive) return NextResponse.json({ error: "Directive not found" }, { status: 404 });

  if (directive.status === "PLANNED") return NextResponse.json({ ok: true, skipped: true });

  await prisma.directive.update({
    where: { id: directiveId },
    data: { status: "PROCESSING", error: null }
  });

  await prisma.event.create({
    data: { directiveId, scope: "DIRECTIVE", type: "PLANNING_STARTED", level: "INFO", message: "Maggie: Parsing directive" }
  });

  try {
    const plan = await parseDirectiveToJobs(directive.text);

    await prisma.event.create({
      data: { directiveId, scope: "DIRECTIVE", type: "DECOMPOSING_TASKS", level: "INFO", message: "Maggie: Decomposing tasks" }
    });

    const created = await prisma.$transaction(async (tx) => {
      const jobs = [] as { job: any; dependsOnTitles: string[] }[];
      for (const j of plan.jobs) {
        const job = await tx.job.create({
          data: {
            title: j.title.trim(),
            description: (j.notes || "").trim(),
            status: j.status as any,
            risk: j.priority as any,
            owner: j.owner as any,
            directiveId: directiveId,
            requiresApproval: Boolean(j.requiresApproval),
            labels: j.tags || [],
          },
        });
        jobs.push({ job, dependsOnTitles: j.dependsOn || [] });
        await tx.event.create({
          data: { jobId: job.id, scope: "JOB", type: "JOB_CREATED", level: "INFO", message: `Job created: ${job.title}` }
        });
      }

      const byTitle = new Map(jobs.map(x => [x.job.title, x.job.id]));
      // Note: JobDependency table removed in v2 schema. Dependencies stored in JSON.
      // Skipping relational dependency creation for now as per v2 spec.
      return jobs.map(x => x.job);
    });

    await prisma.directive.update({
      where: { id: directiveId },
      data: {
        status: "PLANNED",
        jobsCreated: created.length,
        rawModelJson: JSON.stringify(plan.meta || {})
      }
    });

    await prisma.event.create({
      data: { directiveId, scope: "DIRECTIVE", type: "PLAN_COMPLETE", level: "SUCCESS", message: "Maggie: Plan complete" }
    });

    return NextResponse.json({ ok: true, jobs: created.length });

  } catch (e: any) {
    await prisma.directive.update({
      where: { id: directiveId },
      data: { status: "FAILED", error: String(e?.message || e) }
    });

    await prisma.event.create({
      data: { directiveId, scope: "DIRECTIVE", type: "PLAN_ERROR", level: "ERROR", message: `Maggie: ${String(e?.message || e)}` }
    });

    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
