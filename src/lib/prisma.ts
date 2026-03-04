import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // @ts-ignore
    adapter: undefined // We'll let Prisma 7 handle it if it can, otherwise we'll fix this
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
