import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

const ALLOWED_TYPES = ["PROPOSAL", "PLAN", "TEST_REPORT", "ARCHITECTURE_NOTE", "HANDOFF"];
const ALLOWED_STATUS = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"];

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const { searchParams } = new URL(req.url);
    const thread = searchParams.get("thread") || "team";
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100);

    const events = await prisma.event.findMany({
      where: {
        type: "THREAD_ARTIFACT",
        payload: status
          ? { path: ["status"], equals: status }
          : { path: ["thread"], equals: thread },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ entries: events, count: events.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_load_artifacts", message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();

    const thread = String(body.thread || "team");
    const artifactType = String(body.artifactType || "").trim().toUpperCase();
    const title = String(body.title || "").trim();
    const proposingAgent = String(body.proposingAgent || "").trim().toUpperCase();
    const stageReference = String(body.stageReference || "").trim();
    const status = String(body.status || "DRAFT").trim().toUpperCase();
    const content = String(body.content || "").trim();
    const recommendedAction = String(body.recommendedAction || "").trim();

    if (!ALLOWED_TYPES.includes(artifactType)) {
      return NextResponse.json(
        { error: "invalid_artifact_type" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { error: "invalid_artifact_status" },
        { status: 400 }
      );
    }

    if (!title || !proposingAgent || !stageReference || !content) {
      return NextResponse.json(
        { error: "title_proposingAgent_stageReference_content_required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "THREAD_ARTIFACT",
        level: "INFO",
        message: `${artifactType}: ${title}`,
        payload: {
          thread,
          artifactType,
          title,
          proposingAgent,
          stageReference,
          status,
          content,
          recommendedAction,
          source: "artifact-api",
        },
      },
    });

    return NextResponse.json({ entry: event, ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_create_artifact", message: err.message },
      { status: 500 }
    );
  }
}
