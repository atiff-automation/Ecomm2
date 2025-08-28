/**
 * Cache Utilities - Production-Grade Cache Management System
 * Centralized utilities for Next.js 14 App Router cache operations
 * 
 * This module provides systematic, reusable cache management functions
 * following DRY principles and centralized architecture approach.
 */

import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS, CacheInvalidationStrategies, CacheTTLConfig, CacheTagUtils, CacheTagGenerators } from './tag-strategy';

/**
 * Cache Operation Results
 */
export interface CacheOperationResult {
  success: boolean;
  tagsInvalidated: string[];
  pathsInvalidated: string[];
  error?: string;
  timestamp: number;
}

// Export alias for backward compatibility
export type CacheInvalidationResult = CacheOperationResult;

/**
 * Cache Fetch Options
 */
export interface CacheFetchOptions {
  tags?: string[];
  ttl?: number;
  revalidate?: number | false;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Enhanced fetch function with automatic cache tagging
 * Wraps Next.js fetch with our centralized tag strategy
 */
export async function cacheFetch<T = unknown>(
  url: string,
  options: CacheFetchOptions & Omit<RequestInit, 'next'> = {}
): Promise<T> {
  const { tags = [], ttl, revalidate, next, ...fetchOptions } = options;

  // Validate tags
  const validatedTags = tags.filter(tag => CacheTagUtils.isValidTag(tag));
  
  // Setup Next.js cache configuration
  const nextConfig = {
    revalidate: revalidate ?? ttl ?? CacheTTLConfig.PRODUCTS,
    tags: CacheTagUtils.deduplicateTags(validatedTags),
    ...next,
  };

  // Convert relative URLs to absolute URLs for fetch
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      next: nextConfig,
    } as RequestInit & { next: typeof nextConfig });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Cache fetch error for ${fullUrl}:`, error);
    throw error;
  }
}

/**
 * Product-specific cache fetch with automatic tagging
 */
export async function fetchProduct(
  productId: string,
  options: Omit<CacheFetchOptions, 'tags'> = {}
): Promise<unknown> {
  const tags: string[] = [
    CACHE_TAGS.PRODUCTS,
    CACHE_TAGS.API_PRODUCTS,
    `product-${productId}`,
  ];

  return cacheFetch(`/api/products/${productId}`, {
    ...options,
    tags,
    ttl: options.ttl ?? CacheTTLConfig.PRODUCT_DETAILS,
  });
}

/**
 * Products list cache fetch with automatic tagging
 */
export async function fetchProducts(
  params: Record<string, unknown> = {},
  options: Omit<CacheFetchOptions, 'tags'> = {}
): Promise<unknown> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const tags: string[] = [
    CACHE_TAGS.PRODUCTS,
    CACHE_TAGS.API_PRODUCTS,
    CACHE_TAGS.SEARCH,
  ];

  // Add category-specific tag if filtering by category
  if (params.category) {
    tags.push(`category-${String(params.category)}-products`);
  }

  // Add featured tag if fetching featured products
  if (params.featured) {
    tags.push('featured-products');
  }

  return cacheFetch(`/api/products?${searchParams.toString()}`, {
    ...options,
    tags,
    ttl: options.ttl ?? CacheTTLConfig.PRODUCTS,
  });
}

/**
 * Category-specific cache fetch with automatic tagging
 */
export async function fetchCategories(
  options: Omit<CacheFetchOptions, 'tags'> = {}
): Promise<unknown> {
  const tags: string[] = [
    CACHE_TAGS.CATEGORIES,
    CACHE_TAGS.API_CATEGORIES,
  ];

  return cacheFetch('/api/categories', {
    ...options,
    tags,
    ttl: options.ttl ?? CacheTTLConfig.CATEGORIES,
  });
}

/**
 * Cache invalidation with comprehensive logging and error handling
 */
export async function invalidateCacheTags(
  tags: string[],
  context?: string
): Promise<CacheOperationResult> {
  const timestamp = Date.now();
  const validatedTags = CacheTagUtils.deduplicateTags(
    tags.filter(tag => CacheTagUtils.isValidTag(tag))
  );

  try {
    console.log(`🗑️ Cache Invalidation [${context || 'Unknown'}]:`, {
      tags: validatedTags,
      timestamp: new Date(timestamp).toISOString(),
    });

    // Invalidate each tag
    for (const tag of validatedTags) {
      revalidateTag(tag);
    }

    console.log(`✅ Cache invalidated successfully: ${validatedTags.length} tags`);

    return {
      success: true,
      tagsInvalidated: validatedTags,
      pathsInvalidated: [],
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Cache invalidation failed [${context || 'Unknown'}]:`, error);

    return {
      success: false,
      tagsInvalidated: [],
      pathsInvalidated: [],
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Path-based cache invalidation
 */
export async function invalidateCachePaths(
  paths: string[],
  context?: string
): Promise<CacheOperationResult> {
  const timestamp = Date.now();

  try {
    console.log(`🗑️ Path Invalidation [${context || 'Unknown'}]:`, {
      paths,
      timestamp: new Date(timestamp).toISOString(),
    });

    // Invalidate each path
    for (const path of paths) {
      revalidatePath(path);
    }

    console.log(`✅ Paths invalidated successfully: ${paths.length} paths`);

    return {
      success: true,
      tagsInvalidated: [],
      pathsInvalidated: paths,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Path invalidation failed [${context || 'Unknown'}]:`, error);

    return {
      success: false,
      tagsInvalidated: [],
      pathsInvalidated: [],
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Combined tag and path invalidation
 */
export async function invalidateCache(
  tags: string[] = [],
  paths: string[] = [],
  context?: string
): Promise<CacheOperationResult> {
  const timestamp = Date.now();

  try {
    const [tagResult, pathResult] = await Promise.all([
      tags.length > 0 ? invalidateCacheTags(tags, context) : Promise.resolve({ success: true, tagsInvalidated: [], pathsInvalidated: [], timestamp, error: undefined } as CacheOperationResult),
      paths.length > 0 ? invalidateCachePaths(paths, context) : Promise.resolve({ success: true, tagsInvalidated: [], pathsInvalidated: [], timestamp, error: undefined } as CacheOperationResult),
    ]);

    const success = tagResult.success && pathResult.success;
    const error = !success ? (tagResult.error || pathResult.error) : undefined;

    return {
      success,
      tagsInvalidated: tagResult.tagsInvalidated,
      pathsInvalidated: pathResult.pathsInvalidated,
      error,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Combined cache invalidation failed [${context || 'Unknown'}]:`, error);

    return {
      success: false,
      tagsInvalidated: [],
      pathsInvalidated: [],
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Business logic-aware cache invalidation functions
 */
export const CacheInvalidation = {
  /**
   * Product operations
   */
  async onProductCreate(categoryId: string, context = 'Product Create') {
    const tags = CacheInvalidationStrategies.onProductCreate(categoryId);
    const paths = ['/products', `/categories/${categoryId}`, '/admin/products'];
    return invalidateCache(tags, paths, context);
  },

  async onProductUpdate(productId: string, categoryIds: string[], context = 'Product Update') {
    const tags = CacheInvalidationStrategies.onProductUpdate(productId, categoryIds);
    const paths = [
      '/products',
      `/products/${productId}`,
      '/admin/products',
      ...categoryIds.map(id => `/categories/${id}`),
    ];
    return invalidateCache(tags, paths, context);
  },

  async onProductDelete(productId: string, categoryIds: string[], context = 'Product Delete') {
    const tags = CacheInvalidationStrategies.onProductDelete(productId, categoryIds);
    const paths = [
      '/products',
      `/products/${productId}`,
      '/admin/products',
      ...categoryIds.map(id => `/categories/${id}`),
    ];
    return invalidateCache(tags, paths, context);
  },

  async onProductImageUpdate(productId: string, context = 'Product Image Update') {
    const tags = CacheInvalidationStrategies.onProductImageUpdate(productId);
    const paths = ['/products', `/products/${productId}`];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Category operations
   */
  async onCategoryCreate(context = 'Category Create') {
    const tags = CacheInvalidationStrategies.onCategoryCreate();
    const paths = ['/products', '/categories', '/admin/categories'];
    return invalidateCache(tags, paths, context);
  },

  async onCategoryUpdate(categoryId: string, context = 'Category Update') {
    const tags = CacheInvalidationStrategies.onCategoryUpdate(categoryId);
    const paths = ['/products', '/categories', `/categories/${categoryId}`, '/admin/categories'];
    return invalidateCache(tags, paths, context);
  },

  async onCategoryDelete(categoryId: string, context = 'Category Delete') {
    const tags = CacheInvalidationStrategies.onCategoryDelete(categoryId);
    const paths = ['/products', '/categories', `/categories/${categoryId}`, '/admin/categories'];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Review operations
   */
  async onReviewCreate(productId: string, context = 'Review Create') {
    const tags = CacheInvalidationStrategies.onReviewCreate(productId);
    const paths = [`/products/${productId}`, '/admin/reviews'];
    return invalidateCache(tags, paths, context);
  },

  async onReviewUpdate(productId: string, reviewId: string, context = 'Review Update') {
    const tags = CacheInvalidationStrategies.onReviewUpdate(productId, reviewId);
    const paths = [`/products/${productId}`, '/admin/reviews'];
    return invalidateCache(tags, paths, context);
  },

  async onReviewDelete(productId: string, reviewId: string, context = 'Review Delete') {
    const tags = CacheInvalidationStrategies.onReviewDelete(productId, reviewId);
    const paths = [`/products/${productId}`, '/admin/reviews'];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Order operations
   */
  async onOrderCreate(userId: string, productIds: string[], context = 'Order Create') {
    const tags = CacheInvalidationStrategies.onOrderCreate(userId, productIds);
    const paths = ['/admin/orders', `/profile/orders`];
    return invalidateCache(tags, paths, context);
  },

  async onOrderUpdate(orderId: string, userId: string, context = 'Order Update') {
    const tags = CacheInvalidationStrategies.onOrderUpdate(orderId, userId);
    const paths = ['/admin/orders', `/profile/orders`, `/orders/${orderId}`];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Search operations
   */
  async onSearchIndexUpdate(context = 'Search Index Update') {
    const tags = CacheInvalidationStrategies.onSearchIndexUpdate();
    const paths = ['/products', '/search'];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Bulk operations
   */
  async onBulkProductUpdate(productIds: string[], categoryIds: string[], context = 'Bulk Product Update') {
    const tags = CacheInvalidationStrategies.onBulkProductUpdate(productIds, categoryIds);
    const paths = [
      '/products',
      '/admin/products',
      ...productIds.map(id => `/products/${id}`),
      ...categoryIds.map(id => `/categories/${id}`),
    ];
    return invalidateCache(tags, paths, context);
  },

  /**
   * Emergency system-wide cache clear
   */
  async onSystemCacheClear(context = 'System Cache Clear') {
    const tags = CacheInvalidationStrategies.onSystemCacheClear();
    const paths = ['/', '/products', '/categories', '/admin'];
    console.warn('🚨 SYSTEM-WIDE CACHE CLEAR INITIATED', { context, timestamp: new Date().toISOString() });
    return invalidateCache(tags, paths, context);
  },
};

/**
 * Cache health monitoring utilities
 */
export const CacheMonitoring = {
  /**
   * Log cache operation for monitoring
   */
  logCacheOperation(operation: string, details: any) {
    const timestamp = new Date().toISOString();
    console.log(`📊 Cache Operation [${operation}]:`, {
      ...details,
      timestamp,
    });
  },

  /**
   * Track cache hit/miss ratios (to be integrated with analytics)
   */
  trackCacheMetrics(operation: 'hit' | 'miss', tag: string, duration?: number) {
    // This would integrate with your analytics/monitoring system
    console.log(`📈 Cache ${operation.toUpperCase()}:`, {
      tag,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Generate cache health report
   */
  generateCacheHealthReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      tags: Object.values(CACHE_TAGS),
      ttlConfig: CacheTTLConfig,
      systemStatus: 'operational',
    };
    
    console.log('📋 Cache Health Report:', report);
    return report;
  },
};

/**
 * Development and debugging utilities
 */
export const CacheDebug = {
  /**
   * Enable verbose cache logging in development
   */
  enableVerboseLogging: process.env.NODE_ENV === 'development',

  /**
   * Log cache configuration for debugging
   */
  debugCacheConfig(context: string, tags: string[], ttl?: number) {
    if (this.enableVerboseLogging) {
      console.debug(`🐛 Cache Debug [${context}]:`, {
        tags,
        ttl,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Validate cache setup
   */
  validateCacheSetup() {
    const errors: string[] = [];
    
    // Check if required environment variables exist
    if (!process.env.NEXT_PUBLIC_API_URL && !process.env.API_URL) {
      errors.push('Missing API URL configuration');
    }

    // Validate tag format
    Object.values(CACHE_TAGS).forEach(tag => {
      if (!CacheTagUtils.isValidTag(tag)) {
        errors.push(`Invalid cache tag format: ${tag}`);
      }
    });

    if (errors.length > 0) {
      console.error('❌ Cache Setup Validation Errors:', errors);
      return false;
    }

    console.log('✅ Cache setup validation passed');
    return true;
  },
};