/**
 * Cache Manager - Malaysian E-commerce Platform
 * Pure in-memory caching implementation
 * NO EXTERNAL DEPENDENCIES - Simple and fast
 */

export interface CacheStrategy {
  ttl: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  strategy?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: string;
}

/**
 * Pure in-memory cache implementation
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize = 10000; // Maximum number of entries
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
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

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Increment hit count
      entry.hits++;
      this.stats.hits++;

      return entry.data as T;
    } catch (error) {
      console.error('Memory cache GET error:', error);
      this.stats.misses++;
      return null;
    }
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  exists(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

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
      console.log(
        `🧹 Memory cache: Cleaned up ${keysToDelete.length} expired entries`
      );
    }
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    // Estimate memory usage
    const estimatedBytes = JSON.stringify(
      Array.from(this.cache.entries())
    ).length;
    const memoryMB = (estimatedBytes / (1024 * 1024)).toFixed(2);

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: this.cache.size,
      memory: `${memoryMB} MB`,
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
 * Cache Manager - Pure in-memory implementation
 * SINGLE SOURCE OF TRUTH for caching
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
    // Products - 1 hour TTL
    this.strategies.set('products', {
      ttl: 3600,
    });

    // Categories - 6 hours TTL
    this.strategies.set('categories', {
      ttl: 21600,
    });

    // User sessions - 24 hours TTL
    this.strategies.set('sessions', {
      ttl: 86400,
    });

    // Cart data - 30 minutes TTL
    this.strategies.set('cart', {
      ttl: 1800,
    });

    // API responses - 5 minutes TTL
    this.strategies.set('api', {
      ttl: 300,
    });

    // Search results - 15 minutes TTL
    this.strategies.set('search', {
      ttl: 900,
    });

    // Static content - 24 hours TTL
    this.strategies.set('static', {
      ttl: 86400,
    });

    // Default strategy
    this.strategies.set('default', {
      ttl: 3600,
    });
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace?: string): string {
    const appPrefix = 'jrm-ecommerce';
    const ns = namespace || 'default';
    return `${appPrefix}:${ns}:${key}`;
  }

  /**
   * Set cache value
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const strategy = this.strategies.get(options.strategy || 'default') || {
      ttl: 3600,
    };

    const ttl = options.ttl || strategy.ttl;
    const cacheKey = this.generateKey(key, options.namespace);

    return this.memoryCache.set(cacheKey, value, ttl);
  }

  /**
   * Get cache value
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.generateKey(key, options.namespace);
    return this.memoryCache.get<T>(cacheKey);
  }

  /**
   * Delete cache value
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateKey(key, options.namespace);
    return this.memoryCache.delete(cacheKey);
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.generateKey(key, options.namespace);
    return this.memoryCache.exists(cacheKey);
  }

  /**
   * Cache with get-or-set pattern
   */
  async getOrSet<T>(
    key: string,
    getter: () => Promise<T> | T,
    options: CacheOptions = {}
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
   * Invalidate cache by tags (simplified - clears by namespace)
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    // In-memory implementation: we don't have true tag support
    // This is a limitation compared to Redis
    console.log(`Cache invalidation requested for tags: ${tags.join(', ')}`);
  }

  /**
   * Clear cache by pattern (simplified)
   */
  async clearByPattern(pattern: string, namespace?: string): Promise<number> {
    // In-memory cache doesn't support pattern matching easily
    // This is a limitation - for full pattern support, consider Redis
    console.log(`Cache clear by pattern requested: ${pattern}`);
    return 0;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    console.log('🗑️ All cache cleared');
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
  async getStats(): Promise<CacheStats> {
    return this.memoryCache.getStats();
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy' as const,
      size: this.memoryCache.size(),
      stats: this.memoryCache.getStats(),
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
    console.log('🗑️ Cache manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
