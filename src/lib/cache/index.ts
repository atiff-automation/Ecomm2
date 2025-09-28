/**
 * Cache Module Exports - Malaysian E-commerce Platform
 * Central export point for all caching functionality
 */

// Core caching - Railway deployment ready with fallback
export { redisClient } from './redis-client-fallback';
export { cacheManager, CacheManager } from './cache-manager';
export type { CacheOptions, CacheStats } from './redis-client';
export type { CacheStrategy } from './cache-manager';

// Decorators and utilities
export {
  Cached,
  InvalidateCache,
  CachedClass,
  RateLimit,
  Memoize,
  MonitorPerformance,
  createCacheKey,
  CacheWarmer,
  CacheMonitor,
} from './cache-decorators';

// Initialization and management
export {
  initializeCache,
  shutdownCache,
  createCacheHealthCheck,
  getCacheStatistics,
  CacheWarmingScheduler,
  cacheWarmingScheduler,
  DEFAULT_WARMING_SCHEDULES,
} from './cache-init';
export type { CacheInitOptions } from './cache-init';

// Re-export enhanced services
export { enhancedProductService } from '../services/enhanced-product-service';
