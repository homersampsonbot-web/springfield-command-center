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

    // Maggie Local Status Check
    const maggieLocalUrl = process.env.MAGGIE_LOCAL_URL || "http://maggie.local:8080";
    let maggieLocalStatus = "offline";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const maggieResp = await fetch(`${maggieLocalUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (maggieResp.ok) maggieLocalStatus = "online";
    } catch (e) {}

    const health = {
      gateway: "online",
      database: dbStatus,
      queue: "connected",
      maggieProvider: process.env.MAGGIE_PROVIDER || "gemini",
      maggieLocalStatus,
      agents: {
        homer: "alive",
        bart: "alive",
        lisa: "available",
        maggie: "initializing"
      },
      build: "v1.6-MAGGIE-BRAIN",
      timestamp: Date.now()
    };

    return NextResponse.json(health);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
