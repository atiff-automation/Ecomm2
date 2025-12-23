/**
 * ProductCard Component - Malaysian E-commerce Platform
 * Centralized product card using new pricing service architecture
 *
 * This component eliminates business logic duplication by using
 * the centralized pricing service for all pricing calculations.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star } from 'lucide-react';
import { usePricing } from '@/hooks/use-pricing';
import { ProductPricingData } from '@/lib/types/pricing';

interface ProductCardProps {
  product: ProductPricingData & {
    name: string;
    slug: string;
    shortDescription?: string;
    metaTitle?: string;
    averageRating: number;
    reviewCount: number;
    categories: Array<{
      category: {
        name: string;
        slug: string;
      };
    }>;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
  };
  onAddToCart?: (productId: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'compact' | 'standard' | 'detailed'; // Click Pages layout control
  showDescription?: boolean;
  showRating?: boolean;
  showMemberPrice?: boolean; // Control member price visibility
  showStock?: boolean; // Control stock status visibility
  ctaAction?: 'view' | 'cart'; // CTA button action
  ctaText?: string; // Custom CTA text
  className?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  size = 'md',
  layout, // Optional: overrides size if provided
  showDescription: _showDescription = true, // Reserved for future use
  showRating = true,
  showMemberPrice = true,
  showStock = false,
  ctaAction = 'cart',
  ctaText,
  className = '',
}: ProductCardProps) {
  // Acknowledge unused param for backward compatibility
  void _showDescription;
  // Get all pricing data from centralized service
  const pricing = usePricing(product);

  // Separate badges by position for Shopee-style layout
  const imageBadges = pricing.badges.filter(
    badge => badge.position === 'onImage'
  );
  const belowPriceBadges = pricing.badges.filter(
    badge => badge.position === 'belowPrice'
  );

  const primaryImage =
    product.images?.find(img => img.isPrimary) || product.images?.[0];

  // Check if user doesn't have access, but don't return early to maintain hook consistency
  const isRestricted =
    pricing.effectivePrice === 0 &&
    pricing.priceDescription.includes('restricted');

  // Don't render anything if restricted, but maintain component structure
  if (isRestricted) {
    return <div className="hidden" />;
  }

  // Compute effective layout (layout prop overrides size prop)
  const effectiveLayout =
    layout ||
    (size === 'sm' ? 'compact' : size === 'lg' ? 'detailed' : 'standard');

  // Layout-based styling configuration
  const layoutConfig = {
    compact: {
      imageAspect: 'aspect-[3/4]',
      cardPadding: 'p-2',
      nameSize: 'text-xs sm:text-sm',
      nameLines: 'line-clamp-2',
      priceSize: 'text-sm',
      buttonSize: 'h-8 text-xs',
      showExtended: false,
    },
    standard: {
      imageAspect: 'aspect-[4/5]',
      cardPadding: 'p-2 sm:p-3',
      nameSize: 'text-[14px] sm:text-[14px]',
      nameLines: 'line-clamp-2',
      priceSize: 'text-base',
      buttonSize: 'h-10 sm:h-10',
      showExtended: true,
    },
    detailed: {
      imageAspect: 'aspect-[3/4]',
      cardPadding: 'p-3 sm:p-4',
      nameSize: 'text-base sm:text-lg',
      nameLines: 'line-clamp-3',
      priceSize: 'text-lg',
      buttonSize: 'h-12',
      showExtended: true,
    },
  };

  const config = layoutConfig[effectiveLayout];

  const handleAddToCart = async () => {
    if (onAddToCart) {
      await onAddToCart(product.id);
    }
  };

  // Determine CTA button text
  const buttonText =
    ctaText || (ctaAction === 'view' ? 'View Product' : 'Add to Cart');

  return (
    <Link href={`/products/${product.slug}`}>
      <Card
        className={`group hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col ${className}`}
      >
        <div
          className={`relative ${config.imageAspect} overflow-hidden rounded-t-lg`}
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.metaTitle || primaryImage.altText || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Promotional badges on image top-left - filled style, smaller font */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {imageBadges.map((badge, index) => (
              <Badge
                key={`${badge.type}-${index}`}
                variant={badge.variant}
                className={`${badge.className} text-[10px] px-2 py-0.5 font-semibold`}
              >
                {badge.text}
              </Badge>
            ))}
          </div>
        </div>

        <CardContent className={`${config.cardPadding} flex-1 flex flex-col`}>
          <div className="flex flex-col h-full">
            {/* Top Section - Name, Rating */}
            <div className="flex-1 space-y-1.5 mb-1">
              {/* Product Name - Shopee style mobile sizing */}
              <h3
                className={`font-medium ${config.nameLines} hover:text-primary transition-colors ${config.nameSize} leading-tight min-h-[2.5rem]`}
                title={product.name}
              >
                {product.name}
              </h3>

              {/* Rating - Only show if enabled AND layout supports it */}
              {config.showExtended && showRating && product.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= product.averageRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Section - Price and Button - Reduced gap on mobile */}
            <div className="space-y-2 sm:space-y-2.5">
              {/* Centralized Pricing Display - Layout-responsive sizing */}
              <div className="space-y-1" aria-label={pricing.priceDescription}>
                <div className="flex items-center gap-2">
                  {/* All prices RED globally - layout-based sizing */}
                  <span className={`text-red-600 font-bold ${config.priceSize}`}>
                    RM {pricing.formattedPrice.replace('RM', '').trim()}
                  </span>
                  {pricing.priceType === 'early-access' && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-purple-100 text-purple-800"
                    >
                      Early Access
                    </Badge>
                  )}
                  {pricing.priceType === 'member' && (
                    <>
                      <span className="text-xs font-normal text-black md:hidden">
                        Member Price
                      </span>
                      <Badge
                        variant="outline"
                        className="hidden md:inline-flex text-xs border-black text-black"
                      >
                        Member
                      </Badge>
                    </>
                  )}
                </div>

                {/* Show original price and savings - Smaller on mobile */}
                {pricing.showSavings && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                      {pricing.formattedOriginalPrice}
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium text-red-600">
                      Save {pricing.formattedSavings}
                    </span>
                  </div>
                )}

                {/* Show member price preview for non-members - Conditional on showMemberPrice */}
                {showMemberPrice && pricing.showMemberPreview && (
                  <div className="text-xs text-black font-medium">
                    {pricing.memberPreviewText}
                  </div>
                )}
              </div>

              {/* Feature/Membership badges below price - Shopee style, smaller on mobile */}
              {belowPriceBadges.length > 0 && (
                <div className="flex flex-nowrap md:flex-wrap items-center gap-1.5 overflow-x-auto">
                  {belowPriceBadges.map((badge, index) => {
                    // Shopee-style outline badge colors
                    const colorClasses =
                      badge.outlineColor === 'red'
                        ? 'border-red-500 text-red-500'
                        : badge.outlineColor === 'green'
                          ? 'border-green-600 text-green-600'
                          : 'border-gray-400 text-gray-600';

                    // Shorten text on mobile only
                    const displayText =
                      badge.type === 'qualifying' ? (
                        <>
                          <span className="md:hidden">Membership</span>
                          <span className="hidden md:inline">{badge.text}</span>
                        </>
                      ) : (
                        badge.text
                      );

                    return (
                      <span
                        key={`${badge.type}-${index}`}
                        className={`inline-flex items-center px-1.5 py-0.5 text-[9px] md:text-[10px] font-normal border rounded ${colorClasses} bg-transparent whitespace-nowrap`}
                      >
                        {displayText}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Stock Status Badge - Conditional on showStock */}
              {showStock && (
                <Badge variant="outline" className="text-xs w-fit">
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} in stock`
                    : 'Out of stock'}
                </Badge>
              )}

              {/* CTA Button - Configurable action and text */}
              <Button
                className={`w-full ${config.buttonSize}`}
                disabled={product.stockQuantity === 0}
                onClick={async e => {
                  if (ctaAction === 'cart') {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleAddToCart();
                  }
                  // For 'view' action, let the Link handle navigation
                }}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {product.stockQuantity === 0 ? 'Out of Stock' : buttonText}
              </Button>
            </div>
          </div>
        </CardContent>
    </Card>
    </Link>
  );
}
