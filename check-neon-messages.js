const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    where: {
      type: 'THREAD_MESSAGE',
      payload: { path: ['thread'], equals: 'team' }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("LAST 5 TEAM MESSAGES:");
  events.forEach(e => {
    console.log(`ID: ${e.id}, Sender: ${e.payload?.participant}, MsgLen: ${e.message?.length}`);
    console.log(`Type of message: ${typeof e.message}`);
    console.log(`Preview: ${e.message?.substring(0, 30)}...`);
    console.log('---');
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
