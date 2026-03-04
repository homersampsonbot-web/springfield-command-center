import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueDirective } from "@/lib/maggie/queue";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  await requireAppAuth(req);
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();
  
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const directive = await prisma.directive.create({
    data: { 
      text, 
      createdBy: body?.createdBy || "sms" 
    },
  });

  try {
    await enqueueDirective(directive.id);
  } catch (e: any) {
    console.error("Failed to enqueue directive:", e.message);
    // Continue anyway as it's saved in DB
  }

  return NextResponse.json({ ok: true, id: directive.id });
}
