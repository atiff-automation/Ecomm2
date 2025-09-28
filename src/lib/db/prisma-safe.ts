/**
 * Safe Prisma Client - Railway Deployment Ready
 * Handles missing DATABASE_URL gracefully during build
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  // During build time, DATABASE_URL might not be available
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ DATABASE_URL not found in production - this might cause issues');
    }
    return null;
  }

  if (!prisma) {
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error);
      return null;
    }
  }

  return prisma;
}

// Safe database operations with fallbacks
export async function safeDbQuery<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> {
  const client = getPrismaClient();

  if (!client) {
    console.warn('Database not available, using fallback value');
    return fallback;
  }

  try {
    return await operation(client);
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback;
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Export singleton for backwards compatibility
export const db = getPrismaClient();
export default db;