import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAppAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const entries = await prisma.approvalRequest.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ entries, count: entries.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_load_approvals", message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const requestedBy = String(body.requestedBy || "").trim().toUpperCase();
    const sourceType = body.sourceType ? String(body.sourceType) : null;
    const sourceId = body.sourceId ? String(body.sourceId) : null;

    if (!title || !description) {
      return NextResponse.json(
        { error: "title_and_description_required" },
        { status: 400 }
      );
    }

    if (!["MAGGIE", "SMS"].includes(requestedBy)) {
      return NextResponse.json(
        { error: "requestedBy_must_be_MAGGIE_or_SMS" },
        { status: 400 }
      );
    }

    const entry = await prisma.approvalRequest.create({
      data: {
        title,
        description,
        requestedBy: requestedBy as any,
        status: "PENDING",
        sourceType,
        sourceId,
      },
    });

    return NextResponse.json({ entry, ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "failed_to_create_approval", message: err.message },
      { status: 500 }
    );
  }
}
