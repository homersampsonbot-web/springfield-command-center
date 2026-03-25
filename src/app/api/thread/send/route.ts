import { buildContextPack } from "@/lib/maggie/contextPackager";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { classifyMaggie } from "@/lib/maggie";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json();
    const { thread, message, sender } = body;

    const requestId = uuidv4();
    const msgLower = (message || "").toLowerCase();
    const senderNorm = (sender || "SMS").toUpperCase();

    const failureSignals = {
      anchorNotFound:
        msgLower.includes("find string not found") ||
        msgLower.includes("anchor not found"),
      commandBlocked:
        msgLower.includes("command not allowed"),
      maxRetries:
        msgLower.includes("max retries exceeded") ||
        msgLower.includes("task failed after 3 attempts")
    };

    const detectedFailureType =
      failureSignals.anchorNotFound ? "anchor_not_found" :
      failureSignals.commandBlocked ? "command_blocked" :
      failureSignals.maxRetries ? "max_retries" :
      null;

    // 1. Routing & Async Detection (default)
    const asyncKeywords = ["architecture", "review", "plan", "migration", "explain", "design", "assess", "analyse"];
    const matchedKeyword = asyncKeywords.find(k => msgLower.includes(k));
    let isAsyncTrigger = !!matchedKeyword || msgLower.includes("force_async");

    const tag = (t: string) => msgLower.includes(t);
    const isMaggieTag = tag("@maggie");
    const isTeamTag = tag("@team");
    const isMargeTag = tag("@marge") || isTeamTag;
    const isLisaTag = tag("@lisa") || isTeamTag;
    const isHomerTag = tag("@homer") || isTeamTag;

    const isMargeRuleCommand = msgLower.includes("@marge rule:");
    const isMargeApproveCommand = msgLower.includes("@marge approve:");
    const isMargeReviewCommand = msgLower.includes("@marge review:");
    const isMargeGovernCommand = msgLower.includes("@marge govern:");
    const isMargeCommand =
      isMargeRuleCommand ||
      isMargeApproveCommand ||
      isMargeReviewCommand ||
      isMargeGovernCommand;

    if (isMargeCommand) {
      isAsyncTrigger = true;
    }

    // Maggie Auto-Classification + Routing (No @mention, SMS sender)
    const mentions = ["@marge", "@lisa", "@homer", "@bart", "@maggie", "@team"];
    const hasMention = mentions.some(m => msgLower.includes(m));

    // Determine Base URL dynamically from request
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    const targets: string[] = [];

    if (senderNorm === "SMS" && !hasMention && thread === "team") {
      const { envelope, isFallback } = await classifyMaggie(message);

      // Routing decision based on envelope
      const route: string[] = [];
      const needsArchitecture = envelope.needsArchitecture === "yes";
      const needsExecution = envelope.needsExecution === "yes";
      const suggestedAgents = envelope.suggestedAgents || [];

      if (isFallback || envelope.confidence === "low") {
        route.push("HOMER");
      } else if (needsArchitecture) {
        route.push("MARGE");
        if (suggestedAgents.includes("LISA")) route.push("LISA");
      } else if (needsExecution && !needsArchitecture) {
        route.push("HOMER");
      } else if (suggestedAgents.length === 1 && suggestedAgents[0] === "LISA") {
        route.push("LISA");
      } else {
        route.push("HOMER");
      }

      // Maggie routing message
      const routingMessage = isFallback
        ? "[MAGGIE] Classification timed out. Defaulting to Homer for initial handling."
        : `[MAGGIE] Classified as: ${envelope.type} Routing to: ${route.join(", ")} Debate: ${envelope.needsDebate} Async relay: ${envelope.asyncRelay}`;

      await prisma.event.create({
        data: {
          scope: "SYSTEM",
          type: "THREAD_MESSAGE",
          level: "INFO",
          message: routingMessage,
          payload: { thread: "team", participant: "MAGGIE", source: "relay" }
        }
      });

      // Persist routing event
      await prisma.event.create({
        data: {
          scope: "SYSTEM",
          type: "THREAD_ROUTING",
          level: "INFO",
          message: `Maggie routed to ${route.join(", ")}`,
          payload: {
            thread: "team",
            sender: "SMS",
            route,
            asyncRelay: envelope.asyncRelay,
            reason: {
              needsArchitecture: envelope.needsArchitecture,
              needsExecution: envelope.needsExecution,
              confidence: envelope.confidence
            }
          }
        }
      });

      // Route execution order
      for (const r of route) {
        if (r === "HOMER") {
          targets.push("homer");
        } else if (r === "MARGE") {
          targets.push("marge");
        } else if (r === "LISA") {
          targets.push("lisa");
        }
      }

      // Async routing for Marge/Lisa if requested
      if (envelope.asyncRelay === "yes" && (targets.includes("marge") || targets.includes("lisa"))) {
        isAsyncTrigger = true;
      } else {
        // Homer always sync
        isAsyncTrigger = false;
      }
    } else {
      // Maggie autonomous recovery routing for Homer failure reports
      if (senderNorm === "HOMER" && detectedFailureType) {
        if (detectedFailureType === "anchor_not_found") {
          targets.push("lisa");
          isAsyncTrigger = true;
        } else if (detectedFailureType === "command_blocked") {
          targets.push("lisa");
          isAsyncTrigger = true;
        } else if (detectedFailureType === "max_retries") {
          targets.push("marge", "lisa");
          isAsyncTrigger = true;
        }

        await prisma.event.create({
          data: {
            scope: "SYSTEM",
            type: "THREAD_ROUTING",
            level: "INFO",
            message: `Maggie autonomous recovery routed ${detectedFailureType} to ${Array.from(new Set(targets)).join(", ").toUpperCase()}`,
            payload: {
              thread: "team",
              sender: senderNorm,
              failureType: detectedFailureType,
              route: Array.from(new Set(targets)),
              asyncRelay: true,
              source: "maggie_recovery_rules"
            }
          }
        });
      }

      // Tagged flow (existing behavior)
      if (senderNorm === "SMS") {
        if (!isMargeTag && !isLisaTag && !isMaggieTag && !isTeamTag && !isHomerTag) targets.push("homer");
        if (isHomerTag && !isMaggieTag) targets.push("homer");
        if (isMargeTag) targets.push("marge");
        if (isLisaTag) targets.push("lisa");
      } else if (["HOMER","MARGE","LISA"].includes(senderNorm)) {
        if (isTeamTag) {
          targets.push("homer","marge","lisa");
        } else {
          if (isHomerTag) targets.push("homer");
          if (isMargeTag) targets.push("marge");
          if (isLisaTag) targets.push("lisa");
        }
        const self = senderNorm.toLowerCase();
        const unique = Array.from(new Set(targets)).filter(t => t !== self);
        targets.length = 0; targets.push(...unique);
      }
    }

    const dedupedTargets = Array.from(new Set(targets));
    targets.length = 0;
    targets.push(...dedupedTargets);

    // DEBUG EVENT
    await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "DEBUG",
        level: "INFO",
        message: `ThreadSend Debug: isAsync=${isAsyncTrigger}, keyword=${matchedKeyword}, failureType=${detectedFailureType || "none"}, targets=${targets.join(",")}, baseUrl=${baseUrl}`,
        payload: { body, msgLower, isAsyncTrigger, matchedKeyword, detectedFailureType, targets, requestId, baseUrl }
      }
    });

    if (!message || thread !== "team") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Write sender message to Neon
    await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "THREAD_MESSAGE",
        level: "INFO",
        message: message,
        payload: {
          thread: "team",
          participant: senderNorm,
          source: senderNorm === "SMS" ? "user" : "relay",
          target: isTeamTag ? "TEAM" : (isMargeTag ? "MARGE" : isLisaTag ? "LISA" : isHomerTag ? "HOMER" : null),
        },
      },
    });

    const triggerAsyncRelay = async (agent: string) => {
      const placeholder = await prisma.event.create({
        data: {
          scope: "SYSTEM",
          type: "THREAD_MESSAGE",
          level: "INFO",
          message: `[${agent.toUpperCase()}] Thinking...`,
          payload: {
            thread: "team",
            participant: agent.toUpperCase(),
            source: "system",
            status: "PENDING",
            requestId: requestId
          }
        }
      });

      const job = await prisma.job.create({
        data: {
          title: `RELAY_REQUEST:${requestId}`,
          description: `Async relay for ${agent.toUpperCase()}: ${message.slice(0, 100)}...`,
          owner: agent.toUpperCase() as any,
          status: "QUEUED",
          risk: "LOW"
        }
      });

      await prisma.event.create({
        data: {
          jobId: job.id,
          scope: "JOB",
          type: "RELAY_METADATA",
          level: "INFO",
          message: `Metadata for requestId ${requestId}`,
          payload: {
            requestId,
            thread: "team",
            targetAgent: agent.toUpperCase(),
            message: message,
            sender: senderNorm,
            placeholderEventId: placeholder.id
          }
        }
      });
      
      return placeholder;
    };

    const callRelaySync = async (agent: string) => {
      try {
        let enhancedMessage = message;
        if (agent === "marge") {
          if (isMargeCommand) {
            enhancedMessage = `[MARGE COMMAND CHANNEL] ${message}`;
          } else {
            enhancedMessage = `[TEAM THREAD - be concise, max 3 sentences] ${message}`;
          }
        } else if (agent === "lisa") {
          enhancedMessage = `[TEAM THREAD - be concise, max 3 sentences] ${message}`;
        }
        
        const res = await fetch(`${baseUrl}/api/relay/${agent}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" 
          },
          body: JSON.stringify({ message: enhancedMessage }),
          signal: AbortSignal.timeout(55000),
        });
        
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); } catch (e) { data = { error: "Non-JSON", preview: raw.slice(0, 200) }; }

        let text = data.response || data.reply || data.message || data.error || JSON.stringify(data);
        return await prisma.event.create({
          data: {
            scope: "SYSTEM",
            type: "THREAD_MESSAGE",
            level: (data.error) ? "ERROR" : "INFO",
            message: text,
            payload: {
              thread: "team",
              participant: agent.toUpperCase(),
              source: "relay",
              target: agent.toUpperCase(),
              raw: data,
            },
          },
        });
      } catch (e: any) {
        return await prisma.event.create({
          data: {
            scope: "SYSTEM",
            type: "THREAD_MESSAGE",
            level: "ERROR",
            message: `Relay error (${agent}): ${e.message}`,
            payload: { thread: "team", participant: agent.toUpperCase(), source: "system" },
          },
        });
      }
    };

    const responses = [] as any[];

    for (const agent of targets) {
      if (isAsyncTrigger && (agent === "marge" || agent === "lisa")) {
        responses.push(await triggerAsyncRelay(agent));
      } else {
        responses.push(await callRelaySync(agent));
      }
    }


    if (isMaggieTag && senderNorm === "SMS") {
      try {
        const context = await buildContextPack(requestId);

          await prisma.event.create({
            data: {
              scope: "SYSTEM",
              type: "THREAD_MESSAGE",
              level: "INFO",
              message: context.brief,
              payload: {
                thread: "team",
                participant: "MAGGIE",
                source: "orchestrator",
                requestId
              },
            },
          });

          if (context.brief.includes("Approval state: APPROVED")) {
            const homerRes = await fetch(`${baseUrl}/api/relay/homer`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-springfield-key": process.env.SPRINGFIELD_KEY || ""
              },
              body: JSON.stringify({
                message: `[MAGGIE->HOMER] Approved brief ${requestId}. Execute next steps.`,
                requestId,
                source: "MAGGIE"
              })
            });

            const homerRaw = await homerRes.text();
            let homerData: any;
            try {
              homerData = JSON.parse(homerRaw);
            } catch {
              homerData = { error: "Non-JSON", raw: homerRaw };
            }

            const homerText =
              homerData.reply ||
              homerData.response ||
              homerData.message ||
              homerData.error ||
              JSON.stringify(homerData);

            await prisma.event.create({
              data: {
                scope: "SYSTEM",
                type: "THREAD_MESSAGE",
                level: homerData.error ? "ERROR" : "INFO",
                message: homerText,
                payload: {
                  thread: "team",
                  participant: "HOMER",
                  source: "relay",
                  target: "HOMER",
                  requestId,
                  routedBy: "MAGGIE",
                  raw: homerData
                }
              }
            });
          }

      } catch (err: any) {
        await prisma.event.create({
          data: {
            scope: "SYSTEM",
            type: "THREAD_MESSAGE",
            level: "ERROR",
            message: `[MAGGIE] Context packaging failed: ${err.message}`,
            payload: {
              thread: "team",
              participant: "MAGGIE",
              source: "orchestrator",
              requestId
            },
          },
        });
      }
    }


    return NextResponse.json({ success: true, requestId: isAsyncTrigger ? requestId : null });
  } catch (e: any) {
    console.error(`[ThreadSend] Error: ${e.message}`);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
