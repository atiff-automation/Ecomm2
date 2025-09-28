/**
 * Mega Menu Component - JRM E-commerce Platform
 * Advanced mega menu with category-based navigation
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronDown,
  Star,
  ArrowRight,
  Zap,
  Gift,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export interface MegaMenuCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  imageUrl?: string;
  productCount?: number;
  featured?: boolean;
  children?: MegaMenuSubCategory[];
}

export interface MegaMenuSubCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  productCount?: number;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  badge?: string;
}

export interface MegaMenuSection {
  title: string;
  categories: MegaMenuCategory[];
  featuredProducts?: FeaturedProduct[];
  promotionalBanner?: {
    title: string;
    description: string;
    imageUrl: string;
    ctaText: string;
    ctaHref: string;
  };
}

export interface MegaMenuProps {
  sections: MegaMenuSection[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MegaMenu({ sections, isOpen, onClose, className }: MegaMenuProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.title || '');

  const handleCategoryClick = () => {
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (!isOpen) return null;

  const currentSection = sections.find(section => section.title === activeSection) || sections[0];

  return (
    <div className={cn(
      'absolute top-full left-0 right-0 z-50',
      'bg-background/95 backdrop-blur-sm',
      'border-b border-border/50 shadow-xl',
      'animate-in fade-in-0 slide-in-from-top-2 duration-200',
      className
    )}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Section Navigation */}
          <div className="col-span-2">
            <div className="space-y-1">
              {sections.map((section) => (
                <Button
                  key={section.title}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-left p-3 h-auto',
                    'hover:bg-primary/5 hover:text-primary',
                    activeSection === section.title && 'bg-primary/10 text-primary'
                  )}
                  onMouseEnter={() => setActiveSection(section.title)}
                  onClick={handleCategoryClick}
                >
                  <span className="font-medium">{section.title}</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="col-span-6">
            <div className="grid grid-cols-2 gap-4">
              {currentSection.categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <Link
                    href={category.href}
                    onClick={handleCategoryClick}
                    className={cn(
                      'flex items-center gap-2 font-semibold text-sm',
                      'hover:text-primary transition-colors duration-200',
                      'group'
                    )}
                  >
                    {category.imageUrl && (
                      <div className="relative w-8 h-8 rounded-md overflow-hidden">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    )}
                    <span className="group-hover:underline">{category.name}</span>
                    {category.featured && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                    {category.productCount && (
                      <span className="text-xs text-muted-foreground">
                        ({category.productCount})
                      </span>
                    )}
                  </Link>

                  {category.children && (
                    <div className="pl-4 space-y-1">
                      {category.children.map((subCategory) => (
                        <Link
                          key={subCategory.id}
                          href={subCategory.href}
                          onClick={handleCategoryClick}
                          className={cn(
                            'block text-sm text-muted-foreground',
                            'hover:text-foreground transition-colors duration-200',
                            'flex items-center gap-2'
                          )}
                        >
                          <span>{subCategory.name}</span>
                          {subCategory.badge && (
                            <Badge
                              variant={subCategory.badge.variant || 'secondary'}
                              className="text-xs"
                            >
                              {subCategory.badge.text}
                            </Badge>
                          )}
                          {subCategory.productCount && (
                            <span className="text-xs text-muted-foreground">
                              ({subCategory.productCount})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Featured Content */}
          <div className="col-span-4 space-y-4">
            {/* Featured Products */}
            {currentSection.featuredProducts && currentSection.featuredProducts.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Featured Products
                </h3>
                <div className="space-y-2">
                  {currentSection.featuredProducts.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={handleCategoryClick}
                    >
                      <Card className="p-3 hover:shadow-md transition-shadow duration-200 group">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-md overflow-hidden">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="48px"
                            />
                            {product.badge && (
                              <Badge className="absolute -top-1 -right-1 text-xs">
                                {product.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-semibold text-sm">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Promotional Banner */}
            {currentSection.promotionalBanner && (
              <Card className="overflow-hidden">
                <div className="relative h-32">
                  <Image
                    src={currentSection.promotionalBanner.imageUrl}
                    alt={currentSection.promotionalBanner.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-center">
                    <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      {currentSection.promotionalBanner.title}
                    </h3>
                    <p className="text-white/90 text-xs mb-3 line-clamp-2">
                      {currentSection.promotionalBanner.description}
                    </p>
                    <Link
                      href={currentSection.promotionalBanner.ctaHref}
                      onClick={handleCategoryClick}
                    >
                      <Button size="sm" variant="secondary" className="text-xs">
                        {currentSection.promotionalBanner.ctaText}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Links Footer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/products/new"
                onClick={handleCategoryClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Zap className="h-4 w-4" />
                New Arrivals
              </Link>
              <Link
                href="/deals"
                onClick={handleCategoryClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <Gift className="h-4 w-4" />
                Special Deals
              </Link>
              <Link
                href="/products/bestsellers"
                onClick={handleCategoryClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Best Sellers
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default mega menu configuration
export const defaultMegaMenuSections: MegaMenuSection[] = [
  {
    title: 'Electronics',
    categories: [
      {
        id: 'phones',
        name: 'Smartphones',
        slug: 'smartphones',
        href: '/categories/electronics/smartphones',
        productCount: 156,
        featured: true,
        children: [
          { id: 'iphone', name: 'iPhone', slug: 'iphone', href: '/categories/electronics/smartphones/iphone', productCount: 45 },
          { id: 'samsung', name: 'Samsung', slug: 'samsung', href: '/categories/electronics/smartphones/samsung', productCount: 67 },
          { id: 'xiaomi', name: 'Xiaomi', slug: 'xiaomi', href: '/categories/electronics/smartphones/xiaomi', productCount: 44, badge: { text: 'Popular', variant: 'secondary' } }
        ]
      },
      {
        id: 'laptops',
        name: 'Laptops',
        slug: 'laptops',
        href: '/categories/electronics/laptops',
        productCount: 89,
        children: [
          { id: 'gaming', name: 'Gaming Laptops', slug: 'gaming', href: '/categories/electronics/laptops/gaming', productCount: 23 },
          { id: 'business', name: 'Business Laptops', slug: 'business', href: '/categories/electronics/laptops/business', productCount: 34 },
          { id: 'ultrabook', name: 'Ultrabooks', slug: 'ultrabook', href: '/categories/electronics/laptops/ultrabook', productCount: 32 }
        ]
      }
    ],
    featuredProducts: [
      {
        id: '1',
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        imageUrl: '/placeholder-product.jpg',
        price: 5999,
        originalPrice: 6499,
        badge: 'New'
      }
    ],
    promotionalBanner: {
      title: 'Tech Sale',
      description: 'Save up to 50% on selected electronics',
      imageUrl: '/placeholder-banner.jpg',
      ctaText: 'Shop Now',
      ctaHref: '/deals/electronics'
    }
  },
  {
    title: 'Fashion',
    categories: [
      {
        id: 'mens',
        name: "Men's Fashion",
        slug: 'mens',
        href: '/categories/fashion/mens',
        productCount: 234,
        children: [
          { id: 'shirts', name: 'Shirts', slug: 'shirts', href: '/categories/fashion/mens/shirts', productCount: 78 },
          { id: 'pants', name: 'Pants', slug: 'pants', href: '/categories/fashion/mens/pants', productCount: 89 },
          { id: 'shoes', name: 'Shoes', slug: 'shoes', href: '/categories/fashion/mens/shoes', productCount: 67 }
        ]
      },
      {
        id: 'womens',
        name: "Women's Fashion",
        slug: 'womens',
        href: '/categories/fashion/womens',
        productCount: 345,
        featured: true,
        children: [
          { id: 'dresses', name: 'Dresses', slug: 'dresses', href: '/categories/fashion/womens/dresses', productCount: 123 },
          { id: 'tops', name: 'Tops', slug: 'tops', href: '/categories/fashion/womens/tops', productCount: 156 },
          { id: 'accessories', name: 'Accessories', slug: 'accessories', href: '/categories/fashion/womens/accessories', productCount: 66, badge: { text: 'Trending', variant: 'destructive' } }
        ]
      }
    ]
  }
];

export default MegaMenu;