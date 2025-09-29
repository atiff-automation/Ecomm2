import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line no-undef
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use a dummy DATABASE_URL during build if not provided
// This prevents build-time errors while allowing Next.js to compile
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
