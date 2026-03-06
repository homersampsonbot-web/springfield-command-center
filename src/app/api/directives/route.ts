import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueDirective } from "@/lib/maggie/queue";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  await requireAppAuth(req);
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();
  const mode = String(body?.mode || "DIRECTIVE").toUpperCase();
  const idempotencyKey = body?.idempotencyKey;

  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const provider = process.env.MAGGIE_PROVIDER || "gemini";

  // Check idempotency
  if (idempotencyKey) {
    const existing = await prisma.directive.findUnique({ where: { idempotencyKey } });
    if (existing) return NextResponse.json({ directiveId: existing.id, reused: true });
  }

  const directive = await prisma.directive.create({
    data: {
      text,
      mode,
      idempotencyKey,
      createdBy: body?.createdBy || "sms",
      status: "RECEIVED",
      provider
    },
  });

  await prisma.event.create({
    data: {
      directiveId: directive.id,
      scope: "DIRECTIVE",
      type: "DIRECTIVE_RECEIVED",
      level: "INFO",
      message: `Maggie: ${mode} received`
    }
  });

  try {
    // If mode is AUTO_PLAN, we might want to trigger a different worker or pass mode to the queue
    await enqueueDirective(directive.id);
  } catch (e: any) {
    console.error("Failed to enqueue directive:", e.message);
  }

  return NextResponse.json({ directiveId: directive.id });
}
