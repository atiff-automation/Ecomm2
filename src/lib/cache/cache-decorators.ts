/**
 * Cache Decorators - Malaysian E-commerce Platform
 * Decorators and utilities for automatic caching
 */

import { cacheManager } from './cache-manager';
import { CacheOptions } from './redis-client';

/**
 * Method decorator for automatic caching
 */
export function Cached(options: CacheOptions & { 
  strategy?: string;
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean;
} = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key
      const baseKey = options.keyGenerator 
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      const cacheKey = `method:${baseKey}`;

      // Check condition if provided
      if (options.condition && !options.condition(...args)) {
        return await originalMethod.apply(this, args);
      }

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey, { 
        strategy: options.strategy,
        namespace: options.namespace 
      });
      
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cacheManager.set(cacheKey, result, options);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Class decorator for automatic caching of all methods
 */
export function CachedClass(options: {
  strategy?: string;
  ttl?: number;
  namespace?: string;
  exclude?: string[];
} = {}) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);
    const exclude = options.exclude || ['constructor'];

    methodNames.forEach(methodName => {
      if (exclude.includes(methodName)) return;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
      if (!descriptor || typeof descriptor.value !== 'function') return;

      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${constructor.name}:${methodName}:${JSON.stringify(args)}`;
        
        const cached = await cacheManager.get(cacheKey, {
          strategy: options.strategy,
          namespace: options.namespace || constructor.name.toLowerCase()
        });
        
        if (cached !== null) {
          return cached;
        }

        const result = await originalMethod.apply(this, args);
        
        await cacheManager.set(cacheKey, result, {
          ttl: options.ttl,
          strategy: options.strategy,
          namespace: options.namespace || constructor.name.toLowerCase()
        });
        
        return result;
      };

      Object.defineProperty(prototype, methodName, descriptor);
    });

    return constructor;
  };
}

/**
 * Cache invalidation decorator
 */
export function InvalidateCache(options: {
  keys?: string[];
  patterns?: string[];
  tags?: string[];
  strategy?: string;
} = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute original method first
      const result = await originalMethod.apply(this, args);
      
      // Invalidate specified keys
      if (options.keys) {
        for (const key of options.keys) {
          await cacheManager.delete(key, { strategy: options.strategy });
        }
      }

      // Invalidate by patterns
      if (options.patterns) {
        for (const pattern of options.patterns) {
          await cacheManager.clearByPattern(pattern);
        }
      }

      // Invalidate by tags
      if (options.tags) {
        await cacheManager.invalidateByTags(options.tags);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Rate limiting decorator with cache
 */
export function RateLimit(options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (...args: any[]) => string;
  message?: string;
} = { maxRequests: 100, windowMs: 60000 }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate rate limit key
      const baseKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${this.userId || 'anonymous'}`;
      
      const rateLimitKey = `ratelimit:${baseKey}`;
      
      // Get current count
      const current = await cacheManager.get<number>(rateLimitKey) || 0;
      
      if (current >= options.maxRequests) {
        throw new Error(options.message || 'Rate limit exceeded');
      }
      
      // Increment count
      await cacheManager.set(
        rateLimitKey, 
        current + 1, 
        { ttl: Math.ceil(options.windowMs / 1000), strategy: 'api' }
      );
      
      // Execute original method
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Memoization decorator for expensive computations
 */
export function Memoize(options: {
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
  maxCacheSize?: number;
} = {}) {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const ttl = options.ttl || 300; // 5 minutes default
  const maxSize = options.maxCacheSize || 1000;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Generate memoization key
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      const now = Date.now();
      const cached = cache.get(key);

      // Return cached result if valid
      if (cached && (now - cached.timestamp) < (ttl * 1000)) {
        return cached.data;
      }

      // Execute original method
      const result = originalMethod.apply(this, args);

      // Cache size management
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      // Cache the result
      cache.set(key, {
        data: result,
        timestamp: now
      });

      return result;
    };

    return descriptor;
  };
}

/**
 * Utility function to create cache key
 */
export function createCacheKey(
  namespace: string, 
  identifier: string, 
  params?: Record<string, any>
): string {
  const paramsString = params ? JSON.stringify(params) : '';
  return `${namespace}:${identifier}${paramsString ? ':' + Buffer.from(paramsString).toString('base64') : ''}`;
}

/**
 * Cache warming utility
 */
export class CacheWarmer {
  private static warmingTasks: Map<string, () => Promise<void>> = new Map();

  static register(name: string, task: () => Promise<void>): void {
    this.warmingTasks.set(name, task);
  }

  static async warmUp(taskNames?: string[]): Promise<void> {
    const tasks = taskNames 
      ? taskNames.map(name => this.warmingTasks.get(name)).filter(Boolean)
      : Array.from(this.warmingTasks.values());

    console.log(`🔥 Warming up ${tasks.length} cache tasks...`);
    
    const results = await Promise.allSettled(tasks.map(task => task!()));
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Cache warming completed: ${succeeded} succeeded, ${failed} failed`);
    
    if (failed > 0) {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Cache warming task ${index} failed:`, result.reason);
        }
      });
    }
  }
}

/**
 * Cache health monitor
 */
export class CacheMonitor {
  private static metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    slowQueries: 0,
  };

  static recordHit(): void {
    this.metrics.hits++;
  }

  static recordMiss(): void {
    this.metrics.misses++;
  }

  static recordError(): void {
    this.metrics.errors++;
  }

  static recordSlowQuery(): void {
    this.metrics.slowQueries++;
  }

  static getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      total,
    };
  }

  static reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      slowQueries: 0,
    };
  }
}

/**
 * Performance monitoring decorator
 */
export function MonitorPerformance(options: {
  slowThreshold?: number;
  logSlow?: boolean;
} = {}) {
  const slowThreshold = options.slowThreshold || 1000; // 1 second
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        if (duration > slowThreshold) {
          CacheMonitor.recordSlowQuery();
          
          if (options.logSlow) {
            console.warn(
              `⚠️ Slow cache operation: ${target.constructor.name}.${propertyKey} took ${duration}ms`
            );
          }
        }
        
        return result;
      } catch (error) {
        CacheMonitor.recordError();
        throw error;
      }
    };

    return descriptor;
  };
}