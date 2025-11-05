/**
 * Product Grid Component - JRM E-commerce Platform
 * Advanced product grid with filtering, sorting, pagination, and loading states
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Container, Grid } from '@/components/ui/layout';
import {
  ProductCard,
  type ProductCardProps,
} from '@/components/product/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Filter,
  SortAsc,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Heart,
  TrendingUp,
} from 'lucide-react';

export interface ProductGridFilters {
  category?: string;
  priceRange?: [number, number];
  brand?: string;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
  tags?: string[];
}

export interface ProductGridSorting {
  field: 'name' | 'price' | 'rating' | 'date' | 'popularity' | 'discount';
  direction: 'asc' | 'desc';
}

export interface ProductGridPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductGridProps {
  products: ProductCardProps['product'][];
  loading?: boolean;
  error?: string | null;
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  layout?: 'grid' | 'list' | 'masonry';
  viewMode?: 'grid' | 'list';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showFilters?: boolean;
  showSorting?: boolean;
  showPagination?: boolean;
  showViewToggle?: boolean;
  showLoadMore?: boolean;
  filters?: ProductGridFilters;
  sorting?: ProductGridSorting;
  pagination?: ProductGridPagination;
  title?: string;
  subtitle?: string;
  description?: string;
  onFilterChange?: (filters: ProductGridFilters) => void;
  onSortChange?: (sorting: ProductGridSorting) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onAddToCart?: ProductCardProps['onAddToCart'];
  onToggleWishlist?: ProductCardProps['onToggleWishlist'];
  onQuickView?: ProductCardProps['onQuickView'];
  className?: string;
}

// Loading Skeleton Components
function ProductCardSkeleton({ variant = 'default' }: { variant?: string }) {
  const height =
    variant === 'compact' ? 'h-64' : variant === 'featured' ? 'h-80' : 'h-72';

  return (
    <Card className={cn('overflow-hidden', height)}>
      <CardContent className="p-0">
        <Skeleton className="w-full h-48" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductGridSkeleton({
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  count = 8,
}: {
  columns?: { mobile: number; tablet: number; desktop: number };
  count?: number;
}) {
  return (
    <div
      className={cn(
        'grid gap-2 sm:gap-3 md:gap-4',
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({
  title = 'No products found',
  description = "Try adjusting your filters or search terms to find what you're looking for.",
  icon: IconComponent = ShoppingBag,
  action,
  filters,
  onClearFilters,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  filters?: ProductGridFilters;
  onClearFilters?: () => void;
}) {
  const hasActiveFilters =
    filters &&
    Object.values(filters).some(
      value =>
        value !== undefined &&
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true)
    );

  return (
    <Card className="p-12">
      <CardContent className="text-center space-y-6">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <IconComponent className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasActiveFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          {action && <Button onClick={action.onClick}>{action.label}</Button>}
        </div>
      </CardContent>
    </Card>
  );
}

// Error State Component
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-12">
      <CardContent className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-900">
            Something went wrong
          </h3>
          <p className="text-red-700 max-w-md mx-auto">{error}</p>
        </div>

        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// View Toggle Component
function ViewToggle({
  viewMode,
  onViewChange,
}: {
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8"
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8"
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  );
}

// Stats Bar Component
function StatsBar({
  total,
  showing,
  loading,
  filters,
}: {
  total: number;
  showing: number;
  loading: boolean;
  filters?: ProductGridFilters;
}) {
  const hasActiveFilters =
    filters &&
    Object.values(filters).some(
      value =>
        value !== undefined &&
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true)
    );

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading products...</span>
          </div>
        ) : (
          <span>
            Showing {showing.toLocaleString()} of {total.toLocaleString()}{' '}
            products
            {hasActiveFilters && ' (filtered)'}
          </span>
        )}
      </div>

      {!loading && (
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              <Filter className="w-3 h-3 mr-1" />
              Filtered
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  error = null,
  variant = 'default',
  layout = 'grid',
  viewMode: initialViewMode = 'grid',
  columns = { mobile: 2, tablet: 3, desktop: 4 }, // Already set to 2 columns for mobile
  showFilters = false,
  showSorting = false,
  showPagination = false,
  showViewToggle = true,
  showLoadMore = false,
  filters,
  sorting,
  pagination,
  title,
  subtitle,
  description,
  onFilterChange,
  onSortChange,
  onPageChange,
  onLoadMore,
  onRefresh,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  className,
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleClearFilters = useCallback(() => {
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [onFilterChange]);

  const getGridClasses = () => {
    if (viewMode === 'list') {
      return 'space-y-4';
    }

    const base = 'grid gap-2 sm:gap-3 md:gap-4';
    if (layout === 'masonry') {
      return `${base} grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} auto-rows-[minmax(250px,auto)]`;
    }
    return `${base} grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`;
  };

  // Render section header if provided
  const renderHeader = () => {
    if (!title && !subtitle && !description) {
      return null;
    }

    return (
      <SectionHeader
        title={title || ''}
        subtitle={subtitle}
        description={description}
        variant="default"
        className="mb-8"
      />
    );
  };

  // Render toolbar
  const renderToolbar = () => {
    if (!showViewToggle && !showSorting && !onRefresh) {
      return null;
    }

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {pagination && (
            <StatsBar
              total={pagination.total}
              showing={products.length}
              loading={loading}
              filters={filters}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          )}

          {showViewToggle && (
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          )}
        </div>
      </div>
    );
  };

  // Render products
  const renderProducts = () => {
    if (error) {
      return <ErrorState error={error} onRetry={onRefresh} />;
    }

    if (loading && products.length === 0) {
      return <ProductGridSkeleton columns={columns} count={8} />;
    }

    if (!loading && products.length === 0) {
      return (
        <EmptyState
          filters={filters}
          onClearFilters={handleClearFilters}
          action={
            onRefresh
              ? {
                  label: 'Refresh',
                  onClick: handleRefresh,
                }
              : undefined
          }
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              variant="list"
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={getGridClasses()}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={variant}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            onQuickView={onQuickView}
            className={
              layout === 'masonry'
                ? index % 3 === 0
                  ? 'row-span-2'
                  : index % 5 === 0
                    ? 'row-span-3'
                    : ''
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  // Render load more button
  const renderLoadMore = () => {
    if (!showLoadMore || !onLoadMore || !pagination) {
      return null;
    }

    const hasMore = pagination.page < pagination.totalPages;
    if (!hasMore) {
      return null;
    }

    return (
      <div className="text-center mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={onLoadMore}
          disabled={loading}
          className="min-w-32"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Load More Products
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Container className={cn('space-y-6', className)}>
      {renderHeader()}
      {renderToolbar()}
      {renderProducts()}
      {renderLoadMore()}
    </Container>
  );
}

// Specialized product grid variants
export const FeaturedProductGrid = ({
  className,
  ...props
}: Omit<ProductGridProps, 'variant'>) => (
  <ProductGrid
    variant="featured"
    title="Featured Products"
    subtitle="Handpicked for You"
    description="Discover our carefully curated selection of premium products."
    showViewToggle={true}
    showLoadMore={true}
    className={className}
    {...props}
  />
);

export const SearchProductGrid = ({
  className,
  ...props
}: Omit<ProductGridProps, 'showFilters' | 'showSorting'>) => (
  <ProductGrid
    showFilters={true}
    showSorting={true}
    showViewToggle={true}
    showPagination={true}
    className={className}
    {...props}
  />
);

export const CategoryProductGrid = ({
  className,
  ...props
}: Omit<ProductGridProps, 'variant' | 'layout'>) => (
  <ProductGrid
    variant="default"
    layout="grid"
    showFilters={true}
    showSorting={true}
    showViewToggle={true}
    showPagination={true}
    className={className}
    {...props}
  />
);

export const CompactProductGrid = ({
  className,
  ...props
}: Omit<ProductGridProps, 'variant' | 'columns'>) => (
  <ProductGrid
    variant="compact"
    columns={{ mobile: 3, tablet: 4, desktop: 6 }}
    showViewToggle={false}
    showLoadMore={true}
    className={className}
    {...props}
  />
);

export default ProductGrid;
