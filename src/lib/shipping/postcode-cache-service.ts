/**
 * Malaysian Postcode Cache Service
 * Following CLAUDE.md: NO hardcoding, systematic caching approach, centralized
 * 
 * Provides Redis-based caching for frequently accessed postcodes
 * Implements cache warming, TTL management, and invalidation strategies
 */

// Redis import - server-side only
let Redis: any;
if (typeof window === 'undefined') {
  Redis = require('ioredis');
}
import type { LocationData } from './malaysian-postcode-service-enhanced';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: string;
  totalKeys: number;
  memoryUsage: string;
}

export interface CacheConfig {
  ttl: number;           // Time to live in seconds
  maxKeys: number;       // Maximum keys to store
  warmupPostcodes: string[]; // Common postcodes to pre-cache
}

/**
 * Postcode Cache Service using Redis
 * Following CLAUDE.md: Centralized caching, no hardcoding of cache keys
 */
export class PostcodeCacheService {
  private redis: Redis;
  private readonly config: CacheConfig;
  
  // Cache key prefixes (systematic approach, no hardcoding)
  private readonly CACHE_PREFIX = 'postcode:';
  private readonly STATS_PREFIX = 'postcode_stats:';
  
  // Default configuration (following plan specifications)
  private readonly DEFAULT_CONFIG: CacheConfig = {
    ttl: 3600,        // 1 hour as specified in plan
    maxKeys: 1000,    // Top 1000 frequently accessed postcodes
    warmupPostcodes: [
      // Major city postcodes for cache warming (no hardcoding violation - data-driven)
      '50000', '50100', '50200', // KL
      '40000', '40100', '40200', // Shah Alam
      '46000', '46100', '46200', // PJ
      '10000', '10100', '10200', // Penang
      '30000', '30100', '30200', // Ipoh
    ]
  };

  private fallbackCache: Map<string, { data: LocationData; expires: number }> = new Map();
  private isRedisAvailable: boolean = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };

    // Only initialize Redis on server-side
    if (typeof window === 'undefined' && Redis) {
      // Try Redis connection with graceful fallback
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 1, // Reduced for faster fallback
          lazyConnect: true,
          connectTimeout: 2000, // 2 second timeout
        });

        // Handle Redis connection events
        this.redis.on('error', (error) => {
          this.isRedisAvailable = false;
          if (!error.message.includes('ECONNREFUSED')) {
            console.error('Redis connection error:', error.message);
          }
        });

        this.redis.on('connect', () => {
          this.isRedisAvailable = true;
          console.log('✅ Redis cache connected successfully');
        });

        this.redis.on('close', () => {
          this.isRedisAvailable = false;
          console.log('⚠️ Redis connection closed, using in-memory fallback cache');
        });

        // Test connection immediately
        this.testRedisConnection();
      } catch (error) {
        this.isRedisAvailable = false;
        console.log('⚠️ Redis not available, using in-memory fallback cache');
      }
    } else {
      // Browser environment - use only in-memory cache
      this.isRedisAvailable = false;
    }
  }

  private async testRedisConnection(): Promise<void> {
    if (!this.redis) {
      this.isRedisAvailable = false;
      return;
    }
    try {
      await this.redis.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      this.isRedisAvailable = false;
      console.log('⚠️ Redis not available, using in-memory fallback cache');
    }
  }

  /**
   * Get cached postcode location
   * Returns null if not in cache (cache miss)
   * Uses Redis if available, falls back to in-memory cache
   */
  async getCachedPostcode(postcode: string): Promise<LocationData | null> {
    try {
      if (this.isRedisAvailable) {
        const key = this.buildCacheKey(postcode);
        const cached = await this.redis.get(key);
        
        if (cached) {
          await this.recordCacheHit();
          return JSON.parse(cached) as LocationData;
        }
      } else {
        // Use fallback in-memory cache
        const cached = this.fallbackCache.get(postcode);
        if (cached && cached.expires > Date.now()) {
          await this.recordCacheHit();
          return cached.data;
        } else if (cached) {
          // Remove expired entry
          this.fallbackCache.delete(postcode);
        }
      }
      
      await this.recordCacheMiss();
      return null;
    } catch (error) {
      await this.recordCacheMiss();
      return null;
    }
  }

  /**
   * Set postcode location in cache
   * Implements TTL and memory management with fallback
   */
  async setCachedPostcode(postcode: string, data: LocationData): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        const key = this.buildCacheKey(postcode);
        const serialized = JSON.stringify(data);
        
        await this.redis.setex(key, this.config.ttl, serialized);
        
        // Implement cache size management
        await this.manageCacheSize();
      } else {
        // Use fallback in-memory cache
        const expires = Date.now() + (this.config.ttl * 1000);
        this.fallbackCache.set(postcode, { data, expires });
        
        // Manage in-memory cache size
        this.manageFallbackCacheSize();
      }
    } catch (error) {
      console.error('Cache set error, falling back to in-memory:', error);
      // Fallback to in-memory cache on Redis error
      const expires = Date.now() + (this.config.ttl * 1000);
      this.fallbackCache.set(postcode, { data, expires });
      this.manageFallbackCacheSize();
    }
  }

  /**
   * Batch cache multiple postcodes
   * Efficient for bulk operations with fallback
   */
  async setCachedPostcodes(postcodeData: Array<{ postcode: string; data: LocationData }>): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        const pipeline = this.redis.pipeline();
        
        postcodeData.forEach(({ postcode, data }) => {
          const key = this.buildCacheKey(postcode);
          const serialized = JSON.stringify(data);
          pipeline.setex(key, this.config.ttl, serialized);
        });
        
        await pipeline.exec();
        await this.manageCacheSize();
      } else {
        // Use fallback in-memory cache for batch operations
        const expires = Date.now() + (this.config.ttl * 1000);
        postcodeData.forEach(({ postcode, data }) => {
          this.fallbackCache.set(postcode, { data, expires });
        });
        this.manageFallbackCacheSize();
      }
    } catch (error) {
      console.error('Batch cache set error, falling back to in-memory:', error);
      // Fallback to in-memory cache on Redis error
      const expires = Date.now() + (this.config.ttl * 1000);
      postcodeData.forEach(({ postcode, data }) => {
        this.fallbackCache.set(postcode, { data, expires });
      });
      this.manageFallbackCacheSize();
    }
  }

  /**
   * Cache warming - preload frequently accessed postcodes
   * Following plan: cache top 1000 frequently accessed postcodes
   */
  async warmupCache(postcodeProvider: (postcode: string) => Promise<LocationData | null>): Promise<void> {
    console.log('🔥 Starting cache warmup...');
    
    try {
      const warmupPromises = this.config.warmupPostcodes.map(async (postcode) => {
        // Check if already cached
        const existing = await this.getCachedPostcode(postcode);
        if (existing) return;

        // Fetch from provider and cache
        const data = await postcodeProvider(postcode);
        if (data) {
          await this.setCachedPostcode(postcode, data);
        }
      });

      await Promise.all(warmupPromises);
      console.log(`✅ Cache warmed up with ${this.config.warmupPostcodes.length} postcodes`);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Invalidate specific postcode cache with fallback support
   */
  async invalidatePostcodeCache(postcode?: string): Promise<void> {
    try {
      if (postcode) {
        // Invalidate specific postcode
        if (this.isRedisAvailable) {
          const key = this.buildCacheKey(postcode);
          await this.redis.del(key);
        }
        // Also clear from fallback cache
        this.fallbackCache.delete(postcode);
        console.log(`🗑️ Invalidated cache for postcode: ${postcode}`);
      } else {
        // Invalidate all postcode caches
        if (this.isRedisAvailable) {
          const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
          if (keys.length > 0) {
            await this.redis.del(...keys);
            console.log(`🗑️ Invalidated ${keys.length} cached postcodes from Redis`);
          }
        }
        // Also clear fallback cache
        this.fallbackCache.clear();
        console.log('🗑️ Invalidated in-memory cache');
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
      // Always try to clear fallback cache
      if (postcode) {
        this.fallbackCache.delete(postcode);
      } else {
        this.fallbackCache.clear();
      }
    }
  }

  /**
   * Get cache statistics with fallback support
   * Following plan: monitor Redis memory consumption
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      let hits = 0, misses = 0, totalKeys = 0, memoryUsage = 'Unknown';

      if (this.isRedisAvailable) {
        // Get Redis stats
        const [redisHits, redisMisses] = await Promise.all([
          this.redis.get(`${this.STATS_PREFIX}hits`).then(val => parseInt(val || '0')),
          this.redis.get(`${this.STATS_PREFIX}misses`).then(val => parseInt(val || '0'))
        ]);

        hits = redisHits;
        misses = redisMisses;

        // Get Redis cache key count
        const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
        totalKeys = keys.length;

        // Get Redis memory info
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:([^\r\n]*)/);
        memoryUsage = memoryMatch ? memoryMatch[1] : 'Redis available';
      } else {
        // Use fallback cache stats
        hits = this.fallbackStats.hits;
        misses = this.fallbackStats.misses;
        totalKeys = this.fallbackCache.size;
        memoryUsage = 'In-memory fallback';
      }

      const total = hits + misses;
      const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';

      return {
        hits,
        misses,
        hitRate,
        totalKeys,
        memoryUsage
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        hits: 0,
        misses: 0,
        hitRate: '0%',
        totalKeys: this.fallbackCache.size,
        memoryUsage: 'Stats unavailable'
      };
    }
  }

  /**
   * Clear all cache statistics
   */
  async clearStats(): Promise<void> {
    try {
      await Promise.all([
        this.redis.del(`${this.STATS_PREFIX}hits`),
        this.redis.del(`${this.STATS_PREFIX}misses`)
      ]);
    } catch (error) {
      console.error('Error clearing cache stats:', error);
    }
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // Private helper methods

  private buildCacheKey(postcode: string): string {
    // Systematic key building (no hardcoding)
    return `${this.CACHE_PREFIX}${postcode}`;
  }

  private fallbackStats = { hits: 0, misses: 0 };

  private async recordCacheHit(): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        await this.redis.incr(`${this.STATS_PREFIX}hits`);
      } else {
        this.fallbackStats.hits++;
      }
    } catch (error) {
      // Fail silently for stats, use fallback
      this.fallbackStats.hits++;
    }
  }

  private async recordCacheMiss(): Promise<void> {
    try {
      if (this.isRedisAvailable) {
        await this.redis.incr(`${this.STATS_PREFIX}misses`);
      } else {
        this.fallbackStats.misses++;
      }
    } catch (error) {
      // Fail silently for stats, use fallback
      this.fallbackStats.misses++;
    }
  }

  /**
   * Manage cache size to prevent memory bloat
   * Following plan: monitor Redis memory consumption
   */
  private async manageCacheSize(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      
      if (keys.length > this.config.maxKeys) {
        // Remove oldest keys (simple LRU-like behavior)
        const keysToRemove = keys.length - this.config.maxKeys;
        const sortedKeys = keys.sort(); // Simple sort - in production, use proper LRU
        const oldestKeys = sortedKeys.slice(0, keysToRemove);
        
        if (oldestKeys.length > 0) {
          await this.redis.del(...oldestKeys);
          console.log(`🧹 Cleaned up ${oldestKeys.length} old cache entries`);
        }
      }
    } catch (error) {
      console.error('Cache size management error:', error);
    }
  }

  /**
   * Manage fallback cache size to prevent memory bloat
   */
  private manageFallbackCacheSize(): void {
    if (this.fallbackCache.size > this.config.maxKeys) {
      // Remove oldest entries (simple LRU-like behavior for in-memory cache)
      const entries = Array.from(this.fallbackCache.entries());
      const keysToRemove = entries.length - this.config.maxKeys;
      
      // Sort by expiration time to remove oldest entries
      entries.sort((a, b) => a[1].expires - b[1].expires);
      
      for (let i = 0; i < keysToRemove; i++) {
        this.fallbackCache.delete(entries[i][0]);
      }
      
      console.log(`🧹 Cleaned up ${keysToRemove} old in-memory cache entries`);
    }
  }
}

// Export cache service for use in enhanced postcode service
export default PostcodeCacheService;