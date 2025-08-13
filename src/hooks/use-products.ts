/**
 * useProducts Hooks - Malaysian E-commerce Platform
 * Enhanced React hooks for product data with React Query patterns
 * 
 * These hooks provide optimized data fetching with caching,
 * error handling, and automatic refetching capabilities.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { productService, ProductListResponse, ProductSearchOptions } from '@/lib/services/product-service';
import { ProductResponse, ProductListParams } from '@/lib/types/api';

interface UseProductsReturn {
  products: ProductResponse[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  canLoadMore: boolean;
}

/**
 * Hook for fetching paginated products with filters
 */
export function useProducts(params: ProductListParams = {}): UseProductsReturn {
  const [data, setData] = useState<ProductListResponse>({
    products: [],
    pagination: {
      page: 1,
      limit: 20,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (resetData = true) => {
    try {
      if (resetData) setIsLoading(true);
      setError(null);
      
      const result = await productService.getProducts(params);
      
      if (resetData) {
        setData(result);
      } else {
        // Load more: append products
        setData(prev => ({
          ...result,
          products: [...prev.products, ...result.products]
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (!data.pagination.hasNextPage || isLoading) return;
    
    const nextParams = {
      ...params,
      page: (params.page || 1) + 1
    };
    
    try {
      const result = await productService.getProducts(nextParams);
      setData(prev => ({
        ...result,
        products: [...prev.products, ...result.products]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more products');
    }
  }, [params, data.pagination.hasNextPage, isLoading]);

  const refetch = useCallback(() => fetchProducts(true), [fetchProducts]);

  return {
    products: data.products,
    isLoading,
    error,
    pagination: data.pagination,
    refetch,
    loadMore,
    canLoadMore: data.pagination.hasNextPage && !isLoading
  };
}

/**
 * Hook for fetching featured products
 */
export function useFeaturedProducts(limit: number = 8): {
  products: ProductResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await productService.getFeaturedProducts(limit);
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load featured products');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchFeaturedProducts
  };
}

/**
 * Hook for fetching single product
 */
export function useProduct(slugOrId: string): {
  product: ProductResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slugOrId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await productService.getProduct(slugOrId);
      setProduct(result);
      
      // Track product view
      productService.trackProductView(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct
  };
}

/**
 * Hook for product search with debouncing
 */
export function useProductSearch(query: string, options: ProductSearchOptions = {}, debounceMs: number = 300): {
  products: ProductResponse[];
  isLoading: boolean;
  error: string | null;
  isSearching: boolean;
  totalCount: number;
  refetch: () => Promise<void>;
} {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotalCount(0);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await productService.searchProducts(query, options);
        setProducts(result.products);
        setTotalCount(result.pagination.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [query, options, debounceMs]);

  const refetch = useCallback(async () => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await productService.searchProducts(query, options);
      setProducts(result.products);
      setTotalCount(result.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, options]);

  return {
    products,
    isLoading,
    error,
    isSearching,
    totalCount,
    refetch
  };
}

/**
 * Hook for related products
 */
export function useRelatedProducts(productId: string, limit: number = 4): {
  products: ProductResponse[];
  isLoading: boolean;
  error: string | null;
} {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    
    const fetchRelatedProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await productService.getRelatedProducts(productId, { limit });
        setProducts(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load related products');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, limit]);

  return { products, isLoading, error };
}

/**
 * Hook for product recommendations
 */
export function useProductRecommendations(type: 'general' | 'user-based' | 'trending' = 'general', limit: number = 8): {
  products: ProductResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await productService.getRecommendations(type, limit);
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchRecommendations
  };
}

/**
 * Hook for infinite scroll products
 */
export function useInfiniteProducts(baseParams: ProductListParams = {}) {
  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      setError(null);
      
      const params = { ...baseParams, page: currentPage };
      const result = await productService.getProducts(params);
      
      if (currentPage === 1) {
        setAllProducts(result.products);
      } else {
        setAllProducts(prev => [...prev, ...result.products]);
      }
      
      setHasNextPage(result.pagination.hasNextPage);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [baseParams, currentPage, hasNextPage, isLoadingMore]);

  const reset = useCallback(() => {
    setAllProducts([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setError(null);
    setIsLoading(true);
  }, []);

  // Load first page on mount or when params change
  useEffect(() => {
    reset();
  }, [reset, JSON.stringify(baseParams)]);

  // Fetch first page after reset
  useEffect(() => {
    if (currentPage === 1 && isLoading) {
      fetchNextPage();
    }
  }, [currentPage, isLoading, fetchNextPage]);

  return {
    products: allProducts,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    fetchNextPage,
    reset
  };
}