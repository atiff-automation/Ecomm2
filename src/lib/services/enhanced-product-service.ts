/**
 * Enhanced Product Service - Malaysian E-commerce Platform
 * Advanced caching with Redis and intelligent cache strategies
 */

import { apiClient } from './api-client';
import {
  APIResponse,
  ProductResponse,
  ProductListParams,
  ReviewResponse,
  CreateReviewRequest,
  PaginationMeta,
} from '@/lib/types/api';
import { cacheManager } from '@/lib/cache/cache-manager';
import {
  Cached,
  InvalidateCache,
  createCacheKey,
  CacheWarmer,
} from '@/lib/cache/cache-decorators';

export interface ProductListResponse {
  products: ProductResponse[];
  pagination: PaginationMeta;
}

export interface ProductSearchOptions extends ProductListParams {
  includeOutOfStock?: boolean;
  onlyFeatured?: boolean;
  memberOnly?: boolean;
  categoryPath?: string;
}

export class EnhancedProductService {
  private static instance: EnhancedProductService;

  private constructor() {
    // Register cache warming tasks
    this.registerCacheWarmingTasks();
  }

  static getInstance(): EnhancedProductService {
    if (!EnhancedProductService.instance) {
      EnhancedProductService.instance = new EnhancedProductService();
    }
    return EnhancedProductService.instance;
  }

  /**
   * Get paginated list of products with advanced caching
   */
  @Cached({
    strategy: 'products',
    ttl: 1800, // 30 minutes
    keyGenerator: (params: ProductListParams = {}) =>
      createCacheKey('products', 'list', params),
    tags: ['products', 'catalog'],
  })
  async getProducts(
    params: ProductListParams = {}
  ): Promise<ProductListResponse> {
    try {
      const queryParams = this.buildProductQueryParams(params);
      const endpoint = `/api/products?${queryParams.toString()}`;

      const response = await apiClient.get<ProductListResponse>(endpoint, {
        cache: true,
        cacheTTL: 30 * 60 * 1000, // 30 minutes for API client cache
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch products');
    } catch (error) {
      console.error('EnhancedProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get single product with aggressive caching
   */
  @Cached({
    strategy: 'products',
    ttl: 3600, // 1 hour for individual products
    keyGenerator: (slugOrId: string) =>
      createCacheKey('products', 'single', { slugOrId }),
    tags: ['products', 'product-details'],
  })
  async getProduct(slugOrId: string): Promise<ProductResponse> {
    try {
      const response = await apiClient.get<{ product: ProductResponse }>(
        `/api/products/${slugOrId}`,
        {
          cache: true,
          cacheTTL: 60 * 60 * 1000, // 1 hour
        }
      );

      if (response.success && response.data) {
        return response.data.product;
      }

      throw new Error(response.error || 'Product not found');
    } catch (error) {
      console.error('EnhancedProductService.getProduct error:', error);
      throw error;
    }
  }

  /**
   * Get featured products with long-term caching
   */
  @Cached({
    strategy: 'products',
    ttl: 7200, // 2 hours for featured products
    keyGenerator: (limit?: number) =>
      createCacheKey('products', 'featured', { limit }),
    tags: ['products', 'featured'],
  })
  async getFeaturedProducts(limit = 10): Promise<ProductResponse[]> {
    return this.getProducts({
      featured: true,
      limit,
      sortBy: 'featured',
      sortOrder: 'desc',
    }).then(response => response.products);
  }

  /**
   * Search products with intelligent caching
   */
  @Cached({
    strategy: 'search',
    ttl: 900, // 15 minutes for search results
    keyGenerator: (query: string, options: ProductSearchOptions = {}) =>
      createCacheKey('search', 'products', { query, ...options }),
    tags: ['search', 'products'],
    condition: (query: string) => query.length >= 3, // Only cache searches with 3+ chars
  })
  async searchProducts(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductListResponse> {
    const searchParams = {
      ...options,
      search: query,
    };

    return this.getProducts(searchParams);
  }

  /**
   * Get products by category with category-specific caching
   */
  @Cached({
    strategy: 'products',
    ttl: 2700, // 45 minutes
    keyGenerator: (categoryId: string, params: ProductListParams = {}) =>
      createCacheKey('products', 'category', { categoryId, ...params }),
    tags: ['products', 'categories'],
  })
  async getProductsByCategory(
    categoryId: string,
    params: ProductListParams = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({
      ...params,
      category: categoryId,
    });
  }

  /**
   * Get related products with smart caching
   */
  @Cached({
    strategy: 'products',
    ttl: 5400, // 90 minutes
    keyGenerator: (productId: string, limit?: number) =>
      createCacheKey('products', 'related', { productId, limit }),
    tags: ['products', 'recommendations'],
  })
  async getRelatedProducts(
    productId: string,
    limit = 6
  ): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<{ products: ProductResponse[] }>(
        `/api/products/${productId}/related?limit=${limit}`,
        {
          cache: true,
          cacheTTL: 90 * 60 * 1000, // 90 minutes
        }
      );

      if (response.success && response.data) {
        return response.data.products;
      }

      return [];
    } catch (error) {
      console.error('EnhancedProductService.getRelatedProducts error:', error);
      return [];
    }
  }

  /**
   * Get product reviews with pagination caching
   */
  @Cached({
    strategy: 'products',
    ttl: 1800, // 30 minutes
    keyGenerator: (productId: string, page = 1, limit = 10) =>
      createCacheKey('reviews', 'product', { productId, page, limit }),
    tags: ['reviews', 'products'],
  })
  async getProductReviews(
    productId: string,
    page = 1,
    limit = 10
  ): Promise<{ reviews: ReviewResponse[]; pagination: PaginationMeta }> {
    try {
      const response = await apiClient.get<{
        reviews: ReviewResponse[];
        pagination: PaginationMeta;
      }>(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`);

      if (response.success && response.data) {
        return response.data;
      }

      return {
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error) {
      console.error('EnhancedProductService.getProductReviews error:', error);
      return {
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  /**
   * Create product review with cache invalidation
   */
  @InvalidateCache({
    tags: ['reviews', 'products'],
    patterns: ['reviews:product:*', 'products:single:*'],
  })
  async createReview(
    productId: string,
    reviewData: CreateReviewRequest
  ): Promise<ReviewResponse> {
    try {
      const response = await apiClient.post<{ review: ReviewResponse }>(
        `/api/products/${productId}/reviews`,
        reviewData
      );

      if (response.success && response.data) {
        return response.data.review;
      }

      throw new Error(response.error || 'Failed to create review');
    } catch (error) {
      console.error('EnhancedProductService.createReview error:', error);
      throw error;
    }
  }

  /**
   * Get product availability with short-term caching
   */
  @Cached({
    strategy: 'api', // Memory cache for fast access
    ttl: 300, // 5 minutes - frequent updates for stock
    keyGenerator: (productId: string) =>
      createCacheKey('products', 'availability', { productId }),
    tags: ['inventory', 'products'],
  })
  async getProductAvailability(productId: string): Promise<{
    inStock: boolean;
    stockQuantity: number;
    lowStockAlert: boolean;
  }> {
    try {
      const response = await apiClient.get<{
        inStock: boolean;
        stockQuantity: number;
        lowStockAlert: boolean;
      }>(`/api/products/${productId}/availability`);

      if (response.success && response.data) {
        return response.data;
      }

      return { inStock: false, stockQuantity: 0, lowStockAlert: false };
    } catch (error) {
      console.error(
        'EnhancedProductService.getProductAvailability error:',
        error
      );
      return { inStock: false, stockQuantity: 0, lowStockAlert: false };
    }
  }

  /**
   * Get product price history with long-term caching
   */
  @Cached({
    strategy: 'products',
    ttl: 21600, // 6 hours
    keyGenerator: (productId: string, days = 30) =>
      createCacheKey('products', 'price-history', { productId, days }),
    tags: ['products', 'pricing'],
  })
  async getProductPriceHistory(
    productId: string,
    days = 30
  ): Promise<
    Array<{
      date: string;
      regularPrice: number;
      memberPrice: number;
      promotionalPrice?: number;
    }>
  > {
    try {
      const response = await apiClient.get<{
        priceHistory: Array<{
          date: string;
          regularPrice: number;
          memberPrice: number;
          promotionalPrice?: number;
        }>;
      }>(`/api/products/${productId}/price-history?days=${days}`);

      if (response.success && response.data) {
        return response.data.priceHistory;
      }

      return [];
    } catch (error) {
      console.error(
        'EnhancedProductService.getProductPriceHistory error:',
        error
      );
      return [];
    }
  }

  /**
   * Get recently viewed products for user
   */
  async getRecentlyViewedProducts(
    userId: string,
    limit = 10
  ): Promise<ProductResponse[]> {
    const cacheKey = createCacheKey('products', 'recent', { userId, limit });

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await apiClient.get<{ products: ProductResponse[] }>(
            `/api/users/${userId}/recently-viewed?limit=${limit}`
          );

          return response.success && response.data
            ? response.data.products
            : [];
        } catch (error) {
          console.error(
            'EnhancedProductService.getRecentlyViewedProducts error:',
            error
          );
          return [];
        }
      },
      { strategy: 'api', ttl: 600 } // 10 minutes
    );
  }

  /**
   * Track product view with cache warming
   */
  @InvalidateCache({
    patterns: ['products:recent:*'],
    tags: ['user-activity'],
  })
  async trackProductView(userId: string, productId: string): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/viewed-products`, {
        productId,
        timestamp: new Date().toISOString(),
      });

      // Warm cache for this user's recent products
      setTimeout(() => {
        this.getRecentlyViewedProducts(userId);
      }, 100);
    } catch (error) {
      console.error('EnhancedProductService.trackProductView error:', error);
      // Don't throw - tracking is non-critical
    }
  }

  /**
   * Get top-selling products with daily caching
   */
  @Cached({
    strategy: 'products',
    ttl: 86400, // 24 hours
    keyGenerator: (period = '7d', limit = 20) =>
      createCacheKey('products', 'top-selling', { period, limit }),
    tags: ['products', 'analytics'],
  })
  async getTopSellingProducts(
    period = '7d',
    limit = 20
  ): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<{ products: ProductResponse[] }>(
        `/api/analytics/top-selling-products?period=${period}&limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data.products;
      }

      return [];
    } catch (error) {
      console.error(
        'EnhancedProductService.getTopSellingProducts error:',
        error
      );
      return [];
    }
  }

  /**
   * Build query parameters for product requests
   */
  private buildProductQueryParams(params: ProductListParams): URLSearchParams {
    const queryParams = new URLSearchParams();

    // Add pagination
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    // Add search and filters
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.category) {
      queryParams.append('category', params.category);
    }
    if (params.featured !== undefined) {
      queryParams.append('featured', params.featured.toString());
    }
    if (params.inStock !== undefined) {
      queryParams.append('inStock', params.inStock.toString());
    }

    // Add sorting
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    // Add price range
    if (params.priceMin !== undefined) {
      queryParams.append('priceMin', params.priceMin.toString());
    }
    if (params.priceMax !== undefined) {
      queryParams.append('priceMax', params.priceMax.toString());
    }

    return queryParams;
  }

  /**
   * Register cache warming tasks
   */
  private registerCacheWarmingTasks(): void {
    // Warm up featured products
    CacheWarmer.register('featured-products', async () => {
      await this.getFeaturedProducts(20);
      console.log('✅ Featured products cache warmed');
    });

    // Warm up categories
    CacheWarmer.register('product-categories', async () => {
      // This would typically fetch main categories and their popular products
      const mainCategories = ['electronics', 'fashion', 'home', 'books'];

      await Promise.all(
        mainCategories.map(async categoryId => {
          await this.getProductsByCategory(categoryId, { limit: 10 });
        })
      );

      console.log('✅ Product categories cache warmed');
    });

    // Warm up top-selling products
    CacheWarmer.register('top-selling-products', async () => {
      await this.getTopSellingProducts('7d', 50);
      console.log('✅ Top-selling products cache warmed');
    });
  }

  /**
   * Invalidate all product-related cache
   */
  async invalidateProductCache(): Promise<void> {
    await cacheManager.invalidateByTags(['products']);
    console.log('🗑️ Product cache invalidated');
  }

  /**
   * Invalidate specific product cache
   */
  async invalidateProductCache(productId: string): Promise<void> {
    const patterns = [
      `products:single:*${productId}*`,
      `products:related:*${productId}*`,
      `reviews:product:*${productId}*`,
    ];

    await Promise.all(
      patterns.map(pattern => cacheManager.clearByPattern(pattern))
    );

    console.log(`🗑️ Product ${productId} cache invalidated`);
  }

  /**
   * Get cache statistics for products
   */
  async getCacheStats() {
    const stats = await cacheManager.getStats();
    return {
      ...stats,
      productSpecific: {
        // Add product-specific cache metrics here
        estimatedProductsInCache: Math.floor(stats.redis.keys * 0.3), // Rough estimate
      },
    };
  }
}

// Export singleton instance
export const enhancedProductService = EnhancedProductService.getInstance();
