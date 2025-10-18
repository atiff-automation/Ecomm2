/**
 * Product Cache Service - Production Ready
 * Following @REDIS_PRODUCTION_IMPLEMENTATION_PLAN.md architecture (lines 344-431)
 * Following @CLAUDE.md: NO hardcoding, systematic approach, centralized
 *
 * Extends BaseCacheService for centralized caching architecture
 * Specialized for product data caching with business logic integration
 */

import { BaseCacheService, type CacheConfig } from './base-cache-service';

export interface ProductCacheData {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  category: string;
  status: string;
  featured: boolean;
  isPromotional: boolean;
  images: Array<{ url: string; altText?: string; isPrimary: boolean }>;
  lastUpdated: number;
}

export interface ProductCacheConfig extends CacheConfig {
  enableInventoryTracking?: boolean;
  enablePriceTracking?: boolean;
  maxConcurrentWarmup?: number;
}

/**
 * Enhanced Product Cache Service - Production Ready
 * Following @CLAUDE.md: Extends BaseCacheService for centralized architecture
 */
export class ProductCacheService extends BaseCacheService {
  // Default configuration following production best practices
  private readonly DEFAULT_PRODUCT_CONFIG: Partial<ProductCacheConfig> = {
    ttl: 7200, // 2 hours for product data
    maxKeys: 5000, // Top 5000 frequently accessed products
    keyPrefix: 'product', // Systematic key prefix
    enableCompression: false, // Products have moderate size
    enableInventoryTracking: true,
    enablePriceTracking: true,
    maxConcurrentWarmup: 10, // Batch size for cache warming
  };

  constructor(config?: Partial<ProductCacheConfig>) {
    // Merge configurations following single source of truth principle
    const finalConfig = { ...config?.DEFAULT_PRODUCT_CONFIG, ...config };
    super(finalConfig);
  }

  /**
   * Get cached product data
   * Uses BaseCacheService foundation - eliminates code duplication
   */
  async getCachedProduct(productId: string): Promise<ProductCacheData | null> {
    return await this.getCacheValue<ProductCacheData>(productId);
  }

  /**
   * Set product data in cache
   * Uses BaseCacheService foundation - centralized implementation
   */
  async setCachedProduct(
    productId: string,
    data: ProductCacheData,
    ttl?: number
  ): Promise<void> {
    await this.setCacheValue(productId, data, ttl);
  }

  /**
   * Batch cache multiple products
   * Uses BaseCacheService batch operations - eliminates duplication
   */
  async setCachedProducts(
    productData: Array<{
      productId: string;
      data: ProductCacheData;
      ttl?: number;
    }>
  ): Promise<void> {
    const batchItems = productData.map(({ productId, data, ttl }) => ({
      key: productId,
      value: data,
      ttl,
    }));

    await this.setBatchValues(batchItems);
  }

  /**
   * Fetch product data from database
   * Following existing database patterns - single source of truth
   */
  private async fetchProductFromDatabase(
    productId: string
  ): Promise<ProductCacheData | null> {
    try {
      // Import prisma at runtime to avoid client-side issues
      const { prisma } = await import('@/lib/db/prisma');

      // Query product with necessary relations following existing patterns
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 5, // Limit images for cache efficiency
          },
        },
      });

      if (!product) {
        return null;
      }

      // Transform to cache format following systematic approach
      const productData: ProductCacheData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        regularPrice: Number(product.regularPrice),
        memberPrice: Number(product.memberPrice),
        stockQuantity: product.stockQuantity,
        category: product.categories[0]?.category.name || 'Uncategorized',
        status: product.status,
        featured: product.featured,
        isPromotional: product.isPromotional,
        images: product.images.map(img => ({
          url: img.url,
          altText: img.altText || undefined,
          isPrimary: img.isPrimary,
        })),
        lastUpdated: Date.now(),
      };

      return productData;
    } catch (error) {
      console.error('ProductCacheService: Database fetch failed', error);
      return null;
    }
  }

  /**
   * Get product with cache-through pattern
   * Following plan: Cache-through implementation for optimal performance
   */
  async getProduct(productId: string): Promise<ProductCacheData | null> {
    try {
      // Try cache first
      let cachedProduct = await this.getCachedProduct(productId);

      if (cachedProduct) {
        return cachedProduct;
      }

      // Cache miss - fetch from database
      const productData = await this.fetchProductFromDatabase(productId);

      if (productData) {
        // Cache the result for future requests
        await this.setCachedProduct(productId, productData);
        return productData;
      }

      return null;
    } catch (error) {
      console.error('ProductCacheService: getProduct error', error);
      return null;
    }
  }

  /**
   * Invalidate specific product cache
   * Following plan: Targeted invalidation for data consistency
   */
  async invalidateProduct(productId: string): Promise<void> {
    await this.invalidateCache(productId);
    console.log(`🗑️ Product cache invalidated: ${productId}`);
  }

  /**
   * Batch invalidate multiple products
   * Following @CLAUDE.md: Systematic batch operations
   */
  async invalidateProducts(productIds: string[]): Promise<void> {
    const batchSize = 50;

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(productId => this.invalidateProduct(productId))
      );
    }

    console.log(`🗑️ Batch invalidated ${productIds.length} products`);
  }

  /**
   * Data-driven cache warming for products
   * Following @CLAUDE.md: No hardcoding, systematic approach based on business data
   */
  async warmCache(customProductIds?: string[]): Promise<void> {
    console.log('🔥 Starting data-driven product cache warmup...');

    try {
      let productIds: string[];

      if (customProductIds && customProductIds.length > 0) {
        productIds = customProductIds;
      } else {
        // Get popular products from actual usage data (systematic approach)
        productIds = await this.getPopularProductsFromData();
      }

      if (productIds.length === 0) {
        console.log('📊 No product data available for warmup');
        return;
      }

      console.log(`📊 Warming cache for ${productIds.length} popular products`);
      await this.warmupProducts(productIds);
    } catch (error) {
      console.error('Product cache warmup error:', error);
      throw error;
    }
  }

  /**
   * Get popular products from actual business data
   * Following @CLAUDE.md: Single source of truth, no hardcoding
   */
  private async getPopularProductsFromData(): Promise<string[]> {
    try {
      const { prisma } = await import('@/lib/db/prisma');

      // Query most accessed/ordered products from database
      // This represents actual business usage patterns
      const popularProducts = await prisma.$queryRaw<
        Array<{ product_id: string; usage_count: number }>
      > /*sql*/ `
        SELECT p.id as product_id, COUNT(*) as usage_count
        FROM products p
        LEFT JOIN order_items oi ON oi."productId" = p.id
        LEFT JOIN cart_items ci ON ci."productId" = p.id
        LEFT JOIN wishlist_items wi ON wi."productId" = p.id
        WHERE p.status = 'ACTIVE'
        GROUP BY p.id
        ORDER BY usage_count DESC, p."createdAt" DESC
        LIMIT 100
      `;

      return popularProducts.map(p => p.product_id);
    } catch (error) {
      console.warn(
        'Could not fetch popular products, using featured fallback:',
        error
      );
      return await this.getFeaturedProductsAsFallback();
    }
  }

  /**
   * Get featured products as systematic fallback
   * Following @CLAUDE.md: Systematic fallback approach
   */
  private async getFeaturedProductsAsFallback(): Promise<string[]> {
    try {
      const { prisma } = await import('@/lib/db/prisma');

      const featuredProducts = await prisma.product.findMany({
        where: {
          featured: true,
          status: 'ACTIVE',
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      console.log(
        `🏛️ Using ${featuredProducts.length} featured products for warmup`
      );
      return featuredProducts.map(p => p.id);
    } catch (error) {
      console.error('Could not fetch featured products:', error);
      return [];
    }
  }

  /**
   * Warmup specific products with batching and error handling
   * Following @CLAUDE.md: Systematic batch processing
   */
  private async warmupProducts(productIds: string[]): Promise<void> {
    const batchSize =
      (this.config as ProductCacheConfig).maxConcurrentWarmup || 10;
    let warmedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process in batches for efficiency
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async productId => {
        try {
          // Check if already cached
          const existing = await this.getCachedProduct(productId);
          if (existing) {
            skippedCount++;
            return { status: 'skipped', productId };
          }

          // Fetch from database and cache
          const data = await this.fetchProductFromDatabase(productId);
          if (data) {
            await this.setCachedProduct(productId, data);
            warmedCount++;
            return { status: 'cached', productId, data };
          }

          return { status: 'no_data', productId };
        } catch (error) {
          errorCount++;
          console.warn(`Product cache warmup failed for ${productId}:`, error);
          return { status: 'error', productId, error };
        }
      });

      await Promise.allSettled(batchPromises);

      // Progress logging
      const progress = warmedCount + skippedCount + errorCount;
      console.log(
        `🔥 Product cache warmup progress: ${progress}/${productIds.length} (${warmedCount} cached, ${skippedCount} existing, ${errorCount} errors)`
      );
    }

    console.log(
      `✅ Product cache warmup completed: ${warmedCount} new, ${skippedCount} existing, ${errorCount} errors`
    );
  }

  /**
   * Invalidate products by category
   * Following plan: Pattern-based invalidation for category updates
   */
  async invalidateByCategory(categoryId: string): Promise<void> {
    console.log(`🗑️ Invalidating product cache by category: ${categoryId}`);

    try {
      const { prisma } = await import('@/lib/db/prisma');

      // Get all products in this category
      const categoryProducts = await prisma.productCategory.findMany({
        where: { categoryId },
        select: { productId: true },
      });

      const productIds = categoryProducts.map(pc => pc.productId);

      if (productIds.length > 0) {
        await this.invalidateProducts(productIds);
      }
    } catch (error) {
      console.error('Category-based invalidation error:', error);
      // Fall back to pattern-based invalidation
      await this.invalidateCache(`*${categoryId}*`);
    }
  }

  /**
   * Update product inventory in cache
   * Following plan: Real-time inventory sync
   */
  async updateInventory(productId: string, newQuantity: number): Promise<void> {
    try {
      const cachedProduct = await this.getCachedProduct(productId);

      if (cachedProduct) {
        // Update cached inventory
        const updatedProduct: ProductCacheData = {
          ...cachedProduct,
          stockQuantity: newQuantity,
          lastUpdated: Date.now(),
        };

        await this.setCachedProduct(productId, updatedProduct);
        console.log(
          `📦 Updated inventory for product ${productId}: ${newQuantity}`
        );
      }
    } catch (error) {
      console.error('Inventory update error:', error);
    }
  }

  /**
   * Update product pricing in cache
   * Following plan: Real-time price sync
   */
  async updatePricing(
    productId: string,
    regularPrice: number,
    memberPrice: number
  ): Promise<void> {
    try {
      const cachedProduct = await this.getCachedProduct(productId);

      if (cachedProduct) {
        // Update cached pricing
        const updatedProduct: ProductCacheData = {
          ...cachedProduct,
          regularPrice,
          memberPrice,
          lastUpdated: Date.now(),
        };

        await this.setCachedProduct(productId, updatedProduct);
        console.log(
          `💰 Updated pricing for product ${productId}: regular=${regularPrice}, member=${memberPrice}`
        );
      }
    } catch (error) {
      console.error('Pricing update error:', error);
    }
  }

  /**
   * Get cache health metrics specific to products
   * Following plan: Product-specific monitoring
   */
  async getProductCacheHealth(): Promise<{
    totalProducts: number;
    activeProducts: number;
    averageAge: number;
    lowStockCount: number;
  }> {
    try {
      let totalProducts = 0;
      let activeProducts = 0;
      let totalAge = 0;
      let lowStockCount = 0;
      const now = Date.now();

      if (this.isRedisAvailable && this.redis) {
        // Get Redis product keys
        const keys = await this.redis.keys(`${this.config.keyPrefix}:*`);
        totalProducts = keys.length;

        for (const key of keys.slice(0, 100)) {
          // Sample first 100 for performance
          try {
            const cached = await this.redis.get(key);
            if (cached) {
              const product: ProductCacheData = JSON.parse(cached);
              if (product.lastUpdated) {
                activeProducts++;
                totalAge += now - product.lastUpdated;
                if (product.stockQuantity <= 10) {
                  lowStockCount++;
                }
              }
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      } else {
        // Use fallback cache
        totalProducts = this.fallbackCache.size;
        this.fallbackCache.forEach(item => {
          if (item.data && typeof item.data === 'object') {
            const product = item.data as ProductCacheData;
            if (product.lastUpdated) {
              activeProducts++;
              totalAge += now - product.lastUpdated;
              if (product.stockQuantity <= 10) {
                lowStockCount++;
              }
            }
          }
        });
      }

      const averageAge =
        activeProducts > 0
          ? Math.round(totalAge / activeProducts / 1000 / 60)
          : 0; // Average age in minutes

      return {
        totalProducts,
        activeProducts,
        averageAge,
        lowStockCount,
      };
    } catch (error) {
      console.error('Product cache health check error:', error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        averageAge: 0,
        lowStockCount: 0,
      };
    }
  }
}

// Export cache service for use in product APIs
export default ProductCacheService;
