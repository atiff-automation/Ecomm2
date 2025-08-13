/**
 * Centralized Category Service - Malaysian E-commerce Platform
 * Single source of truth for ALL category-related operations
 * 
 * This service consolidates all category API calls and business logic
 * that were previously scattered across multiple components.
 */

import { apiClient } from './api-client';
import { APIResponse, CategoryResponse } from '@/lib/types/api';

export interface CategoryListOptions {
  includeProductCount?: boolean;
  includeChildren?: boolean;
  parentId?: string | null;
  onlyActive?: boolean;
  sortBy?: 'name' | 'productCount' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryHierarchy extends CategoryResponse {
  children: CategoryHierarchy[];
  level: number;
  path: string[];
}

export interface CategoryWithProducts extends CategoryResponse {
  featuredProducts?: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
  }[];
}

export class CategoryService {
  private static instance: CategoryService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes (categories change less frequently)

  private constructor() {}

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  /**
   * Get all categories with optional filtering and hierarchy
   */
  async getCategories(options: CategoryListOptions = {}): Promise<CategoryResponse[]> {
    const cacheKey = `categories:${JSON.stringify(options)}`;
    const cached = this.getFromCache<CategoryResponse[]>(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams();
      
      if (options.includeProductCount) queryParams.append('includeProductCount', 'true');
      if (options.includeChildren) queryParams.append('includeChildren', 'true');
      if (options.parentId !== undefined) {
        queryParams.append('parentId', options.parentId || 'null');
      }
      if (options.onlyActive) queryParams.append('onlyActive', 'true');
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const endpoint = `/api/categories?${queryParams.toString()}`;
      const response = await apiClient.get<{ categories: CategoryResponse[] }>(endpoint);

      if (response.success && response.data?.categories) {
        this.setCache(cacheKey, response.data.categories);
        return response.data.categories;
      }

      throw new Error(response.error || 'Failed to fetch categories');
    } catch (error) {
      console.error('CategoryService.getCategories error:', error);
      throw error;
    }
  }

  /**
   * Get single category by slug or ID
   */
  async getCategory(slugOrId: string): Promise<CategoryResponse> {
    const cacheKey = `category:${slugOrId}`;
    const cached = this.getFromCache<CategoryResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<{ category: CategoryResponse }>(`/api/categories/${slugOrId}`);

      if (response.success && response.data?.category) {
        this.setCache(cacheKey, response.data.category);
        return response.data.category;
      }

      throw new Error(response.error || 'Category not found');
    } catch (error) {
      console.error('CategoryService.getCategory error:', error);
      throw error;
    }
  }

  /**
   * Get category with featured products
   */
  async getCategoryWithProducts(
    slugOrId: string,
    productLimit: number = 8
  ): Promise<CategoryWithProducts> {
    const cacheKey = `category-with-products:${slugOrId}:${productLimit}`;
    const cached = this.getFromCache<CategoryWithProducts>(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams({
        includeProducts: 'true',
        productLimit: productLimit.toString()
      });

      const endpoint = `/api/categories/${slugOrId}?${queryParams.toString()}`;
      const response = await apiClient.get<{ category: CategoryWithProducts }>(endpoint);

      if (response.success && response.data?.category) {
        this.setCache(cacheKey, response.data.category, 5 * 60 * 1000); // Shorter cache for product data
        return response.data.category;
      }

      throw new Error(response.error || 'Category not found');
    } catch (error) {
      console.error('CategoryService.getCategoryWithProducts error:', error);
      throw error;
    }
  }

  /**
   * Get root categories (top-level categories without parent)
   */
  async getRootCategories(includeProductCount: boolean = true): Promise<CategoryResponse[]> {
    return this.getCategories({
      parentId: null,
      includeProductCount,
      onlyActive: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }

  /**
   * Get category hierarchy as a tree structure
   */
  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const cacheKey = 'category-hierarchy';
    const cached = this.getFromCache<CategoryHierarchy[]>(cacheKey);
    if (cached) return cached;

    try {
      const allCategories = await this.getCategories({
        includeChildren: true,
        includeProductCount: true,
        onlyActive: true
      });

      const hierarchy = this.buildCategoryTree(allCategories);
      this.setCache(cacheKey, hierarchy, 15 * 60 * 1000); // Cache for 15 minutes
      return hierarchy;
    } catch (error) {
      console.error('CategoryService.getCategoryHierarchy error:', error);
      throw error;
    }
  }

  /**
   * Get category breadcrumb path
   */
  async getCategoryBreadcrumb(slugOrId: string): Promise<CategoryResponse[]> {
    const cacheKey = `category-breadcrumb:${slugOrId}`;
    const cached = this.getFromCache<CategoryResponse[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<{ breadcrumb: CategoryResponse[] }>(`/api/categories/${slugOrId}/breadcrumb`);

      if (response.success && response.data?.breadcrumb) {
        this.setCache(cacheKey, response.data.breadcrumb);
        return response.data.breadcrumb;
      }

      // Fallback: try to build breadcrumb from hierarchy
      const category = await this.getCategory(slugOrId);
      return [category]; // Return at least the current category
    } catch (error) {
      console.error('CategoryService.getCategoryBreadcrumb error:', error);
      throw error;
    }
  }

  /**
   * Get child categories for a specific category
   */
  async getChildCategories(
    parentSlugOrId: string,
    includeProductCount: boolean = true
  ): Promise<CategoryResponse[]> {
    return this.getCategories({
      parentId: parentSlugOrId,
      includeProductCount,
      onlyActive: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<CategoryResponse[]> {
    const cacheKey = `category-search:${query}`;
    const cached = this.getFromCache<CategoryResponse[]>(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams({
        search: query,
        includeProductCount: 'true'
      });

      const endpoint = `/api/categories/search?${queryParams.toString()}`;
      const response = await apiClient.get<{ categories: CategoryResponse[] }>(endpoint);

      if (response.success && response.data?.categories) {
        this.setCache(cacheKey, response.data.categories, 5 * 60 * 1000); // Shorter cache for searches
        return response.data.categories;
      }

      return [];
    } catch (error) {
      console.error('CategoryService.searchCategories error:', error);
      return [];
    }
  }

  /**
   * Get popular categories based on product views/purchases
   */
  async getPopularCategories(limit: number = 6): Promise<CategoryResponse[]> {
    const cacheKey = `popular-categories:${limit}`;
    const cached = this.getFromCache<CategoryResponse[]>(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        includeProductCount: 'true'
      });

      const endpoint = `/api/categories/popular?${queryParams.toString()}`;
      const response = await apiClient.get<{ categories: CategoryResponse[] }>(endpoint);

      if (response.success && response.data?.categories) {
        this.setCache(cacheKey, response.data.categories, 20 * 60 * 1000); // Cache for 20 minutes
        return response.data.categories;
      }

      // Fallback: return root categories sorted by product count
      const rootCategories = await this.getRootCategories(true);
      return rootCategories
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('CategoryService.getPopularCategories error:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<{
    totalCategories: number;
    rootCategories: number;
    averageProductsPerCategory: number;
    mostPopularCategory: CategoryResponse | null;
  }> {
    const cacheKey = 'category-stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<{
        totalCategories: number;
        rootCategories: number;
        averageProductsPerCategory: number;
        mostPopularCategory: CategoryResponse | null;
      }>('/api/categories/stats');

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 30 * 60 * 1000); // Cache for 30 minutes
        return response.data;
      }

      // Fallback: calculate basic stats
      const allCategories = await this.getCategories({ includeProductCount: true });
      const rootCategories = allCategories.filter(cat => !cat.parentId);
      const totalProducts = allCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
      const mostPopular = allCategories.reduce((max, cat) => 
        (cat.productCount || 0) > (max?.productCount || 0) ? cat : max, null as CategoryResponse | null);

      const stats = {
        totalCategories: allCategories.length,
        rootCategories: rootCategories.length,
        averageProductsPerCategory: allCategories.length > 0 ? totalProducts / allCategories.length : 0,
        mostPopularCategory: mostPopular
      };

      this.setCache(cacheKey, stats, 30 * 60 * 1000);
      return stats;
    } catch (error) {
      console.error('CategoryService.getCategoryStats error:', error);
      throw error;
    }
  }

  /**
   * Build category tree from flat array
   */
  private buildCategoryTree(categories: CategoryResponse[]): CategoryHierarchy[] {
    const categoryMap = new Map<string, CategoryHierarchy>();
    const rootCategories: CategoryHierarchy[] = [];

    // First pass: create all category objects
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        level: 0,
        path: []
      });
    });

    // Second pass: build the tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;
      
      if (!category.parentId) {
        // Root category
        categoryNode.level = 0;
        categoryNode.path = [category.name];
        rootCategories.push(categoryNode);
      } else {
        // Child category
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          categoryNode.level = parent.level + 1;
          categoryNode.path = [...parent.path, category.name];
          parent.children.push(categoryNode);
        }
      }
    });

    return rootCategories;
  }

  /**
   * Cache management methods
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate specific category caches
   */
  invalidateCategoryCache(categoryId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(categoryId) || key.includes('category-hierarchy') || key.includes('category-stats')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance();