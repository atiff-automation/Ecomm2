/**
 * Cache Initialization - Pure In-Memory Implementation
 * Initialize memory-only caching system on application startup
 * NO EXTERNAL DEPENDENCIES
 */

import { cacheManager } from './cache-manager';

export interface CacheInitOptions {
  enableWarmup?: boolean;
  warmupTasks?: string[];
}

/**
 * Initialize cache system (Memory-only)
 */
export async function initializeCache(options: CacheInitOptions = {}): Promise<{
  success: boolean;
  redis: boolean;
  memory: boolean;
  errors: string[];
}> {
  const results = {
    success: true,
    redis: false,
    memory: true,
    errors: [] as string[],
  };

  console.log('🚀 Initializing memory cache system...');
  console.log('✅ Memory cache initialized');

  // Cache warming (uses in-memory cache)
  if (options.enableWarmup) {
    console.log('🔥 Starting cache warm-up...');
    await cacheManager.warmUp();
  }

  console.log('✅ Cache system initialized successfully');
  return results;
}

/**
 * Graceful cache shutdown
 */
export async function shutdownCache(): Promise<void> {
  console.log('🔄 Shutting down cache system...');
  await cacheManager.destroy();
  console.log('✅ Cache system shutdown completed');
}

/**
 * Cache statistics
 */
export async function getCacheStatistics() {
  const stats = await cacheManager.getStats();

  return {
    timestamp: new Date().toISOString(),
    health: {
      redis: { status: 'disabled' as const },
      memory: { status: 'healthy' as const, size: stats.keys },
    },
    stats,
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
    },
  };
}

/**
 * Create cache health check endpoint
 */
export function createCacheHealthCheck() {
  return async () => {
    const health = await cacheManager.healthCheck();
    return {
      status: health.status,
      memory: {
        size: health.size,
        stats: health.stats,
      },
    };
  };
}

/**
 * Cache warming scheduler configuration
 */
export const DEFAULT_WARMING_SCHEDULES = {
  products: '0 */6 * * *', // Every 6 hours
  categories: '0 0 * * *', // Daily at midnight
  search: '*/30 * * * *', // Every 30 minutes
};

/**
 * Cache Warming Scheduler (simplified for in-memory)
 */
export class CacheWarmingScheduler {
  private intervals: NodeJS.Timeout[] = [];

  start(): void {
    console.log('🔥 Cache warming scheduler started (in-memory mode)');

    // In-memory cache is fast enough that we don't need aggressive warming
    // This is a placeholder for future enhancements
  }

  stop(): void {
    console.log('🛑 Cache warming scheduler stopped');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  async warmCache(type: string): Promise<void> {
    console.log(`🔥 Warming ${type} cache...`);
    // Placeholder for cache warming logic
    // In a real implementation, this would fetch and cache common data
  }
}

// Export singleton instance
export const cacheWarmingScheduler = new CacheWarmingScheduler();
