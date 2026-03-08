const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("--- LATEST JOBS ---");
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(jobs, null, 2));
  
  console.log("\n--- LATEST DEBUG EVENTS ---");
  const debugs = await prisma.event.findMany({
    where: { type: 'DEBUG' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(debugs, null, 2));

  console.log("\n--- LATEST THREAD MESSAGES ---");
  const events = await prisma.event.findMany({
    where: { type: 'THREAD_MESSAGE' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(events, null, 2));
  
  await prisma.$disconnect();
}

check();
