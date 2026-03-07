const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({
    where: {
      type: 'THREAD_MESSAGE',
      payload: { path: ['participant'], equals: 'MARGE' }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  events.forEach(e => {
    console.log(`ID: ${e.id}, Length: ${e.message.length}, CreatedAt: ${e.createdAt}`);
    console.log(`Preview: ${e.message.substring(0, 50)}...`);
    console.log(`End: ...${e.message.substring(e.message.length - 50)}`);
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
