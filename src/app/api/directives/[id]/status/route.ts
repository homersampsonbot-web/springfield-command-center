import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAppAuth(req);
  const { id } = await params;

  const directive = await prisma.directive.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 6
      }
    }
  });

  if (!directive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: directive.status,
    provider: directive.provider,
    jobsCreated: directive.jobsCreated,
    error: directive.error,
    events: directive.events.map(e => ({
      ts: e.createdAt.toISOString(),
      level: e.level,
      message: e.message
    }))
  });
}
