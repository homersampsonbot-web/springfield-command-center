import { prisma } from "@/lib/prisma";

function dbUnavailable(err: any) {
  const msg = err?.message || "";
  return msg.includes("P1001") || msg.includes("Can't reach database server");
}

const ALLOWED_FIELDS = [
  "options",
  "recommendation",
  "decision",
  "decisionBy",
  "state",
  "bartVerified",
  "bartEvidenceUrl",
  "smsOverride",
  "smsOverrideNote",
];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const debate = await prisma.debate.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: "desc" } } },
    });
    if (!debate) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(debate);
  } catch (e: any) {
    if (dbUnavailable(e)) return Response.json({ error: "db_unreachable" }, { status: 503 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    // Validation rules
    if (data.state === "DECIDED") {
      if (!data.decision || !data.decisionBy) {
        return Response.json({ error: "decision_required" }, { status: 400 });
      }
      if (data.decisionBy !== "marge" && data.smsOverride !== true) {
        return Response.json({ error: "sms_override_required" }, { status: 400 });
      }
    }
    if (data.bartVerified === true && !data.bartEvidenceUrl) {
      return Response.json({ error: "bart_evidence_required" }, { status: 400 });
    }

    const debate = await prisma.debate.update({
      where: { id },
      data,
    });

    await prisma.debateEvent.create({
      data: {
        debateId: id,
        type: "UPDATED",
        message: "Debate updated",
        meta: data,
      },
    });

    return Response.json(debate);
  } catch (e: any) {
    if (dbUnavailable(e)) return Response.json({ error: "db_unreachable" }, { status: 503 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
