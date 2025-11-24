/**
 * ProductShowcase Component
 * Displays featured products in landing pages with multiple layout options
 * Supports GRID, CAROUSEL, and FEATURED layouts
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing-page-constants';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ProductShowcaseProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  stock: number;
  status: string;
  category?: {
    name: string;
  } | null;
}

interface ProductShowcaseProps {
  products: ProductShowcaseProduct[];
  layout: 'GRID' | 'CAROUSEL' | 'FEATURED';
  onProductClick?: (productId: string) => void;
}

function ProductCompactCard({ product }: { product: ProductShowcaseProduct }) {
  const primaryImage =
    product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
      )
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-600 text-white">
              -{discountPercentage}%
            </Badge>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 flex-1 flex flex-col">
          <h3
            className="font-medium line-clamp-2 text-sm mb-2 min-h-[2.5rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {product.category && (
            <p className="text-xs text-muted-foreground mb-2">
              {product.category.name}
            </p>
          )}

          <div className="mt-auto space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">
                RM {product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  RM {product.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function GridLayout({ products }: { products: ProductShowcaseProduct[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCompactCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function CarouselLayout({ products }: { products: ProductShowcaseProduct[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [autoplayEnabled] = useState(
    LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.LAYOUTS.CAROUSEL.autoplay
  );

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  useEffect(() => {
    if (!autoplayEnabled) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextScroll = container.scrollLeft + container.clientWidth;

      if (nextScroll >= maxScroll) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
      }
    }, LANDING_PAGE_CONSTANTS.PRODUCT_SHOWCASE.LAYOUTS.CAROUSEL.interval);

    return () => clearInterval(interval);
  }, [autoplayEnabled]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        onScroll={checkScrollButtons}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)] snap-start"
          >
            <ProductCompactCard product={product} />
          </div>
        ))}
      </div>

      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function FeaturedLayout({ products }: { products: ProductShowcaseProduct[] }) {
  if (products.length === 0) return null;

  const heroProduct = products[0];
  const otherProducts = products.slice(1, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hero Product - Large */}
      <div className="lg:row-span-2">
        <Link href={`/products/${heroProduct.slug}`}>
          <Card className="group hover:shadow-xl transition-all duration-200 cursor-pointer h-full">
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              {heroProduct.images?.[0] ? (
                <Image
                  src={heroProduct.images[0].url}
                  alt={heroProduct.images[0].altText || heroProduct.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              {heroProduct.compareAtPrice &&
                heroProduct.compareAtPrice > heroProduct.price && (
                  <Badge className="absolute top-4 left-4 bg-red-600 text-white text-lg px-4 py-2">
                    -
                    {Math.round(
                      ((heroProduct.compareAtPrice - heroProduct.price) /
                        heroProduct.compareAtPrice) *
                        100
                    )}
                    %
                  </Badge>
                )}
            </div>

            <CardContent className="p-6">
              <h3 className="font-bold text-2xl mb-2">{heroProduct.name}</h3>
              {heroProduct.category && (
                <p className="text-muted-foreground mb-4">
                  {heroProduct.category.name}
                </p>
              )}
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold text-3xl">
                  RM {heroProduct.price.toFixed(2)}
                </span>
                {heroProduct.compareAtPrice &&
                  heroProduct.compareAtPrice > heroProduct.price && (
                    <span className="text-muted-foreground line-through text-lg">
                      RM {heroProduct.compareAtPrice.toFixed(2)}
                    </span>
                  )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Other Products - Smaller Grid */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-4 content-start">
        {otherProducts.map((product) => (
          <ProductCompactCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase({
  products,
  layout,
  onProductClick,
}: ProductShowcaseProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const handleProductClick = (productId: string) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-16">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <p className="text-sm md:text-base text-gray-600">
            Discover our hand-picked selection
          </p>
        </div>

        {layout === 'GRID' && <GridLayout products={products} />}
        {layout === 'CAROUSEL' && <CarouselLayout products={products} />}
        {layout === 'FEATURED' && <FeaturedLayout products={products} />}
      </div>
    </section>
  );
}
