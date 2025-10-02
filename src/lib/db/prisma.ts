/**
 * Prisma Client Singleton with Connection Pooling
 * Ensures a single instance across the application
 * Optimized for Railway deployment with connection pool management
 */

import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line no-undef
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Parse and enhance DATABASE_URL with connection pooling parameters
 */
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;

  // Use dummy URL during build if not provided (prevents build-time errors)
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is required in production');
    }
    return 'postgresql://dummy:dummy@localhost:5432/dummy';
  }

  // For Railway Postgres - add connection pooling parameters
  try {
    const url = new URL(baseUrl);

    // Add connection pool settings for optimal performance
    // Railway free tier: ~20 total connections
    // Reserve 10 for app, 10 for migrations/admin tools
    url.searchParams.set('connection_limit', '10'); // Max 10 connections per instance
    url.searchParams.set('pool_timeout', '10'); // 10 second timeout waiting for connection
    url.searchParams.set('connect_timeout', '5'); // 5 second connect timeout

    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original (might not be URL format)
    console.warn('Failed to parse DATABASE_URL for pooling, using original');
    return baseUrl;
  }
}

/**
 * Initialize Prisma Client with optimized configuration
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'production'
      ? ['error']
      : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown - disconnect Prisma on process termination
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;
