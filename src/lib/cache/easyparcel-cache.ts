/**
 * EasyParcel Caching Service (Memory-Only)
 * Simplified in-memory caching for rate calculations and API responses
 * No external dependencies (Redis removed)
 */

interface CacheConfig {
  rateCacheTTL: number; // 30 minutes for rates
  validationCacheTTL: number; // 24 hours for validation
  serviceCacheTTL: number; // 4 hours for service lists
}

interface CachedRate {
  rates: any[];
  timestamp: number;
  expiresAt: number;
  requestHash: string;
}

interface CachedValidation {
  isValid: boolean;
  details?: any;
  timestamp: number;
  expiresAt: number;
}

interface CachedServiceList {
  services: any[];
  timestamp: number;
  expiresAt: number;
  region: string;
}

export class EasyParcelCache {
  private memoryCache: Map<string, any> = new Map();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      rateCacheTTL: 30 * 60, // 30 minutes
      validationCacheTTL: 24 * 60 * 60, // 24 hours
      serviceCacheTTL: 4 * 60 * 60, // 4 hours
      ...config,
    };
  }

  /**
   * Cache shipping rates with intelligent key generation
   */
  async cacheRates(rateRequest: any, rates: any[]): Promise<void> {
    try {
      const cacheKey = this.generateRateKey(rateRequest);
      const cachedData: CachedRate = {
        rates,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.rateCacheTTL * 1000,
        requestHash: this.hashRequest(rateRequest),
      };

      await this.setCache(cacheKey, cachedData, this.config.rateCacheTTL);

      // Also cache by simplified key for quick lookup
      const simplifiedKey = this.generateSimplifiedRateKey(rateRequest);
      await this.setCache(simplifiedKey, cachedData, this.config.rateCacheTTL);

      console.log(
        `[EasyParcel Cache] Cached ${rates.length} rates for key: ${cacheKey}`
      );
    } catch (error) {
      console.error('[EasyParcel Cache] Error caching rates:', error);
    }
  }

  /**
   * Retrieve cached rates
   */
  async getCachedRates(rateRequest: any): Promise<any[] | null> {
    try {
      const cacheKey = this.generateRateKey(rateRequest);
      const cachedData = await this.getCache<CachedRate>(cacheKey);

      if (!cachedData) {
        // Try simplified key
        const simplifiedKey = this.generateSimplifiedRateKey(rateRequest);
        const simplifiedData = await this.getCache<CachedRate>(simplifiedKey);

        if (simplifiedData && this.isValidCache(simplifiedData.expiresAt)) {
          console.log(
            `[EasyParcel Cache] Cache hit (simplified) for: ${simplifiedKey}`
          );
          return simplifiedData.rates;
        }
        return null;
      }

      if (!this.isValidCache(cachedData.expiresAt)) {
        await this.deleteCache(cacheKey);
        return null;
      }

      // Verify request similarity for exact matches
      const currentHash = this.hashRequest(rateRequest);
      if (cachedData.requestHash !== currentHash) {
        console.log(
          '[EasyParcel Cache] Request hash mismatch, invalidating cache'
        );
        return null;
      }

      console.log(`[EasyParcel Cache] Cache hit for: ${cacheKey}`);
      return cachedData.rates;
    } catch (error) {
      console.error('[EasyParcel Cache] Error retrieving cached rates:', error);
      return null;
    }
  }

  /**
   * Cache address/postcode validation results
   */
  async cacheValidation(
    identifier: string,
    validationResult: any
  ): Promise<void> {
    try {
      const cacheKey = `validation:${identifier}`;
      const cachedData: CachedValidation = {
        isValid: validationResult.isValid,
        details: validationResult.details,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.validationCacheTTL * 1000,
      };

      await this.setCache(cacheKey, cachedData, this.config.validationCacheTTL);
      console.log(`[EasyParcel Cache] Cached validation for: ${identifier}`);
    } catch (error) {
      console.error('[EasyParcel Cache] Error caching validation:', error);
    }
  }

  /**
   * Retrieve cached validation result
   */
  async getCachedValidation(identifier: string): Promise<any | null> {
    try {
      const cacheKey = `validation:${identifier}`;
      const cachedData = await this.getCache<CachedValidation>(cacheKey);

      if (!cachedData || !this.isValidCache(cachedData.expiresAt)) {
        if (cachedData) {
          await this.deleteCache(cacheKey);
        }
        return null;
      }

      console.log(`[EasyParcel Cache] Validation cache hit for: ${identifier}`);
      return {
        isValid: cachedData.isValid,
        details: cachedData.details,
      };
    } catch (error) {
      console.error(
        '[EasyParcel Cache] Error retrieving cached validation:',
        error
      );
      return null;
    }
  }

  /**
   * Cache courier service lists
   */
  async cacheServiceList(region: string, services: any[]): Promise<void> {
    try {
      const cacheKey = `services:${region}`;
      const cachedData: CachedServiceList = {
        services,
        region,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.serviceCacheTTL * 1000,
      };

      await this.setCache(cacheKey, cachedData, this.config.serviceCacheTTL);
      console.log(
        `[EasyParcel Cache] Cached ${services.length} services for region: ${region}`
      );
    } catch (error) {
      console.error('[EasyParcel Cache] Error caching service list:', error);
    }
  }

  /**
   * Retrieve cached service list
   */
  async getCachedServiceList(region: string): Promise<any[] | null> {
    try {
      const cacheKey = `services:${region}`;
      const cachedData = await this.getCache<CachedServiceList>(cacheKey);

      if (!cachedData || !this.isValidCache(cachedData.expiresAt)) {
        if (cachedData) {
          await this.deleteCache(cacheKey);
        }
        return null;
      }

      console.log(
        `[EasyParcel Cache] Service list cache hit for region: ${region}`
      );
      return cachedData.services;
    } catch (error) {
      console.error(
        '[EasyParcel Cache] Error retrieving cached service list:',
        error
      );
      return null;
    }
  }

  /**
   * Invalidate specific cache entries
   */
  async invalidateCache(pattern: string): Promise<number> {
    try {
      let deletedCount = 0;
      const keysToDelete: string[] = [];

      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.memoryCache.delete(key));
      deletedCount = keysToDelete.length;

      console.log(
        `[EasyParcel Cache] Invalidated ${deletedCount} cache entries matching: ${pattern}`
      );
      return deletedCount;
    } catch (error) {
      console.error('[EasyParcel Cache] Error invalidating cache:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    try {
      this.memoryCache.clear();
      console.log('[EasyParcel Cache] All cache cleared');
    } catch (error) {
      console.error('[EasyParcel Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    type: 'memory';
    totalKeys: number;
    rateKeys: number;
    validationKeys: number;
    serviceKeys: number;
    memoryUsage?: number;
  }> {
    try {
      const allKeys = Array.from(this.memoryCache.keys());
      const rateKeys = allKeys.filter(key => key.includes('rate:'));
      const validationKeys = allKeys.filter(key =>
        key.includes('validation:')
      );
      const serviceKeys = allKeys.filter(key => key.includes('services:'));

      return {
        type: 'memory',
        totalKeys: allKeys.length,
        rateKeys: rateKeys.length,
        validationKeys: validationKeys.length,
        serviceKeys: serviceKeys.length,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      };
    } catch (error) {
      console.error('[EasyParcel Cache] Error getting cache stats:', error);
      return {
        type: 'memory',
        totalKeys: 0,
        rateKeys: 0,
        validationKeys: 0,
        serviceKeys: 0,
      };
    }
  }

  /**
   * Generate cache key for rate requests
   */
  private generateRateKey(rateRequest: any): string {
    const {
      pickup_address,
      delivery_address,
      parcel,
      service_types = [],
      insurance = false,
      cod = false,
    } = rateRequest;

    const keyParts = [
      'rate',
      pickup_address.postcode,
      pickup_address.state,
      delivery_address.postcode,
      delivery_address.state,
      parcel.weight,
      parcel.length || 0,
      parcel.width || 0,
      parcel.height || 0,
      parcel.value,
      service_types.sort().join(','),
      insurance ? 'ins' : '',
      cod ? 'cod' : '',
    ];

    return keyParts.filter(Boolean).join(':');
  }

  /**
   * Generate simplified cache key (for broader matching)
   */
  private generateSimplifiedRateKey(rateRequest: any): string {
    const { pickup_address, delivery_address, parcel } = rateRequest;

    return [
      'rate_simple',
      pickup_address.postcode,
      delivery_address.postcode,
      Math.ceil(parcel.weight), // Round up weight for broader matching
    ].join(':');
  }

  /**
   * Hash request for cache validation
   */
  private hashRequest(request: any): string {
    const str = JSON.stringify(request, Object.keys(request).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCache(expiresAt: number): boolean {
    return Date.now() < expiresAt;
  }

  /**
   * Set cache entry in memory
   */
  private async setCache(key: string, data: any, ttl: number): Promise<void> {
    const fullKey = `easyparcel:${key}`;
    this.memoryCache.set(fullKey, data);

    // Simple TTL implementation for memory cache
    setTimeout(() => {
      this.memoryCache.delete(fullKey);
    }, ttl * 1000);
  }

  /**
   * Get cache entry from memory
   */
  private async getCache<T>(key: string): Promise<T | null> {
    const fullKey = `easyparcel:${key}`;
    return this.memoryCache.get(fullKey) || null;
  }

  /**
   * Delete cache entry
   */
  private async deleteCache(key: string): Promise<void> {
    const fullKey = `easyparcel:${key}`;
    this.memoryCache.delete(fullKey);
  }

  /**
   * Cleanup expired memory cache entries
   */
  cleanupMemoryCache(): void {
    let cleanedCount = 0;
    for (const [key, data] of this.memoryCache.entries()) {
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[EasyParcel Cache] Cleaned up ${cleanedCount} expired memory cache entries`
      );
    }
  }

  /**
   * Close/cleanup (no-op for memory cache)
   */
  async disconnect(): Promise<void> {
    // No-op: Memory cache doesn't need disconnection
  }
}

// Singleton instance
let cacheInstance: EasyParcelCache | null = null;

export function getEasyParcelCache(): EasyParcelCache {
  if (!cacheInstance) {
    cacheInstance = new EasyParcelCache();

    // Setup cleanup interval for memory cache
    setInterval(
      () => {
        cacheInstance?.cleanupMemoryCache();
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }
  return cacheInstance;
}
