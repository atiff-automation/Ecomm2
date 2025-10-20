/**
 * Category Showcase Section - JRM E-commerce Platform
 * Modern category showcase with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { designSystem, sectionTypography } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Container, Section } from '@/components/ui/layout';
import {
  ArrowRight,
  Grid3X3,
  Package,
  Star,
  TrendingUp,
  Eye,
  ShoppingBag,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  description?: string;
  imageUrl: string;
  productCount: number;
  featured?: boolean;
  trending?: boolean;
  newArrivals?: number;
  backgroundColor?: string;
  textColor?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export interface CategoryShowcaseProps {
  categories: CategoryItem[];
  title?: string;
  subtitle?: string;
  description?: string;
  variant?: 'default' | 'grid' | 'masonry' | 'featured' | 'minimal';
  layout?: 'grid' | 'carousel' | 'mixed';
  showViewAll?: boolean;
  viewAllHref?: string;
  maxCategories?: number;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showProductCounts?: boolean;
  showTrendingBadges?: boolean;
  className?: string;
}

export function CategoryShowcase({
  categories,
  title = 'Shop by Category',
  subtitle = 'Explore Collections',
  description = 'Discover our carefully curated categories featuring the best products in each collection.',
  variant = 'grid',
  layout = 'grid',
  showViewAll = true,
  viewAllHref = '/categories',
  maxCategories = 8,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  showProductCounts = true,
  showTrendingBadges = true,
  className,
}: CategoryShowcaseProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const displayCategories = categories.slice(0, maxCategories);

  const sectionHeaderClasses = {
    default: 'text-center mb-8',
    grid: 'text-center mb-10',
    masonry: 'text-left mb-8',
    featured: 'text-center mb-12',
    minimal: 'text-left mb-6',
  };

  const getGridClasses = () => {
    const base = 'grid gap-6';
    switch (variant) {
      case 'masonry':
        return `${base} grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} auto-rows-[minmax(200px,auto)]`;
      case 'featured':
        return `${base} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      default:
        return `${base} grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`;
    }
  };

  const getCategoryHeight = (index: number) => {
    if (variant === 'masonry') {
      // Create masonry effect with varying heights
      const heights = [
        'h-48',
        'h-56',
        'h-44',
        'h-52',
        'h-48',
        'h-60',
        'h-44',
        'h-56',
      ];
      return heights[index % heights.length];
    }
    return variant === 'featured' ? 'h-64' : 'h-48';
  };

  return (
    <Section variant="default" className={cn('py-12 lg:py-16', className)}>
      <Container size="xl">
        {/* Section Header */}
        <div className={sectionHeaderClasses[variant]}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            <span
              className={cn(
                sectionTypography.overline(),
                'text-primary font-medium tracking-wide uppercase'
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
                variant === 'featured' || variant === 'grid' ? 'mx-auto' : ''
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Categories Display */}
        {layout === 'grid' && (
          <div className="space-y-8">
            <div className={getGridClasses()}>
              {displayCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={category.href}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Card
                    className={cn(
                      'group overflow-hidden border-2 transition-all duration-300',
                      'hover:border-primary hover:shadow-xl',
                      getCategoryHeight(index),
                      'relative'
                    )}
                  >
                    <div className="relative h-full w-full">
                      {/* Background Image */}
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />

                      {/* Overlay */}
                      <div
                        className={cn(
                          'absolute inset-0 transition-opacity duration-300',
                          'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
                          'group-hover:from-black/80 group-hover:via-black/30'
                        )}
                      />

                      {/* Content */}
                      <CardContent className="absolute inset-0 p-6 flex flex-col justify-between">
                        {/* Top Section - Badges */}
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-2">
                            {category.featured && (
                              <Badge
                                variant="secondary"
                                className="w-fit bg-white/20 text-white backdrop-blur-sm"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {category.trending && showTrendingBadges && (
                              <Badge variant="destructive" className="w-fit">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                            {category.badge && (
                              <Badge
                                variant={category.badge.variant || 'secondary'}
                                className="w-fit"
                              >
                                {category.badge.text}
                              </Badge>
                            )}
                          </div>
                          {category.newArrivals && category.newArrivals > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-white/20 text-white backdrop-blur-sm border-white/30"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {category.newArrivals} New
                            </Badge>
                          )}
                        </div>

                        {/* Bottom Section - Category Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3
                              className={cn(
                                'font-bold text-white transition-colors duration-200',
                                variant === 'featured' ? 'text-xl' : 'text-lg',
                                'group-hover:text-primary-foreground'
                              )}
                            >
                              {category.name}
                            </h3>
                            <ChevronRight
                              className={cn(
                                'h-5 w-5 text-white transition-all duration-200',
                                'group-hover:translate-x-1 group-hover:text-primary-foreground'
                              )}
                            />
                          </div>

                          {category.description && variant === 'featured' && (
                            <p className="text-white/80 text-sm line-clamp-2">
                              {category.description}
                            </p>
                          )}

                          {showProductCounts && (
                            <div className="flex items-center gap-4 text-white/70">
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {category.productCount.toLocaleString()} items
                                </span>
                              </div>
                              {hoveredCategory === category.id && (
                                <div className="flex items-center gap-1 animate-in fade-in duration-300">
                                  <Eye className="h-4 w-4" />
                                  <span className="text-sm">Explore</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            {showViewAll && displayCategories.length > 0 && (
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
                    <Layers className="mr-2 h-4 w-4" />
                    <span>View All Categories</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Mixed Layout - Featured + Grid */}
        {layout === 'mixed' && displayCategories.length > 0 && (
          <div className="space-y-8">
            {/* Featured Categories */}
            <div className="grid md:grid-cols-2 gap-6">
              {displayCategories.slice(0, 2).map(category => (
                <Link key={category.id} href={category.href}>
                  <Card className="group overflow-hidden border-2 h-80 transition-all duration-300 hover:border-primary hover:shadow-xl">
                    <div className="relative h-full w-full">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <CardContent className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="space-y-3">
                          <h3 className="font-bold text-2xl text-white">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-white/80">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-white/70">
                            <span className="font-medium">
                              {category.productCount} items
                            </span>
                            {category.trending && (
                              <Badge variant="destructive">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Regular Categories Grid */}
            {displayCategories.length > 2 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayCategories.slice(2).map(category => (
                  <Link key={category.id} href={category.href}>
                    <Card className="group overflow-hidden border-2 h-40 transition-all duration-300 hover:border-primary hover:shadow-lg">
                      <div className="relative h-full w-full">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <CardContent className="absolute inset-0 p-4 flex flex-col justify-end">
                          <h4 className="font-semibold text-white text-sm">
                            {category.name}
                          </h4>
                          <span className="text-white/70 text-xs">
                            {category.productCount} items
                          </span>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Carousel Layout */}
        {layout === 'carousel' && (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {displayCategories.map(category => (
                  <Link key={category.id} href={category.href}>
                    <Card className="group overflow-hidden border-2 w-64 h-48 transition-all duration-300 hover:border-primary hover:shadow-xl">
                      <div className="relative h-full w-full">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="256px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <CardContent className="absolute inset-0 p-6 flex flex-col justify-between">
                          <div className="flex justify-end">
                            {category.trending && showTrendingBadges && (
                              <Badge variant="destructive">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Hot
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-bold text-white text-lg">
                              {category.name}
                            </h3>
                            <div className="flex items-center gap-2 text-white/70">
                              <Package className="h-4 w-4" />
                              <span className="text-sm">
                                {category.productCount} items
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* View All Button */}
            {showViewAll && displayCategories.length > 0 && (
              <div className="text-center">
                <Link href={viewAllHref}>
                  <Button variant="outline" size="lg" className="group">
                    <span>Browse All Categories</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {displayCategories.length === 0 && (
          <Card className="p-12">
            <CardContent className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Grid3X3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Categories Available
              </h3>
              <p className="text-muted-foreground mb-4">
                We're organizing our categories. Check back soon for exciting
                collections!
              </p>
              <Link href="/products">
                <Button variant="outline">
                  <ShoppingBag className="mr-2 h-4 w-4" />
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

// Specialized category showcase variants
export const CompactCategoryShowcase = ({
  className,
  ...props
}: Omit<CategoryShowcaseProps, 'variant'>) => (
  <CategoryShowcase
    variant="minimal"
    title="Categories"
    subtitle="Browse"
    maxCategories={6}
    columns={{ mobile: 3, tablet: 4, desktop: 6 }}
    showProductCounts={false}
    showTrendingBadges={false}
    className={className}
    {...props}
  />
);

export const FeaturedCategoryShowcase = ({
  className,
  ...props
}: Omit<CategoryShowcaseProps, 'variant' | 'layout'>) => (
  <CategoryShowcase
    variant="featured"
    layout="mixed"
    title="Explore Collections"
    subtitle="Featured Categories"
    description="Discover our most popular collections featuring the best products in each category."
    maxCategories={8}
    className={className}
    {...props}
  />
);

// Quick categories for sidebars
export interface QuickCategoriesProps {
  categories: CategoryItem[];
  title?: string;
  maxCategories?: number;
  showProductCounts?: boolean;
  className?: string;
}

export function QuickCategories({
  categories,
  title = 'Quick Browse',
  maxCategories = 4,
  showProductCounts = true,
  className,
}: QuickCategoriesProps) {
  const displayCategories = categories.slice(0, maxCategories);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      <div className="space-y-2">
        {displayCategories.map(category => (
          <Link key={category.id} href={category.href}>
            <Card className="p-3 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-md overflow-hidden">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="40px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {category.name}
                  </h4>
                  {showProductCounts && (
                    <p className="text-xs text-muted-foreground">
                      {category.productCount} items
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {displayCategories.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
          <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No categories available</p>
        </div>
      )}
    </div>
  );
}

export default CategoryShowcase;
