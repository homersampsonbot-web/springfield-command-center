const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function cleanup() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days
  const deleted = await p.job.deleteMany({
    where: { status: { in: ['DONE', 'FAILED'] }, updatedAt: { lt: cutoff } }
  });
  const deletedEvents = await p.event.deleteMany({
    where: { createdAt: { lt: cutoff }, type: 'THREAD_MESSAGE' }
  });
  console.log(`[Cleanup] Deleted ${deleted.count} jobs, ${deletedEvents.count} events`);
  await p.$disconnect();
}
cleanup().catch(e => { console.error(e); process.exit(1); });
