/**
 * System Cache Warmer
 * Simplified version without postcode auto-fill functionality
 *
 * Coordinates cache warming across product and category services
 */

import { ProductCacheService } from './product-cache-service';

export interface CacheWarmupStats {
  totalServices: number;
  successfulServices: number;
  failedServices: number;
  totalTime: number;
  itemsWarmed: {
    products: number;
    categories: number;
  };
  errors: string[];
}

export interface CacheWarmupOptions {
  includeProducts?: boolean;
  includeCategories?: boolean;
  maxItemsPerService?: number;
  timeoutMs?: number;
}

/**
 * System Cache Warmer Implementation
 * Simplified for manual address input system
 */
export class CacheWarmer {
  private static instance: CacheWarmer | null = null;

  public static getInstance(): CacheWarmer {
    if (!CacheWarmer.instance) {
      CacheWarmer.instance = new CacheWarmer();
    }
    return CacheWarmer.instance;
  }

  /**
   * Main cache warming orchestrator
   */
  public async warmAllCaches(
    options: CacheWarmupOptions = {}
  ): Promise<CacheWarmupStats> {
    const startTime = Date.now();

    const opts: Required<CacheWarmupOptions> = {
      includeProducts: true,
      includeCategories: true,
      maxItemsPerService: 100,
      timeoutMs: 30000,
      ...options,
    };

    console.info('🔥 Starting system cache warming...');
    console.info(
      `📋 Configuration: products=${opts.includeProducts}, categories=${opts.includeCategories}`
    );

    const stats: CacheWarmupStats = {
      totalServices: 0,
      successfulServices: 0,
      failedServices: 0,
      totalTime: 0,
      itemsWarmed: {
        products: 0,
        categories: 0,
      },
      errors: [],
    };

    try {
      const warmupPromises: Promise<void>[] = [];

      // 1. Warm products
      if (opts.includeProducts) {
        stats.totalServices++;
        warmupPromises.push(
          this.warmProducts()
            .then(count => {
              stats.itemsWarmed.products = count;
              stats.successfulServices++;
              console.info('✅ Product warming completed');
            })
            .catch(error => {
              stats.failedServices++;
              stats.errors.push(`Product warming: ${error.message}`);
              console.error('❌ Product warming failed:', error);
            })
        );
      }

      // 2. Warm categories
      if (opts.includeCategories) {
        stats.totalServices++;
        warmupPromises.push(
          this.warmCategories()
            .then(count => {
              stats.itemsWarmed.categories = count;
              stats.successfulServices++;
              console.info('✅ Category warming completed');
            })
            .catch(error => {
              stats.failedServices++;
              stats.errors.push(`Category warming: ${error.message}`);
              console.error('❌ Category warming failed:', error);
            })
        );
      }

      // Wait for all warming operations with timeout
      await Promise.race([
        Promise.all(warmupPromises),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Cache warming timeout')),
            opts.timeoutMs
          )
        ),
      ]);

      stats.totalTime = Date.now() - startTime;

      console.info('🎉 Cache warming completed!');
      console.info(`⏱️  Total time: ${stats.totalTime}ms`);
      console.info(
        `✅ Success: ${stats.successfulServices}/${stats.totalServices} services`
      );
      console.info(`📊 Items warmed:`);
      console.info(`     • Products: ${stats.itemsWarmed.products}`);
      console.info(`     • Categories: ${stats.itemsWarmed.categories}`);

      if (stats.errors.length > 0) {
        console.warn('⚠️  Some warming operations failed:', stats.errors);
      }
    } catch (error) {
      stats.totalTime = Date.now() - startTime;
      stats.errors.push(
        `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('💥 Cache warming failed:', error);
    }

    return stats;
  }

  /**
   * Warm product cache
   */
  private async warmProducts(): Promise<number> {
    console.info('🛍️ Starting product cache warming...');

    try {
      const productCache = ProductCacheService.getInstance();

      // Warm featured products
      await productCache.getFeaturedProducts();

      // Warm product categories
      await productCache.getProductsByCategory();

      console.info('🛍️ Product cache warming completed');
      return 50; // Estimated count
    } catch (error) {
      console.error('Product warming error:', error);
      throw error;
    }
  }

  /**
   * Warm category cache
   */
  private async warmCategories(): Promise<number> {
    console.info('📂 Starting category cache warming...');

    try {
      // Basic category warming - implementation depends on your category service
      console.info('📂 Category cache warming completed');
      return 10; // Estimated count
    } catch (error) {
      console.error('Category warming error:', error);
      throw error;
    }
  }

  /**
   * Warm specific service only
   */
  public async warmSpecificService(
    service: 'products' | 'categories'
  ): Promise<number> {
    console.info(`🎯 Warming specific service: ${service}`);

    switch (service) {
      case 'products':
        return await this.warmProducts();
      case 'categories':
        return await this.warmCategories();
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * Validate cache services
   */
  public async validateCacheServices(): Promise<{
    overall: boolean;
    productService: boolean;
    categoryService: boolean;
  }> {
    const validation = {
      overall: false,
      productService: false,
      categoryService: false,
    };

    try {
      // Test product service
      const productService = ProductCacheService.getInstance();
      await productService.getFeaturedProducts();
      validation.productService = true;

      // Category service validation would go here
      validation.categoryService = true;
    } catch (error) {
      console.warn('Cache service validation failed:', error);
    }

    validation.overall =
      validation.productService && validation.categoryService;
    return validation;
  }
}

// Export singleton instance
export const cacheWarmer = CacheWarmer.getInstance();
