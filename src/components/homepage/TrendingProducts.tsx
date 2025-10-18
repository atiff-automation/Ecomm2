/**
 * Trending Products Section - JRM E-commerce Platform
 * Dynamic trending products showcase with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { designSystem, sectionTypography } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/layout';
import {
  ProductCard,
  ProductCardGrid,
  type ProductCardProps,
} from '@/components/product/ProductCard';
import {
  TrendingUp,
  ArrowRight,
  Fire,
  Eye,
  Clock,
  Zap,
  BarChart3,
  Users,
  Star,
} from 'lucide-react';

export interface TrendingProductsProps {
  products: ProductCardProps['product'][];
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  layout?: 'grid' | 'carousel' | 'mixed';
  showViewAll?: boolean;
  viewAllHref?: string;
  maxProducts?: number;
  showTrendingMetrics?: boolean;
  trendingPeriod?: 'today' | 'week' | 'month' | 'year';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  onAddToCart?: ProductCardProps['onAddToCart'];
  onToggleWishlist?: ProductCardProps['onToggleWishlist'];
  onQuickView?: ProductCardProps['onQuickView'];
  className?: string;
}

const trendingPeriodLabels = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

const trendingPeriodIcons = {
  today: Clock,
  week: BarChart3,
  month: TrendingUp,
  year: Star,
};

export function TrendingProducts({
  products,
  title = 'Trending Now',
  subtitle = "What's Hot",
  description = "Discover the products everyone is talking about right now. Don't miss out on the latest trends!",
  variant = 'featured',
  layout = 'grid',
  showViewAll = true,
  viewAllHref = '/products/trending',
  maxProducts = 8,
  showTrendingMetrics = true,
  trendingPeriod = 'week',
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  className,
}: TrendingProductsProps) {
  const [activePeriod, setActivePeriod] = useState(trendingPeriod);
  const displayProducts = products.slice(0, maxProducts);

  const PeriodIcon = trendingPeriodIcons[activePeriod];

  const sectionHeaderClasses = {
    default: 'text-center mb-8',
    compact: 'text-left mb-6',
    featured: 'text-center mb-12',
    minimal: 'text-left mb-6',
  };

  const trendingIndicators = [
    { period: 'today' as const, label: 'Today', color: 'bg-red-500' },
    { period: 'week' as const, label: 'Week', color: 'bg-orange-500' },
    { period: 'month' as const, label: 'Month', color: 'bg-blue-500' },
    { period: 'year' as const, label: 'Year', color: 'bg-purple-500' },
  ];

  return (
    <Section variant="default" className={cn('py-12 lg:py-16', className)}>
      <Container size="xl">
        {/* Section Header */}
        <div className={sectionHeaderClasses[variant]}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Fire className="h-5 w-5 text-red-500 animate-pulse" />
            <span
              className={cn(
                sectionTypography.overline(),
                'text-red-500 font-medium tracking-wide uppercase'
              )}
            >
              {subtitle}
            </span>
          </div>

          <h2
            className={cn(
              sectionTypography.title(variant === 'featured' ? 'xl' : 'lg'),
              'font-bold text-foreground mb-4'
            )}
          >
            {title}
          </h2>

          {description && (
            <p
              className={cn(
                sectionTypography.description(),
                'text-muted-foreground max-w-2xl',
                variant === 'featured' ? 'mx-auto mb-6' : 'mb-6'
              )}
            >
              {description}
            </p>
          )}

          {/* Trending Period Selector */}
          {showTrendingMetrics && variant === 'featured' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground mr-2">
                Trending:
              </span>
              <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                {trendingIndicators.map(indicator => {
                  const IconComponent = trendingPeriodIcons[indicator.period];
                  return (
                    <button
                      key={indicator.period}
                      onClick={() => setActivePeriod(indicator.period)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                        activePeriod === indicator.period
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn('w-2 h-2 rounded-full', indicator.color)}
                      />
                      <IconComponent className="w-3 h-3" />
                      <span>{indicator.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Products Display */}
        {layout === 'grid' && (
          <div className="space-y-8">
            <ProductCardGrid
              products={displayProducts}
              variant={variant}
              columns={columns}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
              className="mb-8"
            />

            {/* Trending Stats */}
            {showTrendingMetrics && displayProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Views</span>
                  </div>
                  <p className="text-2xl font-bold">24.5K</p>
                  <p className="text-xs text-muted-foreground">
                    +12% from last{' '}
                    {trendingPeriodLabels[activePeriod].toLowerCase()}
                  </p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Buyers</span>
                  </div>
                  <p className="text-2xl font-bold">2.1K</p>
                  <p className="text-xs text-muted-foreground">
                    +8% from last{' '}
                    {trendingPeriodLabels[activePeriod].toLowerCase()}
                  </p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Growth</span>
                  </div>
                  <p className="text-2xl font-bold">+35%</p>
                  <p className="text-xs text-muted-foreground">
                    Sales increase
                  </p>
                </Card>

                <Card className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Rating</span>
                  </div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-xs text-muted-foreground">
                    Average rating
                  </p>
                </Card>
              </div>
            )}

            {/* View All Button */}
            {showViewAll && displayProducts.length > 0 && (
              <div className="text-center">
                <Link href={viewAllHref}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      'group transition-all duration-200',
                      'hover:bg-red-500 hover:text-white hover:border-red-500',
                      'border-2'
                    )}
                  >
                    <Fire className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                    <span>Explore All Trending</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Mixed Layout - Featured + Grid */}
        {layout === 'mixed' && displayProducts.length > 0 && (
          <div className="space-y-8">
            {/* Featured Trending Product */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Most Trending {trendingPeriodLabels[activePeriod]}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                  <ProductCard
                    product={displayProducts[0]}
                    variant="featured"
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    onQuickView={onQuickView}
                    className="h-full"
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-xl">
                    {displayProducts[0].name}
                  </h4>
                  <p className="text-muted-foreground">
                    This product has seen exceptional growth with a 45% increase
                    in sales and overwhelmingly positive customer feedback.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">+45% Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">4.9 Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">1.2K Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">15K Views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Trending Products */}
            {displayProducts.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Other Hot Products
                </h3>
                <ProductCardGrid
                  products={displayProducts.slice(1)}
                  variant="compact"
                  columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                />
              </div>
            )}
          </div>
        )}

        {/* Carousel Layout */}
        {layout === 'carousel' && (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {displayProducts.map((product, index) => (
                  <div key={product.id} className="w-72 flex-shrink-0 relative">
                    <ProductCard
                      product={product}
                      variant={variant}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onQuickView={onQuickView}
                    />
                    {/* Trending Rank Badge */}
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -left-2 z-10 bg-red-500 text-white"
                    >
                      #{index + 1} Trending
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* View All Button */}
            {showViewAll && displayProducts.length > 0 && (
              <div className="text-center">
                <Link href={viewAllHref}>
                  <Button variant="outline" size="lg" className="group">
                    <span>See All Trending Products</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {displayProducts.length === 0 && (
          <Card className="p-12">
            <CardContent className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Trending Products
              </h3>
              <p className="text-muted-foreground mb-4">
                We're updating our trending products for{' '}
                {trendingPeriodLabels[activePeriod].toLowerCase()}. Check back
                soon!
              </p>
              <Link href="/products">
                <Button variant="outline">Browse All Products</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </Container>
    </Section>
  );
}

// Specialized trending product variants
export const CompactTrendingProducts = ({
  className,
  ...props
}: Omit<TrendingProductsProps, 'variant'>) => (
  <TrendingProducts
    variant="compact"
    title="Hot Picks"
    subtitle="Trending"
    maxProducts={4}
    showTrendingMetrics={false}
    columns={{ mobile: 2, tablet: 2, desktop: 4 }}
    className={className}
    {...props}
  />
);

export const MinimalTrendingProducts = ({
  className,
  ...props
}: Omit<TrendingProductsProps, 'variant' | 'layout'>) => (
  <TrendingProducts
    variant="minimal"
    layout="carousel"
    title="What's Hot"
    subtitle="Trending"
    maxProducts={6}
    showTrendingMetrics={false}
    showViewAll={false}
    className={className}
    {...props}
  />
);

// Quick trending for sidebars
export interface QuickTrendingProps {
  products: ProductCardProps['product'][];
  title?: string;
  maxProducts?: number;
  period?: 'today' | 'week' | 'month';
  onAddToCart?: ProductCardProps['onAddToCart'];
  className?: string;
}

export function QuickTrending({
  products,
  title = 'Trending Now',
  maxProducts = 3,
  period = 'week',
  onAddToCart,
  className,
}: QuickTrendingProps) {
  const displayProducts = products.slice(0, maxProducts);
  const PeriodIcon = trendingPeriodIcons[period];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Fire className="h-4 w-4 text-red-500" />
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="destructive" className="text-xs">
          <PeriodIcon className="w-3 h-3 mr-1" />
          {trendingPeriodLabels[period]}
        </Badge>
      </div>

      <div className="space-y-3">
        {displayProducts.map((product, index) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="p-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -left-1 w-4 h-4 p-0 flex items-center justify-center text-xs"
                  >
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-red-500 transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.shortDescription}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-sm">
                      RM {product.memberPrice.toFixed(2)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-2 h-2 mr-1" />
                      Hot
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
          <Fire className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            No trending products for{' '}
            {trendingPeriodLabels[period].toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}

export default TrendingProducts;
