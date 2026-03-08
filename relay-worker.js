const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

const POLLING_INTERVAL = 15000;
const AGENT_URLS = {
  MARGE: "http://18.190.203.220:3003/relay",
  LISA: "http://18.190.203.220:3004/relay"
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

    console.log(`[Worker] Calling ${targetAgent} relay for requestId ${requestId}...`);

    // 2. Call Actual Relay
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      timeout: 120000 // 2 minute timeout for long responses
    });

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
