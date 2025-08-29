/**
 * Redis Client - Malaysian E-commerce Platform
 * Advanced caching implementation with Redis for high performance
 */

import Redis, { RedisOptions } from 'ioredis';
import { promisify } from 'util';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache key namespace
  compress?: boolean; // Compress large values
  tags?: string[]; // Cache invalidation tags
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: string;
}

export class RedisClient {
  private static instance: RedisClient;
  private redis: Redis;
  private isConnected: boolean = false;
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 };
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    const redisConfig: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),

      // Connection settings
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,

      // Reconnection strategy
      retryStrategy: times => {
        if (times > this.maxReconnectAttempts) {
          console.error('Redis: Max reconnection attempts reached');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis: Reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },

      // Enable offline queue
      enableOfflineQueue: false,

      // Lazy connection
      lazyConnect: true,
    };

    this.redis = new Redis(redisConfig);
    this.setupEventHandlers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('✅ Redis: Connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis: Ready to accept commands');
    });

    this.redis.on('error', error => {
      console.error('❌ Redis: Connection error:', error.message);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis: Connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', ms => {
      this.reconnectAttempts++;
      console.log(
        `🔄 Redis: Reconnecting in ${ms}ms (attempt ${this.reconnectAttempts})`
      );
    });

    this.redis.on('end', () => {
      console.log('🛑 Redis: Connection ended');
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis (lazy connection)
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.redis.connect();
      console.log('✅ Redis: Manual connection established');
    } catch (error) {
      console.error('❌ Redis: Manual connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('👋 Redis: Disconnected gracefully');
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace?: string): string {
    const appPrefix = process.env.REDIS_KEY_PREFIX || 'jrm-ecommerce';
    const ns = namespace || 'default';
    return `${appPrefix}:${ns}:${key}`;
  }

  /**
   * Set cache value with options
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const cacheKey = this.generateKey(key, options.namespace);
      let serializedValue: string;

      // Serialize value
      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      // Compress if requested and value is large
      if (options.compress && serializedValue.length > 1024) {
        const zlib = await import('zlib');
        const compressed = zlib.gzipSync(serializedValue);
        serializedValue = compressed.toString('base64');
        cacheKey += ':compressed';
      }

      // Set with TTL
      const ttl =
        options.ttl || parseInt(process.env.REDIS_DEFAULT_TTL || '3600');
      await this.redis.setex(cacheKey, ttl, serializedValue);

      // Handle tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTagsForKey(cacheKey, options.tags);
      }

      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const cacheKey = this.generateKey(key, options.namespace);
      let value = await this.redis.get(cacheKey);

      if (value === null) {
        // Try compressed version
        const compressedKey = cacheKey + ':compressed';
        const compressedValue = await this.redis.get(compressedKey);

        if (compressedValue) {
          const zlib = await import('zlib');
          const decompressed = zlib.gunzipSync(
            Buffer.from(compressedValue, 'base64')
          );
          value = decompressed.toString();
        }
      }

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      // Try to parse JSON, fallback to raw string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string, namespace?: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, namespace);
      const deleted = await this.redis.del(cacheKey);

      // Also try to delete compressed version
      await this.redis.del(cacheKey + ':compressed');

      return deleted > 0;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, namespace?: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, namespace);
      const exists = await this.redis.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set cache with expiry timestamp
   */
  async setWithExpiry<T>(
    key: string,
    value: T,
    expiryTimestamp: number,
    namespace?: string
  ): Promise<boolean> {
    const ttl = Math.max(0, Math.floor((expiryTimestamp - Date.now()) / 1000));
    return this.set(key, value, { ttl, namespace });
  }

  /**
   * Get remaining TTL for key
   */
  async getTTL(key: string, namespace?: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key, namespace);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async increment(
    key: string,
    namespace?: string,
    by: number = 1
  ): Promise<number> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const cacheKey = this.generateKey(key, namespace);
      return await this.redis.incrby(cacheKey, by);
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return 0;
    }
  }

  /**
   * Add tags for cache invalidation
   */
  private async addTagsForKey(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const tag of tags) {
      const tagKey = this.generateKey(`tag:${tag}`, 'tags');
      pipeline.sadd(tagKey, key);
      pipeline.expire(tagKey, 86400); // Tags expire in 24 hours
    }

    await pipeline.exec();
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const tagKey = this.generateKey(`tag:${tag}`, 'tags');
        const keys = await this.redis.smembers(tagKey);

        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;

          // Remove the tag set itself
          await this.redis.del(tagKey);
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Redis INVALIDATE BY TAGS error:', error);
      return 0;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string, namespace?: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const searchPattern = this.generateKey(pattern, namespace);
      const keys = await this.redis.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Redis CLEAR BY PATTERN error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    let keys = 0;
    let memory = '0B';

    if (this.isConnected) {
      try {
        const info = await this.redis.info('memory');
        const keyspace = await this.redis.info('keyspace');

        // Parse memory usage
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        if (memoryMatch) {
          memory = memoryMatch[1].trim();
        }

        // Parse key count
        const keysMatch = keyspace.match(/keys=(\d+)/);
        if (keysMatch) {
          keys = parseInt(keysMatch[1]);
        }
      } catch (error) {
        console.error('Redis STATS error:', error);
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      keys,
      memory,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await this.redis.ping();
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
   * Flush all cache (use with caution)
   */
  async flushAll(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.redis.flushdb();
      console.log('🗑️ Redis: All cache cleared');
    } catch (error) {
      console.error('Redis FLUSH error:', error);
    }
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();
