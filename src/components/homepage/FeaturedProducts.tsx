/**
 * Featured Products Section - JRM E-commerce Platform
 * Modern featured products showcase with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { designSystem, sectionTypography } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/layout';
import { ProductCard, ProductCardGrid, type ProductCardProps } from '@/components/product/ProductCard';
import { ArrowRight, Star, TrendingUp, Zap } from 'lucide-react';

export interface FeaturedProductsProps {
  products: ProductCardProps['product'][];
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'featured';
  layout?: 'grid' | 'carousel' | 'masonry';
  showViewAll?: boolean;
  viewAllHref?: string;
  maxProducts?: number;
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

export function FeaturedProducts({
  products,
  title = 'Featured Products',
  subtitle = 'Handpicked for You',
  description = 'Discover our carefully curated selection of premium products that are trending right now.',
  variant = 'featured',
  layout = 'grid',
  showViewAll = true,
  viewAllHref = '/products/featured',
  maxProducts = 8,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  className
}: FeaturedProductsProps) {
  const displayProducts = products.slice(0, maxProducts);

  const sectionHeaderClasses = {
    default: 'text-center mb-8',
    compact: 'text-left mb-6',
    featured: 'text-center mb-12'
  };

  return (
    <Section
      variant="default"
      className={cn('py-12 lg:py-16', className)}
    >
      <Container size="xl">
        {/* Section Header */}
        <div className={sectionHeaderClasses[variant]}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-5 w-5 text-primary" />
            <span className={cn(
              sectionTypography.overline(),
              'text-primary font-medium tracking-wide uppercase'
            )}>
              {subtitle}
            </span>
          </div>

          <h2 className={cn(
            sectionTypography.title(variant === 'featured' ? 'xl' : 'lg'),
            'font-bold text-foreground mb-4'
          )}>
            {title}
          </h2>

          {description && (
            <p className={cn(
              sectionTypography.description(),
              'text-muted-foreground max-w-2xl',
              variant === 'featured' ? 'mx-auto' : ''
            )}>
              {description}
            </p>
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

            {/* View All Button */}
            {showViewAll && displayProducts.length > 0 && (
              <div className="text-center">
                <Link href={viewAllHref}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      'group transition-all duration-200',
                      'hover:bg-primary hover:text-primary-foreground',
                      'border-2 hover:border-primary'
                    )}
                  >
                    <span>View All Featured Products</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Carousel Layout */}
        {layout === 'carousel' && (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {displayProducts.map((product) => (
                  <div key={product.id} className="w-72 flex-shrink-0">
                    <ProductCard
                      product={product}
                      variant={variant}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onQuickView={onQuickView}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* View All Button */}
            {showViewAll && displayProducts.length > 0 && (
              <div className="text-center">
                <Link href={viewAllHref}>
                  <Button variant="outline" size="lg" className="group">
                    <span>View All Featured Products</span>
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
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Featured Products</h3>
              <p className="text-muted-foreground mb-4">
                We're currently updating our featured products selection. Check back soon!
              </p>
              <Link href="/products">
                <Button variant="outline">
                  Browse All Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </Container>
    </Section>
  );
}

// Specialized featured product variants
export const CompactFeaturedProducts = ({ className, ...props }: Omit<FeaturedProductsProps, 'variant'>) => (
  <FeaturedProducts
    variant="compact"
    title="Featured"
    subtitle="Editor's Choice"
    maxProducts={4}
    columns={{ mobile: 2, tablet: 2, desktop: 4 }}
    className={className}
    {...props}
  />
);

export const HeroFeaturedProducts = ({ className, ...props }: Omit<FeaturedProductsProps, 'variant'>) => (
  <FeaturedProducts
    variant="featured"
    title="Trending Now"
    subtitle="Most Popular"
    description="The hottest products that everyone is talking about. Get them before they're gone!"
    layout="carousel"
    maxProducts={6}
    className={className}
    {...props}
  />
);

// Quick featured products for sidebar or smaller spaces
export interface QuickFeaturedProductsProps {
  products: ProductCardProps['product'][];
  title?: string;
  maxProducts?: number;
  onAddToCart?: ProductCardProps['onAddToCart'];
  className?: string;
}

export function QuickFeaturedProducts({
  products,
  title = 'Featured Products',
  maxProducts = 3,
  onAddToCart,
  className
}: QuickFeaturedProductsProps) {
  const displayProducts = products.slice(0, maxProducts);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      <div className="space-y-3">
        {displayProducts.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="p-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.shortDescription}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-sm">
                      RM {product.memberPrice.toFixed(2)}
                    </span>
                    {product.isPromotional && (
                      <Badge variant="destructive" className="text-xs">
                        Sale
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No featured products available</p>
        </div>
      )}
    </div>
  );
}

export default FeaturedProducts;