import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_RULINGS = [
  "APPROVED",
  "APPROVED_WITH_CONDITIONS",
  "REJECTED",
  "DIRECTIVE",
] as const;

const ALLOWED_PROPOSING_AGENTS = [
  "LISA",
  "HOMER",
  "BART",
  "MAGGIE",
  "SMS",
] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const stageReference = searchParams.get("stageReference");
    const ruling = searchParams.get("ruling");

    const limit =
      limitParam && !Number.isNaN(Number(limitParam))
        ? Math.min(Math.max(Number(limitParam), 1), 100)
        : 25;

    const where: any = {};

    if (stageReference) {
      where.stageReference = stageReference;
    }

    if (ruling) {
      if (!ALLOWED_RULINGS.includes(ruling as any)) {
        return NextResponse.json({ error: "invalid ruling filter" }, { status: 400 });
      }
      where.ruling = ruling;
    }

    const entries = await prisma.decisionLedgerEntry.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({
      entries,
      count: entries.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "ledger_get_failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      proposalTitle,
      proposingAgent,
      ruling,
      conditions,
      summary,
      stageReference,
      sourceThreadEventId,
    } = body || {};

    if (!proposalTitle || typeof proposalTitle !== "string") {
      return NextResponse.json({ error: "proposalTitle required" }, { status: 400 });
    }

    if (!proposingAgent || !ALLOWED_PROPOSING_AGENTS.includes(proposingAgent)) {
      return NextResponse.json({ error: "invalid proposingAgent" }, { status: 400 });
    }

    if (!ruling || !ALLOWED_RULINGS.includes(ruling)) {
      return NextResponse.json({ error: "invalid ruling" }, { status: 400 });
    }

    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "summary required" }, { status: 400 });
    }

    if (!stageReference || typeof stageReference !== "string") {
      return NextResponse.json({ error: "stageReference required" }, { status: 400 });
    }

    const entry = await prisma.decisionLedgerEntry.create({
      data: {
        proposalTitle,
        proposingAgent,
        ruling,
        conditions: conditions || null,
        summary,
        stageReference,
        sourceThreadEventId: sourceThreadEventId || null,
      },
    });

    return NextResponse.json({ entry, ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "ledger_post_failed" },
      { status: 500 }
    );
  }
}
