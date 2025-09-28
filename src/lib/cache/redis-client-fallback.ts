/**
 * Redis Client with Memory Fallback - Railway Deployment Ready
 * Automatically uses memory cache when Redis is unavailable
 */

import { CacheOptions, CacheStats } from './redis-client';

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number; hits: number }>();
  private stats = { hits: 0, misses: 0, keys: 0 };
  private maxSize = 1000; // Prevent memory bloat

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.keys = this.cache.size;
      return null;
    }

    this.stats.hits++;
    item.hits++;
    return item.value;
  }

  async set(key: string, value: any, mode?: string, duration?: number): Promise<string> {
    // Prevent memory bloat
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      for (let i = 0; i < Math.floor(this.maxSize * 0.1); i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    const expires = duration ? Date.now() + (duration * 1000) : Date.now() + (3600 * 1000);
    this.cache.set(key, { value, expires, hits: 0 });
    this.stats.keys = this.cache.size;
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.cache.delete(key);
    this.stats.keys = this.cache.size;
    return deleted ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      if (item) this.cache.delete(key);
      return 0;
    }
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => {
      const item = this.cache.get(key);
      if (item && item.expires < Date.now()) {
        this.cache.delete(key);
        return false;
      }
      return regex.test(key);
    });
  }

  async flushall(): Promise<string> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, keys: 0 };
    return 'OK';
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      keys: this.stats.keys,
      memory: `${(this.cache.size * 100 / this.maxSize).toFixed(1)}%`
    };
  }

  // Cleanup expired entries periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (item.expires < now) {
          this.cache.delete(key);
        }
      }
      this.stats.keys = this.cache.size;
    }, 300000); // Clean every 5 minutes
  }

  // Event handling compatibility
  on(event: string, callback: Function) {
    // Memory cache doesn't need event handling
  }

  disconnect() {
    this.cache.clear();
  }
}

// Redis client wrapper with fallback
export class RedisFallbackClient {
  private static instance: RedisFallbackClient;
  private redisClient: any = null;
  private memoryCache: MemoryCache;
  private useMemory: boolean = false;
  private connectionAttempted: boolean = false;

  private constructor() {
    this.memoryCache = new MemoryCache();
    this.memoryCache.startCleanup();
    this.initializeRedis();
  }

  static getInstance(): RedisFallbackClient {
    if (!RedisFallbackClient.instance) {
      RedisFallbackClient.instance = new RedisFallbackClient();
    }
    return RedisFallbackClient.instance;
  }

  private async initializeRedis() {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    // Only try Redis if we have connection info
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (!redisUrl && !redisHost) {
      console.log('🔧 Redis: No connection info, using memory cache');
      this.useMemory = true;
      return;
    }

    try {
      // Dynamic import to avoid build issues
      const Redis = (await import('ioredis')).default;

      this.redisClient = new Redis(redisUrl || {
        host: redisHost || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });

      this.redisClient.on('error', (err: Error) => {
        console.warn('⚠️ Redis connection failed, falling back to memory cache:', err.message);
        this.useMemory = true;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.useMemory = false;
      });

      // Test connection
      await this.redisClient.ping();
      this.useMemory = false;
      console.log('✅ Redis connection established');

    } catch (error) {
      console.warn('⚠️ Redis unavailable, using memory cache:', error instanceof Error ? error.message : 'Unknown error');
      this.useMemory = true;
    }
  }

  private getClient() {
    return this.useMemory ? this.memoryCache : this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient();
      return await client.get(key);
    } catch (error) {
      console.warn('Cache get error, falling back to memory:', error);
      this.useMemory = true;
      return await this.memoryCache.get(key);
    }
  }

  async set(key: string, value: any, mode?: string, duration?: number): Promise<string> {
    try {
      const client = this.getClient();
      if (mode === 'EX' && duration) {
        return await client.set(key, value, 'EX', duration);
      }
      return await client.set(key, value);
    } catch (error) {
      console.warn('Cache set error, falling back to memory:', error);
      this.useMemory = true;
      return await this.memoryCache.set(key, value, mode, duration);
    }
  }

  async del(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.del(key);
    } catch (error) {
      this.useMemory = true;
      return await this.memoryCache.del(key);
    }
  }

  async exists(key: string): Promise<number> {
    try {
      const client = this.getClient();
      return await client.exists(key);
    } catch (error) {
      this.useMemory = true;
      return await this.memoryCache.exists(key);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      this.useMemory = true;
      return await this.memoryCache.keys(pattern);
    }
  }

  async flushall(): Promise<string> {
    try {
      const client = this.getClient();
      return await client.flushall();
    } catch (error) {
      this.useMemory = true;
      return await this.memoryCache.flushall();
    }
  }

  getStats(): CacheStats & { mode: string } {
    const baseStats = this.useMemory
      ? this.memoryCache.getStats()
      : { hits: 0, misses: 0, hitRate: 0, keys: 0, memory: 'N/A' };

    return {
      ...baseStats,
      mode: this.useMemory ? 'memory' : 'redis'
    };
  }

  disconnect() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
    this.memoryCache.disconnect();
  }
}

// Export singleton instance
export const redisClient = RedisFallbackClient.getInstance();
export default redisClient;