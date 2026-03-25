import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const thread = searchParams.get("thread");
    const limit = parseInt(searchParams.get("limit") || "50");

    const participant = searchParams.get("participant");
    const source = searchParams.get("source");
    const type = searchParams.get("type");
    const requestId = searchParams.get("requestId");

    if (thread !== "team") {
      return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
    }

    const where: any = {
      scope: "SYSTEM",
      type: type || "THREAD_MESSAGE",
      payload: {
        path: ["thread"],
        equals: "team"
      }
    };

    if (participant) {
      where.payload = {
        ...where.payload,
        path: ["participant"],
        equals: participant
      };
    }

    const messages = await prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(messages.reverse());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
