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

    const messages = await prisma.event.findMany({
      where: {
        scope: "SYSTEM" as any, // Re-purposing SYSTEM scope for THREAD
        type: "THREAD_MESSAGE",
        payload: {
          path: ["thread"],
          equals: "team",
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json(messages);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
