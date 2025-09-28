/**
 * Redis Client Mock - For Railway deployment without Redis
 * Uses in-memory cache as fallback
 */

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  compress?: boolean;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
}

// Simple in-memory cache implementation
class MemoryRedisClient {
  private cache = new Map<string, { value: any; expires: number }>();
  private stats = { hits: 0, misses: 0, keys: 0 };

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async set(key: string, value: any, mode?: string, duration?: number): Promise<string> {
    const expires = duration ? Date.now() + (duration * 1000) : Date.now() + (3600 * 1000); // 1 hour default
    this.cache.set(key, { value, expires });
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
    if (!item) return 0;

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return 0;
    }

    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for basic wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushall(): Promise<string> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, keys: 0 };
    return 'OK';
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  // Mock Redis client methods
  on(event: string, callback: Function) {
    // Mock event handling
  }

  disconnect() {
    this.cache.clear();
  }
}

// Create singleton instance
export const redisClient = new MemoryRedisClient();

// Export for compatibility
export default redisClient;