import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request, context: any) {
  try {
    await requireAppAuth(req);
    const { id } = await context.params;
    const artifact = await prisma.artifact.findUnique({ where: { id } });
    if (!artifact) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ artifact });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  try {
    await requireAppAuth(req);
    const { id } = await context.params;
    const { status, reviewedBy, reviewNote } = await req.json();
    const artifact = await prisma.artifact.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(reviewedBy && { reviewedBy }),
        ...(reviewNote && { reviewNote })
      }
    });
    return NextResponse.json({ artifact });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
