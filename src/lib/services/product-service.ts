/**
 * Centralized Product Service - Malaysian E-commerce Platform
 * Single source of truth for ALL product-related operations
 *
 * This service consolidates all product API calls and business logic
 * that were previously scattered across 20+ components.
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

export interface ProductListResponse {
  products: ProductResponse[];
  pagination: PaginationMeta;
}

export interface ProductSearchOptions extends ProductListParams {
  // Additional search-specific options
  includeOutOfStock?: boolean;
  onlyFeatured?: boolean;
  memberOnly?: boolean;
  categoryPath?: string;
}

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  ratings: number[];
  availability: ('in-stock' | 'out-of-stock')[];
  features: ('featured' | 'promotional' | 'member-qualifying')[];
}

export interface RelatedProductsOptions {
  limit?: number;
  excludeOutOfStock?: boolean;
  sameCategoryOnly?: boolean;
  includePromotional?: boolean;
}

export class ProductService {
  private static instance: ProductService;
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  /**
   * Get paginated list of products with filters and search
   */
  async getProducts(
    params: ProductListParams = {}
  ): Promise<ProductListResponse> {
    const cacheKey = `products:${JSON.stringify(params)}`;
    const cached = this.getFromCache<ProductListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
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

      const endpoint = `/api/products?${queryParams.toString()}`;
      const response = await apiClient.get<ProductListResponse>(endpoint);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch products');
    } catch (error) {
      console.error('ProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get single product by slug or ID
   */
  async getProduct(slugOrId: string): Promise<ProductResponse> {
    const cacheKey = `product:${slugOrId}`;
    const cached = this.getFromCache<ProductResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.get<{ product: ProductResponse }>(
        `/api/products/${slugOrId}`
      );

      if (response.success && response.data?.product) {
        this.setCache(cacheKey, response.data.product);
        return response.data.product;
      }

      throw new Error(response.error || 'Product not found');
    } catch (error) {
      console.error('ProductService.getProduct error:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<ProductResponse[]> {
    const cacheKey = `featured-products:${limit}`;
    const cached = this.getFromCache<ProductResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.getProducts({
        featured: true,
        limit,
        sortBy: 'created',
        sortOrder: 'desc',
      });

      this.setCache(cacheKey, result.products);
      return result.products;
    } catch (error) {
      console.error('ProductService.getFeaturedProducts error:', error);
      throw error;
    }
  }

  /**
   * Get promotional products
   */
  async getPromotionalProducts(limit: number = 8): Promise<ProductResponse[]> {
    const cacheKey = `promotional-products:${limit}`;
    const cached = this.getFromCache<ProductResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.getProducts({
        features: ['promotional'],
        limit,
        sortBy: 'created',
        sortOrder: 'desc',
      });

      this.setCache(cacheKey, result.products, this.DEFAULT_CACHE_TTL);
      return result.products;
    } catch (error) {
      console.error('ProductService.getPromotionalProducts error:', error);
      throw error;
    }
  }

  /**
   * Search products with advanced options
   */
  async searchProducts(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductListResponse> {
    const params: ProductListParams = {
      search: query,
      ...options,
    };

    return this.getProducts(params);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    params: Omit<ProductListParams, 'category'> = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({
      ...params,
      category: categoryId,
    });
  }

  /**
   * Get related products for a specific product
   */
  async getRelatedProducts(
    productId: string,
    options: RelatedProductsOptions = {}
  ): Promise<ProductResponse[]> {
    const cacheKey = `related-products:${productId}:${JSON.stringify(options)}`;
    const cached = this.getFromCache<ProductResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (options.limit) {
        queryParams.append('limit', options.limit.toString());
      }
      if (options.excludeOutOfStock) {
        queryParams.append('excludeOutOfStock', 'true');
      }
      if (options.sameCategoryOnly) {
        queryParams.append('sameCategoryOnly', 'true');
      }
      if (options.includePromotional) {
        queryParams.append('includePromotional', 'true');
      }

      const endpoint = `/api/products/${productId}/related?${queryParams.toString()}`;
      const response = await apiClient.get<{ products: ProductResponse[] }>(
        endpoint
      );

      if (response.success && response.data?.products) {
        this.setCache(cacheKey, response.data.products);
        return response.data.products;
      }

      return []; // Return empty array if no related products
    } catch (error) {
      console.error('ProductService.getRelatedProducts error:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get product reviews
   */
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: ReviewResponse[]; pagination: PaginationMeta }> {
    const cacheKey = `product-reviews:${productId}:${page}:${limit}`;
    const cached = this.getFromCache<{
      reviews: ReviewResponse[];
      pagination: PaginationMeta;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const endpoint = `/api/products/${productId}/reviews?${queryParams.toString()}`;
      const response = await apiClient.get<{
        reviews: ReviewResponse[];
        pagination: PaginationMeta;
      }>(endpoint);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 2 * 60 * 1000); // Cache for 2 minutes
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch reviews');
    } catch (error) {
      console.error('ProductService.getProductReviews error:', error);
      throw error;
    }
  }

  /**
   * Create product review
   */
  async createReview(reviewData: CreateReviewRequest): Promise<ReviewResponse> {
    try {
      const response = await apiClient.post<{ review: ReviewResponse }>(
        '/api/reviews',
        reviewData
      );

      if (response.success && response.data?.review) {
        // Invalidate related caches
        this.invalidateReviewCaches(reviewData.productId);
        return response.data.review;
      }

      throw new Error(response.error || 'Failed to create review');
    } catch (error) {
      console.error('ProductService.createReview error:', error);
      throw error;
    }
  }

  /**
   * Get available product filters for current search/category
   */
  async getProductFilters(
    params: ProductListParams = {}
  ): Promise<ProductFilters> {
    const cacheKey = `product-filters:${JSON.stringify(params)}`;
    const cached = this.getFromCache<ProductFilters>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.category) {
        queryParams.append('category', params.category);
      }

      const endpoint = `/api/products/filters?${queryParams.toString()}`;
      const response = await apiClient.get<ProductFilters>(endpoint);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 10 * 60 * 1000); // Cache for 10 minutes
        return response.data;
      }

      // Return default filters if API fails
      return {
        categories: [],
        priceRange: [0, 1000],
        ratings: [1, 2, 3, 4, 5],
        availability: ['in-stock', 'out-of-stock'],
        features: ['featured', 'promotional', 'member-qualifying'],
      };
    } catch (error) {
      console.error('ProductService.getProductFilters error:', error);
      // Return default filters on error
      return {
        categories: [],
        priceRange: [0, 1000],
        ratings: [1, 2, 3, 4, 5],
        availability: ['in-stock', 'out-of-stock'],
        features: ['featured', 'promotional', 'member-qualifying'],
      };
    }
  }

  /**
   * Check product availability
   */
  async checkAvailability(
    productId: string,
    quantity: number = 1
  ): Promise<{
    available: boolean;
    stockQuantity: number;
    maxQuantity: number;
  }> {
    try {
      const response = await apiClient.get<{
        available: boolean;
        stockQuantity: number;
        maxQuantity: number;
      }>(`/api/products/${productId}/availability?quantity=${quantity}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to check availability');
    } catch (error) {
      console.error('ProductService.checkAvailability error:', error);
      throw error;
    }
  }

  /**
   * Get product recommendations based on user behavior
   */
  async getRecommendations(
    type: 'general' | 'user-based' | 'trending' = 'general',
    limit: number = 8
  ): Promise<ProductResponse[]> {
    const cacheKey = `recommendations:${type}:${limit}`;
    const cached = this.getFromCache<ProductResponse[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams({
        type,
        limit: limit.toString(),
      });

      const endpoint = `/api/products/recommendations?${queryParams.toString()}`;
      const response = await apiClient.get<{ products: ProductResponse[] }>(
        endpoint
      );

      if (response.success && response.data?.products) {
        this.setCache(cacheKey, response.data.products, 15 * 60 * 1000); // Cache for 15 minutes
        return response.data.products;
      }

      return [];
    } catch (error) {
      console.error('ProductService.getRecommendations error:', error);
      return [];
    }
  }

  /**
   * Track product view for analytics and recommendations
   */
  async trackProductView(productId: string): Promise<void> {
    try {
      // Fire and forget - don't wait for response
      apiClient
        .post('/api/analytics/product-view', { productId })
        .catch(error => {
          console.warn('Failed to track product view:', error);
        });
    } catch (error) {
      // Silently fail - analytics shouldn't break user experience
      console.warn('ProductService.trackProductView error:', error);
    }
  }

  /**
   * Cache management methods
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private setCache<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_CACHE_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateReviewCaches(productId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (
        key.includes(`product-reviews:${productId}`) ||
        key.includes(`product:${productId}`)
      ) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const productService = ProductService.getInstance();
