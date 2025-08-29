/**
 * Cache Initialization - Malaysian E-commerce Platform
 * Initialize and configure caching system on application startup
 */

import { redisClient } from './redis-client';
import { cacheManager } from './cache-manager';
import { CacheWarmer } from './cache-decorators';

export interface CacheInitOptions {
  enableRedis?: boolean;
  enableWarmup?: boolean;
  warmupTasks?: string[];
  healthCheck?: boolean;
}

/**
 * Initialize cache system
 */
export async function initializeCache(options: CacheInitOptions = {}): Promise<{
  success: boolean;
  redis: boolean;
  memory: boolean;
  errors: string[];
}> {
  const results = {
    success: false,
    redis: false,
    memory: false,
    errors: [] as string[],
  };

  console.log('🚀 Initializing cache system...');

  // Initialize Redis if enabled
  if (options.enableRedis !== false) {
    try {
      await redisClient.connect();

      if (options.healthCheck !== false) {
        const health = await redisClient.healthCheck();
        if (health.status === 'healthy') {
          results.redis = true;
          console.log(
            `✅ Redis connected successfully (${health.latency}ms latency)`
          );
        } else {
          results.errors.push(`Redis health check failed: ${health.error}`);
        }
      } else {
        results.redis = true;
        console.log('✅ Redis connection established');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Redis error';
      results.errors.push(`Redis initialization failed: ${errorMessage}`);
      console.warn(
        '⚠️ Redis initialization failed, using memory cache fallback'
      );
    }
  }

  // Memory cache is always available
  results.memory = true;
  console.log('✅ Memory cache initialized');

  // Warm up cache if enabled
  if (options.enableWarmup !== false) {
    try {
      await CacheWarmer.warmUp(options.warmupTasks);
      console.log('🔥 Cache warming completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Cache warming failed';
      results.errors.push(`Cache warming failed: ${errorMessage}`);
      console.warn('⚠️ Cache warming partially failed');
    }
  }

  // Overall success if at least memory cache is working
  results.success = results.memory;

  if (results.success) {
    console.log('✅ Cache system initialized successfully');
  } else {
    console.error('❌ Cache system initialization failed');
  }

  return results;
}

/**
 * Graceful cache shutdown
 */
export async function shutdownCache(): Promise<void> {
  console.log('🔄 Shutting down cache system...');

  try {
    await cacheManager.destroy();
    console.log('✅ Cache system shutdown completed');
  } catch (error) {
    console.error('❌ Error during cache shutdown:', error);
  }
}

/**
 * Cache health check middleware
 */
export function createCacheHealthCheck() {
  return async (req: any, res: any, next: any) => {
    try {
      const health = await cacheManager.healthCheck();

      // Add cache health to request context
      req.cacheHealth = health;

      // Log slow cache operations
      if (
        health.redis.status === 'healthy' &&
        health.redis.latency &&
        health.redis.latency > 100
      ) {
        console.warn(
          `⚠️ Slow cache operation detected: ${health.redis.latency}ms`
        );
      }

      next();
    } catch (error) {
      console.error('Cache health check failed:', error);
      // Don't block the request, just log the error
      req.cacheHealth = {
        redis: { status: 'unhealthy', error: 'Health check failed' },
        memory: { status: 'unknown', size: 0 },
      };
      next();
    }
  };
}

/**
 * Cache statistics endpoint helper
 */
export async function getCacheStatistics() {
  try {
    const stats = await cacheManager.getStats();
    const health = await cacheManager.healthCheck();

    return {
      timestamp: new Date().toISOString(),
      health,
      stats,
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
    };
  } catch (error) {
    console.error('Failed to get cache statistics:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
    };
  }
}

/**
 * Cache warming scheduler
 */
export class CacheWarmingScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  /**
   * Start scheduled cache warming
   */
  start(
    schedules: Array<{
      name: string;
      task: string[];
      interval: number; // milliseconds
    }>
  ): void {
    if (this.isRunning) {
      console.warn('Cache warming scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🕐 Starting cache warming scheduler...');

    schedules.forEach(schedule => {
      const interval = setInterval(async () => {
        try {
          console.log(`🔥 Running scheduled cache warming: ${schedule.name}`);
          await CacheWarmer.warmUp(schedule.task);
          console.log(`✅ Completed scheduled cache warming: ${schedule.name}`);
        } catch (error) {
          console.error(
            `❌ Scheduled cache warming failed: ${schedule.name}`,
            error
          );
        }
      }, schedule.interval);

      this.intervals.set(schedule.name, interval);
    });

    console.log(
      `✅ Cache warming scheduler started with ${schedules.length} tasks`
    );
  }

  /**
   * Stop scheduled cache warming
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping cache warming scheduler...');

    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`✅ Stopped cache warming task: ${name}`);
    });

    this.intervals.clear();
    this.isRunning = false;

    console.log('✅ Cache warming scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.intervals.keys()),
      taskCount: this.intervals.size,
    };
  }
}

/**
 * Default cache warming schedules
 */
export const DEFAULT_WARMING_SCHEDULES = [
  {
    name: 'featured-products',
    task: ['featured-products'],
    interval: 30 * 60 * 1000, // Every 30 minutes
  },
  {
    name: 'top-selling',
    task: ['top-selling-products'],
    interval: 60 * 60 * 1000, // Every hour
  },
  {
    name: 'categories',
    task: ['product-categories'],
    interval: 2 * 60 * 60 * 1000, // Every 2 hours
  },
];

// Export singleton scheduler
export const cacheWarmingScheduler = new CacheWarmingScheduler();
