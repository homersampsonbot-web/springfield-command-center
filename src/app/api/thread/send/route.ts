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

    const senderNorm = (sender || "SMS").toUpperCase();

    // 1. Fetch latest checkpoint for context restoration if needed
    const lastCheckpoint = await prisma.event.findFirst({
      where: {
        scope: "SYSTEM" as any,
        type: "THREAD_CHECKPOINT",
        payload: { path: ["thread"], equals: "team" }
      },
      orderBy: { createdAt: "desc" }
    });

    const responses = [] as any[];

    // 3. Routing Logic
    const tag = (t: string) => message.toLowerCase().includes(t);
    const isMaggie = tag("@maggie");
    const isTeam = tag("@team");
    const isMarge = tag("@marge") || isTeam;
    const isLisa = tag("@lisa") || isTeam;
    const isHomer = tag("@homer") || isTeam;

    const baseUrl = "https://commander.margebot.com";

    const callRelay = async (agent: string) => {
      try {
        let enhancedMessage = message;
        
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
               payload: { thread: "team", participant: "SYSTEM", source: "system", target: "LISA" },
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
              target: agent.toUpperCase(),
              raw: data,
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
            payload: { thread: "team", participant: agent.toUpperCase(), source: "system", target: agent.toUpperCase() },
          },
        });
      }
    };

    const targets: string[] = [];

    if (senderNorm === "SMS") {
      if (!isMarge && !isLisa && !isMaggie && !isTeam && !isHomer) targets.push("homer");
      if (isHomer) targets.push("homer");
      if (isMarge) targets.push("marge");
      if (isLisa) targets.push("lisa");
    } else if (["HOMER","MARGE","LISA"].includes(senderNorm)) {
      if (isTeam) {
        targets.push("homer","marge","lisa");
      } else {
        if (isHomer) targets.push("homer");
        if (isMarge) targets.push("marge");
        if (isLisa) targets.push("lisa");
      }
      const self = senderNorm.toLowerCase();
      const unique = Array.from(new Set(targets)).filter(t => t !== self);
      targets.length = 0; targets.push(...unique);
    }

    const targetValue = targets.length ? (isTeam ? "TEAM" : targets[0]?.toUpperCase()) : null;

    // 2. Write sender message to Neon (with target)
    const userEvent = await prisma.event.create({
      data: {
        scope: "SYSTEM" as any,
        type: "THREAD_MESSAGE",
        level: "INFO",
        message: message,
        payload: {
          thread: "team",
          participant: senderNorm,
          source: senderNorm === "SMS" ? "user" : "relay",
          target: targetValue,
        },
      },
    });

    if (targets.includes("homer")) responses.push(await callRelay("homer"));
    if (targets.includes("marge")) responses.push(await callRelay("marge"));
    if (targets.includes("lisa")) responses.push(await callRelay("lisa"));

    // Agent-to-agent relay
    for (const r of [...responses]) {
      const txt = r?.message || "";
      const match = txt.match(/@(homer|marge|lisa)/i);
      if (match) {
        const target = match[1].toLowerCase();
        const alreadyCalled = targets.includes(target);
        if (!alreadyCalled) {
          try {
            responses.push(await callRelay(target));
          } catch(e) {}
        }
      }
    }

    if (isMaggie && senderNorm === "SMS") {
      const maggieText = "Maggie is analyzing the thread... [Summary: Team coordination in progress. Suggesting a structured Debate if disagreement persists.]";
      responses.push(await prisma.event.create({
        data: {
          scope: "SYSTEM" as any,
          type: "THREAD_MESSAGE",
          level: "INFO",
          message: maggieText,
          payload: { thread: "team", participant: "MAGGIE", source: "relay", target: "MAGGIE" },
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

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
