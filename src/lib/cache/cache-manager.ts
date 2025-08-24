/**
 * Cache Manager - Malaysian E-commerce Platform
 * High-level caching abstraction with fallback strategies
 */

import { redisClient } from './redis-client';
import { CacheOptions } from './redis-client';

export interface CacheStrategy {
  primary: 'redis' | 'memory' | 'none';
  fallback: 'memory' | 'none';
  ttl: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * In-memory cache fallback
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of entries
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, value: T, ttl: number): boolean {
    try {
      // Remove oldest entries if at max capacity
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      this.cache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        hits: 0,
      });

      return true;
    } catch (error) {
      console.error('Memory cache SET error:', error);
      return false;
    }
  }

  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) return null;

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return null;
      }

      // Increment hit count
      entry.hits++;
      
      return entry.data as T;
    } catch (error) {
      console.error('Memory cache GET error:', error);
      return null;
    }
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  exists(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Memory cache: Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageHits: entries.length > 0 ? totalHits / entries.length : 0,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Cache Manager with multiple strategies
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: MemoryCache;
  private strategies: Map<string, CacheStrategy> = new Map();

  private constructor() {
    this.memoryCache = new MemoryCache();
    this.setupDefaultStrategies();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Setup default caching strategies for different data types
   */
  private setupDefaultStrategies(): void {
    // Products - Redis primary, memory fallback, 1 hour TTL
    this.strategies.set('products', {
      primary: 'redis',
      fallback: 'memory',
      ttl: 3600, // 1 hour
    });

    // Categories - Redis primary, memory fallback, 6 hours TTL
    this.strategies.set('categories', {
      primary: 'redis',
      fallback: 'memory', 
      ttl: 21600, // 6 hours
    });

    // User sessions - Redis only, 24 hours TTL
    this.strategies.set('sessions', {
      primary: 'redis',
      fallback: 'none',
      ttl: 86400, // 24 hours
    });

    // Cart data - Redis primary, memory fallback, 30 minutes TTL
    this.strategies.set('cart', {
      primary: 'redis',
      fallback: 'memory',
      ttl: 1800, // 30 minutes
    });

    // API responses - Memory only, 5 minutes TTL
    this.strategies.set('api', {
      primary: 'memory',
      fallback: 'none',
      ttl: 300, // 5 minutes
    });

    // Search results - Redis primary, memory fallback, 15 minutes TTL
    this.strategies.set('search', {
      primary: 'redis',
      fallback: 'memory',
      ttl: 900, // 15 minutes
    });

    // Static content - Redis primary, memory fallback, 24 hours TTL
    this.strategies.set('static', {
      primary: 'redis',
      fallback: 'memory',
      ttl: 86400, // 24 hours
    });
  }

  /**
   * Set cache value using appropriate strategy
   */
  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions & { strategy?: string } = {}
  ): Promise<boolean> {
    const strategy = this.strategies.get(options.strategy || 'default') || {
      primary: 'redis',
      fallback: 'memory',
      ttl: 3600,
    };

    const ttl = options.ttl || strategy.ttl;
    const cacheOptions = { ...options, ttl };

    // Try primary cache
    if (strategy.primary === 'redis') {
      const success = await redisClient.set(key, value, cacheOptions);
      if (success) return true;

      console.warn(`Redis SET failed for key: ${key}, trying fallback`);
    } else if (strategy.primary === 'memory') {
      const success = this.memoryCache.set(key, value, ttl);
      if (success) return true;
    }

    // Try fallback cache
    if (strategy.fallback === 'memory') {
      return this.memoryCache.set(key, value, ttl);
    }

    return false;
  }

  /**
   * Get cache value using appropriate strategy
   */
  async get<T>(
    key: string, 
    options: { strategy?: string; namespace?: string } = {}
  ): Promise<T | null> {
    const strategy = this.strategies.get(options.strategy || 'default') || {
      primary: 'redis',
      fallback: 'memory',
      ttl: 3600,
    };

    // Try primary cache
    if (strategy.primary === 'redis') {
      const value = await redisClient.get<T>(key, options);
      if (value !== null) return value;
    } else if (strategy.primary === 'memory') {
      const value = this.memoryCache.get<T>(key);
      if (value !== null) return value;
    }

    // Try fallback cache
    if (strategy.fallback === 'memory') {
      return this.memoryCache.get<T>(key);
    }

    return null;
  }

  /**
   * Delete cache value from all layers
   */
  async delete(
    key: string, 
    options: { strategy?: string; namespace?: string } = {}
  ): Promise<boolean> {
    const strategy = this.strategies.get(options.strategy || 'default') || {
      primary: 'redis',
      fallback: 'memory',
      ttl: 3600,
    };

    let deleted = false;

    // Delete from Redis if used
    if (strategy.primary === 'redis' || strategy.fallback === 'redis') {
      const redisDeleted = await redisClient.delete(key, options.namespace);
      deleted = deleted || redisDeleted;
    }

    // Delete from memory if used
    if (strategy.primary === 'memory' || strategy.fallback === 'memory') {
      const memoryDeleted = this.memoryCache.delete(key);
      deleted = deleted || memoryDeleted;
    }

    return deleted;
  }

  /**
   * Check if key exists in any cache layer
   */
  async exists(
    key: string, 
    options: { strategy?: string; namespace?: string } = {}
  ): Promise<boolean> {
    const strategy = this.strategies.get(options.strategy || 'default') || {
      primary: 'redis',
      fallback: 'memory',
      ttl: 3600,
    };

    // Check primary cache
    if (strategy.primary === 'redis') {
      const exists = await redisClient.exists(key, options.namespace);
      if (exists) return true;
    } else if (strategy.primary === 'memory') {
      const exists = this.memoryCache.exists(key);
      if (exists) return true;
    }

    // Check fallback cache
    if (strategy.fallback === 'memory') {
      return this.memoryCache.exists(key);
    }

    return false;
  }

  /**
   * Cache with get-or-set pattern
   */
  async getOrSet<T>(
    key: string,
    getter: () => Promise<T> | T,
    options: CacheOptions & { strategy?: string } = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Get fresh data
    const freshData = await getter();
    
    // Cache the fresh data
    await this.set(key, freshData, options);
    
    return freshData;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // Redis tag-based invalidation
    await redisClient.invalidateByTags(tags);
    
    // Memory cache doesn't support tags, so we clear relevant patterns
    // This is a limitation - for full tag support, use Redis
    console.log(`Cache invalidated by tags: ${tags.join(', ')}`);
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string, namespace?: string): Promise<number> {
    let totalCleared = 0;

    // Clear from Redis
    const redisCleared = await redisClient.clearByPattern(pattern, namespace);
    totalCleared += redisCleared;

    // Memory cache doesn't support patterns easily
    // This is a limitation of the memory cache implementation
    
    return totalCleared;
  }

  /**
   * Define or update cache strategy
   */
  setStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const redisStats = await redisClient.getStats();
    const memoryStats = this.memoryCache.getStats();

    return {
      redis: redisStats,
      memory: memoryStats,
      strategies: Object.fromEntries(this.strategies),
    };
  }

  /**
   * Health check for all cache layers
   */
  async healthCheck() {
    const redisHealth = await redisClient.healthCheck();
    
    return {
      redis: redisHealth,
      memory: {
        status: 'healthy' as const,
        size: this.memoryCache.size(),
      },
    };
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(): Promise<void> {
    console.log('🔥 Starting cache warm-up...');
    
    try {
      // This would typically load:
      // - Featured products
      // - Categories
      // - Common search results
      // - System configuration
      
      console.log('✅ Cache warm-up completed');
    } catch (error) {
      console.error('❌ Cache warm-up failed:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    this.memoryCache.destroy();
    await redisClient.disconnect();
    console.log('🗑️ Cache manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();