import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueDirective } from "@/lib/maggie/queue";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  await requireAppAuth(req);
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();

  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const provider = process.env.MAGGIE_PROVIDER || "gemini";

  const directive = await prisma.directive.create({
    data: {
      text,
      createdBy: body?.createdBy || "sms",
      status: "QUEUED",
      provider
    },
  });

  await prisma.directiveEvent.create({
    data: {
      directiveId: directive.id,
      level: "INFO",
      message: "Maggie: Directive received"
    }
  });

  try {
    await enqueueDirective(directive.id);
  } catch (e: any) {
    console.error("Failed to enqueue directive:", e.message);
  }

  return NextResponse.json({ directiveId: directive.id });
}
