/**
 * Centralized Redis Configuration
 * SINGLE SOURCE OF TRUTH for all Redis operations
 * Using Upstash Redis for serverless compatibility
 */

import { Redis } from '@upstash/redis';

class RedisManager {
  private static instance: Redis | null = null;
  private static initialized: boolean = false;

  /**
   * Get singleton Redis instance
   * SINGLE SOURCE OF TRUTH for Redis client
   */
  static getInstance(): Redis {
    if (!this.instance && !this.initialized) {
      this.initialized = true;

      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        console.error('❌ Redis configuration missing');
        console.error('   Required: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN');
        throw new Error('Redis not configured - check environment variables');
      }

      this.instance = new Redis({
        url,
        token,
        automaticDeserialization: true,
      });

      console.log('✅ Redis client initialized (Upstash)');
    }

    if (!this.instance) {
      throw new Error('Redis initialization failed');
    }

    return this.instance;
  }

  /**
   * Check if Redis is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      const redis = this.getInstance();
      await redis.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get instance safely (returns null if not configured)
   */
  static getInstanceSafe(): Redis | null {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      return this.getInstance();
    } catch {
      return null;
    }
  }
}

// Export RedisManager class for conditional usage
// DO NOT export a pre-initialized instance to avoid build-time errors
export { RedisManager };
