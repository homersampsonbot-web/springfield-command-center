import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { messages, system } = await req.json();
    if (!messages) return NextResponse.json({ error: "messages required" }, { status: 400 });

    const job = await prisma.job.create({
      data: {
        title: `FLANDERS_REQUEST:${Date.now()}`,
        description: JSON.stringify({ messages, system }),
        status: "QUEUED",
        owner: "FLANDERS",
        risk: "LOW",
        requiresApproval: false,
        labels: ["flanders", "dispatch"]
      }
    });

    return NextResponse.json({ jobId: job.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true, description: true }
    });

    if (!job) return NextResponse.json({ status: "not_found" });
    if (job.status === "DONE") {
      const result = JSON.parse(job.description || "{}");
      return NextResponse.json({ status: "done", response: result.response });
    }
    if (job.status === "FAILED") return NextResponse.json({ status: "failed" });
    return NextResponse.json({ status: "pending" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
