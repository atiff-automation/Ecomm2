/**
 * Products Client Component - Malaysian E-commerce Platform
 * Client-side interactive components for products page
 *
 * This component handles:
 * - Interactive filtering and search
 * - Client-side state management
 * - Cart interactions
 * - Progressive enhancement over server-rendered content
 */

'use client';

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductsFilters } from './components/ProductsFilters';
import { ProductsPagination } from './components/ProductsPagination';
import { ProductsError } from './components/ProductsError';
import { ProductsLoading } from './components/ProductsLoading';
import { useCart } from '@/hooks/use-cart';
import { productService } from '@/lib/services/product-service';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  featured: boolean;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionalPrice?: number | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  memberOnlyUntil?: string | null;
  earlyAccessStart?: string | null;
  averageRating: number;
  reviewCount: number;
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProductsClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialPagination: Pagination;
  initialParams: {
    search?: string;
    category?: string;
    sortBy?: string;
    page?: string;
  };
}

export function ProductsClient({
  initialProducts,
  initialCategories,
  initialPagination,
  initialParams,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // Client state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use React 18 useTransition for better UX during navigation
  const [isPending, startTransition] = useTransition();

  // Current filter values from URL
  const currentParams = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || 'all',
      sortBy: searchParams.get('sortBy') || 'created-desc',
      page: parseInt(searchParams.get('page') || '1', 10),
    }),
    [searchParams]
  );

  // Update URL parameters without causing full page reload
  const updateURL = useCallback(
    (updates: Partial<typeof currentParams>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all' && value !== 1) {
          newParams.set(key, value.toString());
        } else {
          newParams.delete(key);
        }
      });

      // Reset to page 1 when filters change (except when page itself is changing)
      if (
        !updates.page &&
        (updates.search !== undefined ||
          updates.category !== undefined ||
          updates.sortBy !== undefined)
      ) {
        newParams.delete('page');
      }

      const newURL = `${window.location.pathname}?${newParams.toString()}`;

      startTransition(() => {
        router.push(newURL);
      });
    },
    [router, searchParams]
  );

  // Fetch products client-side (for filter changes)
  const fetchProducts = useCallback(async (params: typeof currentParams) => {
    try {
      setLoading(true);
      setError(null);

      const [sortField, sortOrder] = params.sortBy.split('-');
      const apiParams = {
        page: params.page,
        limit: 20,
        search: params.search || undefined,
        category: params.category !== 'all' ? params.category : undefined,
        sortBy: sortField as 'created' | 'name' | 'price' | 'rating',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await productService.getProducts(apiParams);

      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with URL changes (when user navigates back/forward or direct URL change)
  useEffect(() => {
    // CRITICAL FIX: Normalize initial params to match current params format
    // This prevents unnecessary refetch on initial load due to parameter format mismatch
    const normalizedInitialParams = {
      search: initialParams.search || '',
      category: initialParams.category || 'all',
      sortBy: initialParams.sortBy || 'created-desc',
      page: parseInt(initialParams.page || '1', 10),
    };

    // Only fetch if parameters actually changed from initial state
    const paramsChanged =
      currentParams.search !== normalizedInitialParams.search ||
      currentParams.category !== normalizedInitialParams.category ||
      currentParams.sortBy !== normalizedInitialParams.sortBy ||
      currentParams.page !== normalizedInitialParams.page;

    if (paramsChanged) {
      fetchProducts(currentParams);
    }
  }, [currentParams, fetchProducts, initialParams]);

  // Handle filter changes
  const handleSearchChange = useCallback(
    (search: string) => {
      updateURL({ search });
    },
    [updateURL]
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      updateURL({ category });
    },
    [updateURL]
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      updateURL({ sortBy });
    },
    [updateURL]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateURL({ page });
    },
    [updateURL]
  );

  const handleClearFilters = useCallback(() => {
    updateURL({
      search: '',
      category: 'all',
      sortBy: 'created-desc',
      page: 1,
    });
  }, [updateURL]);

  // Handle add to cart
  const handleAddToCart = useCallback(
    async (productId: string) => {
      try {
        await addToCart(productId, 1);
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    },
    [addToCart]
  );

  // Loading state includes both local loading and navigation pending
  const isLoading = loading || isPending;

  return (
    <>
      {/* Desktop Filters Sidebar - Hidden on mobile */}
      <div className="hidden lg:block lg:w-80 space-y-6">
        <ProductsFilters
          categories={categories}
          currentSearch={currentParams.search}
          currentCategory={currentParams.category}
          currentSort={currentParams.sortBy}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          disabled={isLoading}
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12 text-base">
                <Filter className="mr-2 h-5 w-5" />
                Filters & Sort
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[400px] overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ProductsFilters
                  categories={categories}
                  currentSearch={currentParams.search}
                  currentCategory={currentParams.category}
                  currentSort={currentParams.sortBy}
                  onSearchChange={handleSearchChange}
                  onCategoryChange={handleCategoryChange}
                  onSortChange={handleSortChange}
                  onClearFilters={handleClearFilters}
                  disabled={isLoading}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {error ? (
          <ProductsError
            message={error}
            onRetry={() => fetchProducts(currentParams)}
          />
        ) : (
          <>
            {/* Products Grid with loading overlay */}
            <div
              className={`relative ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {products.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No products found matching your criteria.
                  </p>
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      size="md"
                      showDescription={true}
                      showRating={true}
                    />
                  ))}
                </div>
              )}

              {/* Loading overlay */}
              {isLoading && products.length > 0 && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <ProductsLoading compact />
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && !isLoading && (
              <ProductsPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
