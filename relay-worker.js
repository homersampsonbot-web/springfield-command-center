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

    // 2. Check for job reference [JOB:id] and fetch full content from Job table
    let fullMessage = message;
    const jobRefMatch = message.match(/\[JOB:([a-f0-9-]+)\]/i);
    if (jobRefMatch) {
      try {
        const jobId = jobRefMatch[1];
        // Support both full UUIDs and short 8-char prefixes
        const job = jobId.length === 36 
          ? await prisma.job.findUnique({ where: { id: jobId }, select: { title: true, description: true, status: true, labels: true } })
          : await prisma.job.findFirst({ where: { id: { startsWith: jobId } }, select: { title: true, description: true, status: true, labels: true } });
        if (job) {
          fullMessage = message + '\n\n--- JOB CONTENT [' + jobId.slice(0,8) + '] ---\n' +
            'Title: ' + job.title + '\n' +
            'Status: ' + job.status + '\n' +
            'Labels: ' + (job.labels || []).join(', ') + '\n' +
            'Description:\n' + (job.description || '').slice(0, 3000);
          console.log('[Worker] Fetched job', jobId.slice(0,8), 'for', targetAgent, '-', (job.description||'').length, 'chars');
        }
      } catch(e) {
        console.log('[Worker] Could not fetch job reference:', e.message);
      }
    }

    // 3. Call Actual Relay
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-springfield-key": process.env.SPRINGFIELD_KEY || "c4c75fe2065fb96842e3690a3a6397fb" },
      body: JSON.stringify({ message: fullMessage }),
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

    // Auto-save long responses as artifacts
    let artifactId = null;
    const isLongResponse = replyText.length > 800;
    const isRuling = /RULING:|ARCHITECTURAL AUTHORITY|APPROVED|REJECTED/i.test(replyText);
    const isProposal = /PROPOSAL:|PART \d+\/\d+/i.test(replyText);
    
    if (isLongResponse && (isRuling || isProposal || targetAgent === 'MARGE' || targetAgent === 'LISA')) {
      try {
        const artifactType = isRuling ? 'RULING' : isProposal ? 'PROPOSAL' : 'RESPONSE';
        const titleMatch = replyText.match(/\*\*([^*]+)\*\*/);
        const artifactTitle = titleMatch ? titleMatch[1].slice(0, 100) : `${targetAgent} ${artifactType} ${new Date().toISOString().slice(0,10)}`;
        // Marge rulings are auto-approved — she has architectural authority
        // Only flag for SMS review if explicitly requires it
        const needsSmsReview = /NEEDS_SMS_APPROVAL|REQUIRES_SMS|spending|external service|new domain/i.test(replyText);
        const artifactStatus = (isRuling && targetAgent === 'MARGE') ? 'APPROVED' 
          : needsSmsReview ? 'PENDING_REVIEW' 
          : targetAgent === 'MARGE' ? 'APPROVED'
          : 'PENDING_REVIEW';
        
        const artifact = await prisma.artifact.create({
          data: {
            type: artifactType,
            title: artifactTitle,
            content: replyText,
            authorAgent: targetAgent,
            status: artifactStatus,
            threadRef: requestId
          }
        });
        artifactId = artifact.id;
        console.log(`[Worker] Saved artifact ${artifactId} (${artifactType}, ${replyText.length} chars)`);
      } catch (artifactErr) {
        console.error('[Worker] Failed to save artifact:', artifactErr.message);
      }
    }

    // Post to thread — full text if short, summary + artifact ref if long
    const threadMessage = artifactId 
      ? `${replyText.slice(0, 500)}...

[Full ${isRuling ? 'ruling' : 'response'} saved as artifact: ${artifactId}]`
      : replyText;

    // 3. Append Full Reply Event
    await prisma.event.create({
      data: {
        scope: "SYSTEM",
        type: "THREAD_MESSAGE",
        level: "INFO",
        message: threadMessage,
        payload: {
          thread: "team",
          participant: targetAgent,
          source: "relay",
          target: targetAgent,
          requestId,
          artifactId,
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

// DEPRECATED — Flanders dispatch polling removed. Flanders now in Team Chat.
// Flanders dispatch polling — every 5 seconds (DISABLED)
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
        const tid = setTimeout(() => controller.abort(), 85000);
        // Trim payload to avoid size limits
        const trimmedMessages = (payload.messages || []).slice(-8).map(m => ({
          ...m, content: typeof m.content === 'string' ? m.content.slice(0, 800) : m.content
        }));
        const trimmedSystem = (payload.system || "").slice(0, 4000);
        
        const res = await fetch('http://localhost:3014/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-springfield-key': process.env.SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb' },
          body: JSON.stringify({ 
            message: trimmedMessages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
            system: trimmedSystem
          }),
          signal: controller.signal
        });
        clearTimeout(tid);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Homer dispatch ${res.status}: ${text.slice(0, 100)}`);
        }
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
// setInterval(pollFlandersJobs, 5000) — DISABLED;

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
