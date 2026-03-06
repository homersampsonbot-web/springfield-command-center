import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();
    const { thread, message, sender } = body;

    if (!message || thread !== "team") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 1. Fetch latest checkpoint for context restoration if needed
    const lastCheckpoint = await prisma.event.findFirst({
      where: {
        scope: "SYSTEM" as any,
        type: "THREAD_CHECKPOINT",
        payload: { path: ["thread"], equals: "team" }
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Write SMS message to Neon
    const userEvent = await prisma.event.create({
      data: {
        scope: "SYSTEM" as any,
        type: "THREAD_MESSAGE",
        level: "INFO",
        message: message,
        payload: {
          thread: "team",
          participant: sender || "SMS",
          source: "user",
        },
      },
    });

    const responses = [];

    // 3. Routing Logic
    const isMaggie = message.includes("@maggie");
    const isTeam = message.includes("@team");
    const isMarge = message.includes("@marge") || isTeam;
    const isLisa = message.includes("@lisa") || isTeam;
    const isHomer = (!isMarge && !isLisa && !isMaggie) || isTeam || message.includes("@homer");

    const baseUrl = "https://commander.margebot.com";

    const callRelay = async (agent: string) => {
      try {
        // Context Restoration: If this agent was previously unavailable, we could prepend the checkpoint summary.
        // For now, we'll just log that we are using the proxy.
        let enhancedMessage = message;
        // In a real recovery scenario, we'd check if agent was 'offline' in systemHealth
        // and prepend lastCheckpoint.payload.summary if it exists.
        
        const res = await fetch(`${baseUrl}/api/relay/${agent}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: enhancedMessage }),
        });
        
        const raw = await res.text();
        let data;
        let isRateLimited = res.status === 429 || raw.toLowerCase().includes("rate limit") || raw.toLowerCase().includes("cooldown");

        try {
          data = JSON.parse(raw);
        } catch (e) {
          data = { error: "Relay returned non-JSON response", preview: raw.slice(0, 200) };
        }

        let text = data.response || data.reply || data.message || data.error || JSON.stringify(data);
        
        if (isRateLimited) {
          text = `[${agent.toUpperCase()}] — rate limited. Retry shortly.`;
        }

        // Marge failover logic
        if (agent === "marge" && (res.status !== 200 || isRateLimited)) {
           const failoverMsg = "Marge is unavailable. @lisa can you continue?";
           await prisma.event.create({
             data: {
               scope: "SYSTEM" as any,
               type: "THREAD_MESSAGE",
               level: "WARN",
               message: failoverMsg,
               payload: { thread: "team", participant: "SYSTEM", source: "system" },
             }
           });
        }
        
        return await prisma.event.create({
          data: {
            scope: "SYSTEM" as any,
            type: "THREAD_MESSAGE",
            level: (data.error || isRateLimited) ? "ERROR" : "INFO",
            message: text,
            payload: {
              thread: "team",
              participant: agent.toUpperCase(),
              source: (data.error || isRateLimited) ? "system" : "relay",
            },
          },
        });
      } catch (e: any) {
        return await prisma.event.create({
          data: {
            scope: "SYSTEM" as any,
            type: "THREAD_MESSAGE",
            level: "ERROR",
            message: `Relay error (${agent}): ${e.message}`,
            payload: { thread: "team", participant: agent.toUpperCase(), source: "system" },
          },
        });
      }
    };

    if (isHomer) responses.push(await callRelay("homer"));
    if (isMarge) responses.push(await callRelay("marge"));
    if (isLisa) responses.push(await callRelay("lisa"));

    if (isMaggie) {
      const maggieText = "Maggie is analyzing the thread... [Summary: Team coordination in progress. Suggesting a structured Debate if disagreement persists.]";
      responses.push(await prisma.event.create({
        data: {
          scope: "SYSTEM" as any,
          type: "THREAD_MESSAGE",
          level: "INFO",
          message: maggieText,
          payload: { thread: "team", participant: "MAGGIE", source: "relay" },
        },
      }));
    }

    // 4. THREAD_CHECKPOINT logic (every 10 messages)
    const msgCount = await prisma.event.count({
      where: { scope: "SYSTEM" as any, type: "THREAD_MESSAGE", payload: { path: ["thread"], equals: "team" } }
    });

    if (msgCount > 0 && msgCount % 10 === 0) {
      const last10 = await prisma.event.findMany({
        where: { scope: "SYSTEM" as any, type: "THREAD_MESSAGE", payload: { path: ["thread"], equals: "team" } },
        orderBy: { createdAt: "desc" },
        take: 10
      });
      
      const summaryText = `Checkpoint at ${msgCount} messages. Recent activity involves: ${last10.map(m => m.payload?.['participant']).join(", ")}.`;
      
      await prisma.event.create({
        data: {
          scope: "SYSTEM" as any,
          type: "THREAD_CHECKPOINT",
          level: "INFO",
          message: summaryText,
          payload: {
            thread: "team",
            messageCount: msgCount,
            summary: summaryText,
            unresolved: [] 
          }
        }
      });
    }

    return NextResponse.json({ userEvent, responses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
