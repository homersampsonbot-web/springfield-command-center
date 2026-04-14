import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const thread = searchParams.get("thread");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (thread !== "team" && thread !== "command") {
      return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
    }

    const messages = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Event"
      WHERE scope = 'SYSTEM'
      AND type = 'THREAD_MESSAGE'
      AND payload->>'thread' = $1
      ORDER BY "createdAt" DESC
      LIMIT $2
    `, thread, limit) as any[];

    return NextResponse.json(messages.reverse());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
