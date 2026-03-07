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

  console.log(JSON.stringify(events, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
