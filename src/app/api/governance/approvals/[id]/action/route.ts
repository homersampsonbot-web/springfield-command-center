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
    const feedback = body.feedback ? String(body.feedback) : null;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "action_must_be_APPROVE_or_REJECT" },
        { status: 400 }
      );
    }

    const existing = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "approval_not_found" },
        { status: 404 }
      );
    }

    const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const entry = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: nextStatus as any,
        feedback,
        resolvedAt: new Date(),
        resolvedBy: "SMS",
      },
    });

    await prisma.decisionLedgerEntry.create({
      data: {
        proposalTitle: entry.title,
        proposingAgent: "SMS",
        ruling: nextStatus === "APPROVED" ? "APPROVED" : "REJECTED",
        conditions: feedback || `Resolved from Action Items via ${action}`,
        summary: entry.description,
        stageReference: "6B-ACTIONITEMS",
        sourceThreadEventId: null,
      },
    });

    return NextResponse.json({ entry, ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_resolve_approval", message: err.message },
      { status: 500 }
    );
  }
}
