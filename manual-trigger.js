const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function trigger() {
  const requestId = uuidv4();
  const agent = "MARGE";
  const message = "Test async message from script";
  
  console.log(`Creating job for requestId ${requestId}`);

  const placeholder = await prisma.event.create({
    data: {
      scope: "SYSTEM",
      type: "THREAD_MESSAGE",
      level: "INFO",
      message: `[${agent}] Thinking...`,
      payload: {
        thread: "team",
        participant: agent,
        source: "system",
        status: "PENDING",
        requestId: requestId
      }
    }
  });

  const job = await prisma.job.create({
    data: {
      title: `RELAY_REQUEST:${requestId}`,
      description: `Test job for ${agent}`,
      owner: agent,
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
        targetAgent: agent,
        message: message,
        sender: "SCRIPT",
        placeholderEventId: placeholder.id
      }
    }
  });

  console.log("Job created.");
  await prisma.$disconnect();
}

trigger();
