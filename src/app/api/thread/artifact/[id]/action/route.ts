import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAppAuth(req);
    const body = await req.json();
    const { id } = await params;

    const action = String(body.action || "").trim().toUpperCase();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "action_must_be_APPROVE_or_REJECT" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.type !== "THREAD_ARTIFACT") {
      return NextResponse.json({ error: "artifact_not_found" }, { status: 404 });
    }

    const payload: any = event.payload || {};
    const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.event.update({
      where: { id },
      data: {
        payload: {
          ...payload,
          status: nextStatus,
          reviewedAt: new Date().toISOString(),
          reviewedBy: "SMS",
        },
      },
    });

    await prisma.decisionLedgerEntry.create({
      data: {
        proposalTitle: String(payload.title || event.message || "Artifact review"),
        proposingAgent: "SMS",
        ruling: nextStatus === "APPROVED" ? "APPROVED" : "REJECTED",
        conditions: `Resolved from REVIEW REQUESTED via ${action}`,
        summary: String(payload.content || event.message || ""),
        stageReference: String(payload.stageReference || "6B-ARTIFACT"),
        sourceThreadEventId: event.id,
      },
    });

    return NextResponse.json({ entry: updated, ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_resolve_artifact", message: err.message },
      { status: 500 }
    );
  }
}
