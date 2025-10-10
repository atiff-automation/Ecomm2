/**
 * Cache Module Exports - Malaysian E-commerce Platform
 * Central export point for all caching functionality
 * PURE IN-MEMORY IMPLEMENTATION - No external dependencies
 */

// Core caching - Pure in-memory implementation
export { cacheManager, CacheManager } from './cache-manager';
export type { CacheOptions, CacheStats, CacheStrategy } from './cache-manager';

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
