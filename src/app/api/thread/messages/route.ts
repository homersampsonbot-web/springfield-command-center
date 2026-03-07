import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const thread = searchParams.get("thread");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (thread !== "team") {
      return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
    }

    // Fix: Fetch the most RECENT messages by sorting DESC first, then take the limit.
    const messages = await prisma.event.findMany({
      where: {
        scope: "SYSTEM" as any,
        type: "THREAD_MESSAGE",
        payload: {
          path: ["thread"],
          equals: "team",
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Re-sort back to ASC for the UI message list order.
    return NextResponse.json(messages.reverse());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
