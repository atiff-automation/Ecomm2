/**
 * Base Cache Service - Foundation for all caching operations
 * Following CLAUDE.md: NO hardcoding, systematic approach, centralized
 *
 * Implements production-ready Redis caching with graceful fallback to in-memory
 * Provides monitoring, health checks, and configuration management
 */

// Server-only Redis import
let Redis: any;
if (typeof window === 'undefined') {
  try {
    Redis = require('ioredis');
  } catch (error) {
    console.warn('Redis not available, using fallback cache');
  }
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxKeys: number; // Maximum keys to store
  keyPrefix: string; // Cache key prefix for namespacing
  redisUrl?: string; // Redis connection URL
  enableCompression?: boolean; // Enable gzip compression for large values
  maxValueSize?: number; // Maximum value size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: string;
  totalKeys: number;
  memoryUsage: string;
  connectionStatus: 'connected' | 'disconnected' | 'fallback';
  uptime: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  fallbackActive: boolean;
  memoryPressure?: number;
}

/**
 * Abstract Base Cache Service
 * Following CLAUDE.md: Centralized approach, systematic implementation
 */
export abstract class BaseCacheService {
  protected redis: any;
  protected config: CacheConfig;
  protected isRedisAvailable: boolean = false;
  protected fallbackCache: Map<string, { data: any; expires: number }> =
    new Map();
  protected stats = { hits: 0, misses: 0, startTime: Date.now() };

  // Default configuration following production best practices
  protected readonly DEFAULT_CONFIG: Partial<CacheConfig> = {
    ttl: 3600, // 1 hour default
    maxKeys: 1000, // Reasonable default for memory management
    enableCompression: false, // Disabled by default for performance
    maxValueSize: 1024 * 1024, // 1MB max value size
  };

  constructor(config: Partial<CacheConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config } as CacheConfig;
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with graceful fallback
   * Following plan: Production-ready connection handling
   */
  private initializeRedis(): void {
    if (typeof window !== 'undefined' || !Redis) {
      this.isRedisAvailable = false;
      console.log(
        `🔄 ${this.config.keyPrefix} cache: Using in-memory fallback`
      );
      return;
    }

    try {
      // Use centralized Redis configuration following @CLAUDE.md
      const {
        getRedisConfig,
        validateRedisConfig,
      } = require('../config/redis.config');
      const redisConfig = getRedisConfig();

      // Validate configuration before connection
      const validation = validateRedisConfig(redisConfig);
      if (!validation.valid) {
        console.warn(
          `⚠️ ${this.config.keyPrefix} cache: Configuration issues detected`
        );
        validation.errors.forEach(error => console.warn(`   - ${error}`));
      }

      this.redis = new Redis(redisConfig);

      // Connection event handlers
      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        console.log(`✅ ${this.config.keyPrefix} cache: Redis connected`);
      });

      this.redis.on('error', (error: Error) => {
        this.isRedisAvailable = false;
        if (!error.message.includes('ECONNREFUSED')) {
          console.error(
            `❌ ${this.config.keyPrefix} cache Redis error:`,
            error.message
          );
        }
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
        console.log(
          `⚠️ ${this.config.keyPrefix} cache: Redis disconnected, using fallback`
        );
      });

      this.redis.on('reconnecting', () => {
        console.log(`🔄 ${this.config.keyPrefix} cache: Redis reconnecting...`);
      });

      // Test initial connection
      this.testConnection();
    } catch (error) {
      this.isRedisAvailable = false;
      console.log(
        `⚠️ ${this.config.keyPrefix} cache: Redis initialization failed, using fallback`
      );
    }
  }

  /**
   * Test Redis connection health
   */
  private async testConnection(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      this.isRedisAvailable = false;
      console.log(
        `⚠️ ${this.config.keyPrefix} cache: Connection test failed, using fallback`
      );
    }
  }

  /**
   * Build systematic cache key with prefix
   * Following CLAUDE.md: NO hardcoding, systematic approach
   */
  protected buildCacheKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  /**
   * Get value from cache with fallback support
   */
  protected async getCacheValue<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key);

      // Try Redis first
      if (this.isRedisAvailable && this.redis) {
        try {
          const value = await this.redis.get(cacheKey);
          if (value) {
            await this.recordHit();
            return this.deserializeValue<T>(value);
          }
        } catch (error) {
          // Redis failed, fall through to fallback cache
          this.isRedisAvailable = false;
        }
      }

      // Check fallback cache
      const fallbackItem = this.fallbackCache.get(key);
      if (fallbackItem && fallbackItem.expires > Date.now()) {
        await this.recordHit();
        return fallbackItem.data as T;
      } else if (fallbackItem) {
        // Remove expired entry
        this.fallbackCache.delete(key);
      }

      await this.recordMiss();
      return null;
    } catch (error) {
      console.error(`${this.config.keyPrefix} cache get error:`, error);
      await this.recordMiss();
      return null;
    }
  }

  /**
   * Set value in cache with fallback support
   */
  protected async setCacheValue<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const cacheTtl = ttl || this.config.ttl;
      const serialized = this.serializeValue(value);

      // Validate value size
      if (
        this.config.maxValueSize &&
        serialized.length > this.config.maxValueSize
      ) {
        console.warn(
          `${this.config.keyPrefix} cache: Value too large for key ${key}`
        );
        return;
      }

      // Try Redis first
      if (this.isRedisAvailable && this.redis) {
        try {
          await this.redis.setex(cacheKey, cacheTtl, serialized);
          await this.manageCacheSize();
          return;
        } catch (error) {
          this.isRedisAvailable = false;
          console.warn(
            `${this.config.keyPrefix} cache: Redis set failed, using fallback`
          );
        }
      }

      // Use fallback cache
      const expires = Date.now() + cacheTtl * 1000;
      this.fallbackCache.set(key, { data: value, expires });
      this.manageFallbackCacheSize();
    } catch (error) {
      console.error(`${this.config.keyPrefix} cache set error:`, error);
    }
  }

  /**
   * Batch set multiple values
   */
  protected async setBatchValues<T>(
    items: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      const cacheTtl = this.config.ttl;

      if (this.isRedisAvailable && this.redis) {
        try {
          const pipeline = this.redis.pipeline();

          for (const item of items) {
            const cacheKey = this.buildCacheKey(item.key);
            const serialized = this.serializeValue(item.value);
            const ttl = item.ttl || cacheTtl;

            pipeline.setex(cacheKey, ttl, serialized);
          }

          await pipeline.exec();
          await this.manageCacheSize();
          return;
        } catch (error) {
          this.isRedisAvailable = false;
          console.warn(
            `${this.config.keyPrefix} cache: Batch Redis set failed, using fallback`
          );
        }
      }

      // Use fallback cache for batch
      for (const item of items) {
        const expires = Date.now() + (item.ttl || cacheTtl) * 1000;
        this.fallbackCache.set(item.key, { data: item.value, expires });
      }

      this.manageFallbackCacheSize();
    } catch (error) {
      console.error(`${this.config.keyPrefix} cache batch set error:`, error);
    }
  }

  /**
   * Invalidate cache entries
   */
  protected async invalidateCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Invalidate specific pattern
        if (this.isRedisAvailable && this.redis) {
          const searchPattern = this.buildCacheKey(pattern);
          const keys = await this.redis.keys(searchPattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }

        // Also clear from fallback cache
        for (const key of this.fallbackCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.fallbackCache.delete(key);
          }
        }
      } else {
        // Clear all cache
        if (this.isRedisAvailable && this.redis) {
          const keys = await this.redis.keys(`${this.config.keyPrefix}:*`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
        this.fallbackCache.clear();
      }

      console.log(
        `🗑️ ${this.config.keyPrefix} cache: Invalidated ${pattern || 'all entries'}`
      );
    } catch (error) {
      console.error(
        `${this.config.keyPrefix} cache invalidation error:`,
        error
      );
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    try {
      const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
      const total = this.stats.hits + this.stats.misses;
      const hitRate =
        total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0%';

      let totalKeys = this.fallbackCache.size;
      let memoryUsage = 'In-memory fallback';
      let connectionStatus: 'connected' | 'disconnected' | 'fallback' =
        'fallback';

      if (this.isRedisAvailable && this.redis) {
        try {
          const keys = await this.redis.keys(`${this.config.keyPrefix}:*`);
          totalKeys = keys.length;

          const info = await this.redis.info('memory');
          const memoryMatch = info.match(/used_memory_human:([^\r\n]*)/);
          memoryUsage = memoryMatch ? memoryMatch[1] : 'Redis connected';
          connectionStatus = 'connected';
        } catch (error) {
          connectionStatus = 'disconnected';
        }
      }

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate,
        totalKeys,
        memoryUsage,
        connectionStatus,
        uptime,
      };
    } catch (error) {
      console.error(`${this.config.keyPrefix} cache stats error:`, error);
      return {
        hits: 0,
        misses: 0,
        hitRate: '0%',
        totalKeys: 0,
        memoryUsage: 'Error',
        connectionStatus: 'disconnected',
        uptime: 0,
      };
    }
  }

  /**
   * Comprehensive health check
   */
  public async healthCheck(): Promise<HealthCheckResult> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const start = Date.now();
        try {
          await this.redis.ping();
          const latency = Date.now() - start;

          // Check memory pressure
          const info = await this.redis.info('memory');
          const usedMemoryMatch = info.match(/used_memory:(\d+)/);
          const maxMemoryMatch = info.match(/maxmemory:(\d+)/);

          let memoryPressure = 0;
          if (usedMemoryMatch && maxMemoryMatch) {
            const used = parseInt(usedMemoryMatch[1]);
            const max = parseInt(maxMemoryMatch[1]);
            memoryPressure = max > 0 ? (used / max) * 100 : 0;
          }

          const status =
            latency > 1000 || memoryPressure > 90 ? 'degraded' : 'healthy';

          return {
            status,
            latency,
            fallbackActive: false,
            memoryPressure,
          };
        } catch (error) {
          return {
            status: 'unhealthy',
            error:
              error instanceof Error
                ? error.message
                : 'Redis connection failed',
            fallbackActive: true,
          };
        }
      } else {
        // Fallback cache health
        const memoryPressure =
          (this.fallbackCache.size / this.config.maxKeys) * 100;
        return {
          status: memoryPressure > 90 ? 'degraded' : 'healthy',
          fallbackActive: true,
          memoryPressure,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackActive: true,
      };
    }
  }

  /**
   * Cleanup resources
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      this.fallbackCache.clear();
      console.log(
        `👋 ${this.config.keyPrefix} cache: Disconnected and cleaned up`
      );
    } catch (error) {
      console.error(`${this.config.keyPrefix} cache disconnect error:`, error);
    }
  }

  // Private helper methods

  private serializeValue<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new Error('Failed to serialize cache value');
    }
  }

  private deserializeValue<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new Error('Failed to deserialize cache value');
    }
  }

  private async recordHit(): Promise<void> {
    this.stats.hits++;
  }

  private async recordMiss(): Promise<void> {
    this.stats.misses++;
  }

  /**
   * Manage Redis cache size to prevent memory bloat
   */
  private async manageCacheSize(): Promise<void> {
    try {
      if (!this.isRedisAvailable || !this.redis) return;

      const keys = await this.redis.keys(`${this.config.keyPrefix}:*`);

      if (keys.length > this.config.maxKeys) {
        // Remove excess keys (simple FIFO approach)
        const keysToRemove = keys.length - this.config.maxKeys;
        const sortedKeys = keys.sort();
        const oldestKeys = sortedKeys.slice(0, keysToRemove);

        if (oldestKeys.length > 0) {
          await this.redis.del(...oldestKeys);
          console.log(
            `🧹 ${this.config.keyPrefix} cache: Cleaned up ${oldestKeys.length} entries`
          );
        }
      }
    } catch (error) {
      console.error(
        `${this.config.keyPrefix} cache size management error:`,
        error
      );
    }
  }

  /**
   * Manage fallback cache size
   */
  private manageFallbackCacheSize(): void {
    if (this.fallbackCache.size > this.config.maxKeys) {
      const entries = Array.from(this.fallbackCache.entries());
      const keysToRemove = entries.length - this.config.maxKeys;

      // Sort by expiration time (oldest first)
      entries.sort((a, b) => a[1].expires - b[1].expires);

      for (let i = 0; i < keysToRemove; i++) {
        this.fallbackCache.delete(entries[i][0]);
      }

      console.log(
        `🧹 ${this.config.keyPrefix} fallback cache: Cleaned up ${keysToRemove} entries`
      );
    }
  }
}

export default BaseCacheService;
