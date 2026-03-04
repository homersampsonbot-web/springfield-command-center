import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/maggie/recordEvent";
import { parseDirectiveToJobs } from "@/lib/maggieProvider";

export async function POST(req: Request) {
  const { directiveId } = await req.json().catch(() => ({}));
  if (!directiveId) return NextResponse.json({ error: "Missing directiveId" }, { status: 400 });

  const directive = await prisma.directive.findUnique({
    where: { id: directiveId }
  });

  if (!directive) return NextResponse.json({ error: "Directive not found" }, { status: 404 });

  // idempotency: if already parsed, no-op
  if (directive.status === "PARSED") return NextResponse.json({ ok: true, skipped: true });

  await prisma.directive.update({
    where: { id: directiveId },
    data: { status: "PROCESSING", error: null }
  });

  await recordEvent({ 
    type: "DIRECTIVE", 
    message: `Maggie: parsing directive ${directiveId}` 
  });

  try {
    const plan = await parseDirectiveToJobs(directive.text);

    // create jobs
    const created = await prisma.$transaction(async (tx) => {
      const jobs = [];
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
        
        await tx.jobEvent.create({
          data: {
            jobId: job.id,
            type: "INFO",
            message: `Job created via Maggie: ${job.title}`
          }
        });
      }

      // dependencies by title
      const byTitle = new Map(jobs.map(x => [x.job.title, x.job.id]));
      for (const x of jobs) {
        for (const depTitle of x.dependsOnTitles) {
          const depId = byTitle.get(depTitle);
          if (!depId) continue;
          await tx.jobDependency.create({
            data: {
              jobId: x.job.id,
              dependsOnJobId: depId
            },
          });
        }
      }
      return jobs.map(x => x.job);
    });

    await prisma.directive.update({
      where: { id: directiveId },
      data: {
        status: "PARSED",
        parsedJobs: created.length,
        rawModelJson: JSON.stringify(plan.meta || {})
      },
    });

    await recordEvent({ 
      type: "DIRECTIVE", 
      message: `Maggie: parsed ${created.length} jobs from directive ${directiveId}` 
    });

    return NextResponse.json({ ok: true, jobs: created.length });

  } catch (e: any) {
    await prisma.directive.update({
      where: { id: directiveId },
      data: { status: "FAILED", error: String(e?.message || e) }
    });
    
    await recordEvent({ 
      type: "ERROR", 
      message: `Maggie parse failed: ${String(e?.message || e)}` 
    });

    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
