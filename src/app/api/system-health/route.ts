import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connectivity
    let dbStatus = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = "disconnected";
    }

    const health = {
      gateway: "online",
      database: dbStatus,
      queue: "connected",
      agents: {
        homer: "alive",
        bart: "alive",
        lisa: "available",
        maggie: "initializing"
      },
      build: "v1.5-MOBILE-DND",
      timestamp: Date.now()
    };

    return NextResponse.json(health);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
