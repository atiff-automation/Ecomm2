/**
 * Product Embed Service
 * Single Source of Truth for product data fetching in article embeds
 * Features: In-memory caching with TTL, batch fetching, N+1 prevention
 */

import { prisma } from '@/lib/db/prisma';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';
import type {
  ProductEmbedData,
  ProductEmbedCacheEntry,
} from '@/types/article.types';

export class ProductEmbedService {
  // In-memory cache with TTL
  private static cache = new Map<string, ProductEmbedCacheEntry>();

  /**
   * Fetch products by slugs with caching
   * Implements batch fetching to prevent N+1 query problem
   * @param slugs Array of product slugs
   * @returns Map of slug to product data
   */
  static async fetchProductsBySlug(
    slugs: string[]
  ): Promise<Map<string, ProductEmbedData>> {
    const result = new Map<string, ProductEmbedData>();
    const slugsToFetch: string[] = [];
    const now = Date.now();

    // Check cache first
    for (const slug of slugs) {
      const cached = this.cache.get(slug);

      if (cached && cached.expiresAt > now) {
        // Cache hit - use cached data
        result.set(slug, cached.data);
      } else {
        // Cache miss or expired
        slugsToFetch.push(slug);
        if (cached) {
          // Clean up expired entry
          this.cache.delete(slug);
        }
      }
    }

    // Fetch missing products from database (batch query)
    if (slugsToFetch.length > 0) {
      try {
        const products = await this.batchFetchProducts(slugsToFetch);

        // Add to result and cache
        for (const product of products) {
          result.set(product.slug, product);
          this.cacheProduct(product);
        }
      } catch (error) {
        console.error('Error fetching products for embeds:', error);
        // Continue with cached products only (graceful degradation)
      }
    }

    // Clean up cache if it's too large
    this.cleanupCache();

    return result;
  }

  /**
   * Batch fetch products from database
   * Single query for all slugs (prevents N+1 problem)
   * @param slugs Array of product slugs to fetch
   * @returns Array of product embed data
   */
  private static async batchFetchProducts(
    slugs: string[]
  ): Promise<ProductEmbedData[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          slug: {
            in: slugs,
          },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          regularPrice: true,
          memberPrice: true,
          stockQuantity: true,
          status: true,
          images: {
            where: {
              isPrimary: true,
            },
            select: {
              url: true,
            },
            take: 1,
          },
        },
      });

      // Transform to ProductEmbedData format
      return products.map(product => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        regularPrice: Number(product.regularPrice),
        memberPrice: Number(product.memberPrice),
        featuredImage:
          product.images[0]?.url || '/images/placeholder-product.png',
        stockQuantity: product.stockQuantity,
        status: product.status,
      }));
    } catch (error) {
      console.error('Database error fetching products:', error);
      throw error;
    }
  }

  /**
   * Cache a product with TTL
   * @param product Product data to cache
   */
  private static cacheProduct(product: ProductEmbedData): void {
    const { CACHE_TTL_MS } = ARTICLE_CONSTANTS.EMBEDS.PRODUCT;
    const expiresAt = Date.now() + CACHE_TTL_MS;

    this.cache.set(product.slug, {
      data: product,
      expiresAt,
    });
  }

  /**
   * Clean up expired cache entries and enforce max size
   */
  private static cleanupCache(): void {
    const { CACHE_MAX_SIZE } = ARTICLE_CONSTANTS.EMBEDS.PRODUCT;
    const now = Date.now();

    // Remove expired entries
    for (const [slug, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(slug);
      }
    }

    // Enforce max size (LRU-style: remove oldest entries)
    if (this.cache.size > CACHE_MAX_SIZE) {
      const entriesToRemove = this.cache.size - CACHE_MAX_SIZE;
      let removed = 0;

      for (const slug of this.cache.keys()) {
        if (removed >= entriesToRemove) break;
        this.cache.delete(slug);
        removed++;
      }
    }
  }

  /**
   * Extract product slugs from HTML content
   * Detects both /product/[slug] and /products/[slug] patterns
   * @param html Raw HTML content
   * @returns Array of unique product slugs
   */
  static extractProductSlugs(html: string): string[] {
    const { LINK_PATTERN } = ARTICLE_CONSTANTS.EMBEDS.PRODUCT;
    const slugs = new Set<string>();

    console.log('🔍 [Extract Slugs] Starting extraction...');
    console.log('📊 [Extract Slugs] HTML length:', html.length);
    console.log('📊 [Extract Slugs] Pattern:', LINK_PATTERN.source);

    try {
      // Match all product links
      const matches = html.matchAll(new RegExp(LINK_PATTERN.source, 'g'));

      let matchCount = 0;
      for (const match of matches) {
        matchCount++;
        console.log(`🎯 [Extract Slugs] Match #${matchCount}:`, match[0], '→ slug:', match[1]);
        if (match[1]) {
          slugs.add(match[1]);
        }
      }

      console.log(`📝 [Extract Slugs] Total matches: ${matchCount}, Unique slugs: ${slugs.size}`);
    } catch (error) {
      console.error('❌ [Extract Slugs] Error:', error);
    }

    return Array.from(slugs);
  }

  /**
   * Get cache statistics (for monitoring/debugging)
   * @returns Cache statistics object
   */
  static getCacheStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
  } {
    const { CACHE_MAX_SIZE, CACHE_TTL_MS } = ARTICLE_CONSTANTS.EMBEDS.PRODUCT;

    return {
      size: this.cache.size,
      maxSize: CACHE_MAX_SIZE,
      ttlMs: CACHE_TTL_MS,
    };
  }

  /**
   * Clear all cached products (for testing or forced refresh)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get single product by slug (with caching)
   * @param slug Product slug
   * @returns Product data or null if not found
   */
  static async getProductBySlug(
    slug: string
  ): Promise<ProductEmbedData | null> {
    const products = await this.fetchProductsBySlug([slug]);
    return products.get(slug) || null;
  }
}
