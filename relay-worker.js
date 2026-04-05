const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

const POLLING_INTERVAL = 15000;
const AGENT_URLS = {
  MARGE: process.env.MARGE_RELAY_URL || "disabled",
  LISA: process.env.LISA_RELAY_URL || "disabled"
};

async function processRelayRequest(job) {
  console.log(`[Worker] Claiming job ${job.id} for requestId ${job.title}`);
  
  // Claim the job
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'CLAIMED' }
  });

  try {
    // 1. Fetch Metadata
    const metaEvent = await prisma.event.findFirst({
      where: {
        jobId: job.id,
        type: 'RELAY_METADATA'
      }
    });

    if (!metaEvent || !metaEvent.payload) {
      throw new Error("Missing RELAY_METADATA event or payload");
    }

    const { targetAgent, message, placeholderEventId, requestId } = metaEvent.payload;
    const url = AGENT_URLS[targetAgent];

    if (!url) {
      throw new Error(`Unsupported agent: ${targetAgent}`);
    }
    if (url === "disabled") {
      throw new Error(`Relay disabled for ${targetAgent}`);
    }

    console.log(`[Worker] Calling ${targetAgent} relay for requestId ${requestId}...`);

    // 2. Call Actual Relay
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-springfield-key": process.env.SPRINGFIELD_KEY || "c4c75fe2065fb96842e3690a3a6397fb" },
      body: JSON.stringify({ message }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      data = { error: "Relay returned non-JSON response", preview: raw.slice(0, 500) };
    }

    if (!res.ok || data.error) {
      throw new Error(data.error || `Relay returned status ${res.status}`);
    }

    const replyText = data.response || data.reply || data.message || JSON.stringify(data);

    console.log(`[Worker] Relay success for ${targetAgent}. Writing to thread...`);

    // 3. Append Full Reply Event
    await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "THREAD_MESSAGE",
        level: "INFO",
        message: replyText,
        payload: {
          thread: "team",
          participant: targetAgent,
          source: "relay",
          target: targetAgent,
          requestId,
          raw: data
        }
      }
    });

    if (
      targetAgent === 'MARGE' &&
      typeof replyText === 'string' &&
      (
      replyText.includes('MARGE RULING —') ||
      /RULING:\s*(APPROVED|APPROVED WITH CONDITIONS|REJECTED|DIRECTIVE)/i.test(replyText)
    )
    ) {
      try {
        const rulingMatch = replyText.match(/RULING:\s*(APPROVED WITH CONDITIONS|APPROVED|REJECTED|DIRECTIVE)/i);
        const rulingMap = {
          'APPROVED': 'APPROVED',
          'APPROVED WITH CONDITIONS': 'APPROVED_WITH_CONDITIONS',
          'REJECTED': 'REJECTED',
          'DIRECTIVE': 'DIRECTIVE'
        };

        const stageMatch = replyText.match(/Stage Reference:\s*([^\n]+)/i);
        const proposalMatch = replyText.match(/Proposal:\s*([^\n]+)/i);

        const ledgerPayload = {
          proposalTitle: proposalMatch ? proposalMatch[1].trim() : `Marge ruling ${requestId}`,
          proposingAgent: (metaEvent.payload.sender || 'SMS').toUpperCase(),
          ruling: rulingMatch ? rulingMap[rulingMatch[1].toUpperCase()] : 'DIRECTIVE',
          conditions: 'Auto-recorded from explicit CLI-Marge ruling via command channel.',
          summary: replyText.slice(0, 4000),
          stageReference: stageMatch ? stageMatch[1].trim() : '6B',
          sourceThreadEventId: null
        };

        await fetch('https://commander.margebot.com/api/governance/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ledgerPayload)
        });
      } catch (ledgerErr) {
        console.error('[Worker] Ledger auto-write failed:', ledgerErr.message);
      }
    }

    // 4. Update Placeholder Status
    if (placeholderEventId) {
      const placeholder = await prisma.event.findUnique({ where: { id: placeholderEventId } });
      if (placeholder && placeholder.payload) {
        await prisma.event.update({
          where: { id: placeholderEventId },
          data: {
            payload: {
              ...placeholder.payload,
              status: "COMPLETE"
            }
          }
        });
      }
    }

    // 5. Mark Job DONE
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'DONE' }
    });

    console.log(`[Worker] Job ${job.id} completed successfully.`);

  } catch (err) {
    console.error(`[Worker] Error processing job ${job.id}:`, err.message);

    // 1. Mark Job FAILED
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'FAILED', lastError: err.message }
    });

    // 2. Add Error Message to Thread
    try {
      const metaEvent = await prisma.event.findFirst({
        where: { jobId: job.id, type: 'RELAY_METADATA' }
      });
      
      if (metaEvent && metaEvent.payload) {
        const { targetAgent, placeholderEventId, requestId } = metaEvent.payload;
        
        await prisma.event.create({
          data: {
            scope: "SYSTEM",
            type: "THREAD_MESSAGE",
            level: "ERROR",
            message: `[${targetAgent}] Relay failed: ${err.message}`,
            payload: {
              thread: "team",
              participant: targetAgent,
              source: "system",
              requestId
            }
          }
        });

        if (placeholderEventId) {
          const placeholder = await prisma.event.findUnique({ where: { id: placeholderEventId } });
          if (placeholder && placeholder.payload) {
            await prisma.event.update({
              where: { id: placeholderEventId },
              data: {
                payload: {
                  ...placeholder.payload,
                  status: "FAILED"
                }
              }
            });
          }
        }
      }
    } catch (innerErr) {
      console.error(`[Worker] Failed to write error to thread:`, innerErr.message);
    }
  }
}

// Flanders dispatch polling — every 5 seconds
async function pollFlandersJobs() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'QUEUED', labels: { has: 'flanders' } },
      orderBy: { createdAt: 'asc' },
      take: 1
    });
    for (const job of jobs) {
      try {
        await prisma.job.update({ where: { id: job.id }, data: { status: 'CLAIMED' } });
        const payload = JSON.parse(job.description || '{}');
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 55000);
        const res = await fetch('https://homer.margebot.com/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-springfield-key': process.env.SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb' },
          body: JSON.stringify({ messages: payload.messages, system: payload.system }),
          signal: controller.signal
        });
        clearTimeout(tid);
        const data = await res.json();
        await prisma.job.update({
          where: { id: job.id },
          data: { status: 'DONE', description: JSON.stringify({ ...payload, response: data.response || '' }) }
        });
        console.log('[Flanders Worker] Job', job.id.slice(0,8), 'completed');
      } catch (e) {
        console.error('[Flanders Worker] Job failed:', e.message);
        await prisma.job.update({ where: { id: job.id }, data: { status: 'FAILED' } }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[Flanders Worker] Poll error:', e.message);
  }
}
setInterval(pollFlandersJobs, 5000);

async function run() {
  console.log(`[Worker] Starting Springfield Relay Worker... Polling every ${POLLING_INTERVAL/1000}s`);
  
  while (true) {
    try {
      const pendingJobs = await prisma.job.findMany({
        where: {
          title: { startsWith: 'RELAY_REQUEST:' },
          status: 'QUEUED'
        },
        orderBy: { createdAt: 'asc' }
      });

      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
      const stuckJobs = await prisma.job.findMany({
        where: {
          title: { startsWith: 'RELAY_REQUEST:' },
          status: 'CLAIMED',
          updatedAt: { lt: staleThreshold }
        }
      });

      for (const job of stuckJobs) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            lastError: 'Worker timeout: stuck in CLAIMED'
          }
        });
      }

      for (const job of pendingJobs) {
        await processRelayRequest(job);
      }

    } catch (err) {
      console.error(`[Worker] Polling error:`, err.message);
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

run();
