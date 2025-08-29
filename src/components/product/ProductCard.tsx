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
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { usePricing } from '@/hooks/use-pricing';
import { ProductPricingData } from '@/lib/types/pricing';

interface ProductCardProps {
  product: ProductPricingData & {
    name: string;
    slug: string;
    shortDescription?: string;
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
  showDescription?: boolean;
  showRating?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  onAddToCart,
  size = 'md',
  showDescription = true,
  showRating = true,
  className = '',
}: ProductCardProps) {
  // Get all pricing data from centralized service
  const pricing = usePricing(product);

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

  const handleAddToCart = async () => {
    if (onAddToCart) {
      await onAddToCart(product.id);
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card
        className={`group hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
      >
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

          {/* Badges from centralized pricing service */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {pricing.badges.map((badge, index) => (
              <Badge
                key={`${badge.type}-${index}`}
                variant={badge.variant}
                className={badge.className}
              >
                {badge.text}
              </Badge>
            ))}
          </div>

          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.preventDefault()}
          >
            <WishlistButton
              productId={product.id}
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
            />
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Category */}
            <span className="text-xs text-muted-foreground">
              {product.categories?.[0]?.category?.name || 'Uncategorized'}
            </span>

            {/* Product Name */}
            <h3
              className={`font-semibold line-clamp-2 hover:text-primary transition-colors ${sizeClasses[size]}`}
            >
              {product.name}
            </h3>

            {/* Description */}
            {showDescription && product.shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.shortDescription}
              </p>
            )}

            {/* Rating */}
            {showRating && product.averageRating > 0 && (
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

            {/* Centralized Pricing Display */}
            <div className="space-y-1" aria-label={pricing.priceDescription}>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold ${sizeClasses[size]} ${pricing.displayClasses.priceColor}`}
                >
                  {pricing.formattedPrice}
                </span>
                {pricing.priceType === 'early-access' && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-800"
                  >
                    Early Access
                  </Badge>
                )}
                {pricing.priceType === 'promotional' && (
                  <Badge variant="destructive" className="text-xs">
                    Promo
                  </Badge>
                )}
                {pricing.priceType === 'member' && (
                  <Badge variant="secondary" className="text-xs">
                    Member
                  </Badge>
                )}
              </div>

              {/* Show original price and savings */}
              {pricing.showSavings && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    {pricing.formattedOriginalPrice}
                  </span>
                  <span
                    className={`text-xs font-medium ${pricing.displayClasses.savingsColor}`}
                  >
                    Save {pricing.formattedSavings}
                  </span>
                </div>
              )}

              {/* Show member price preview for non-members */}
              {pricing.showMemberPreview && (
                <div className="text-xs text-muted-foreground">
                  {pricing.memberPreviewText}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              disabled={product.stockQuantity === 0}
              onClick={async e => {
                e.preventDefault();
                e.stopPropagation();
                await handleAddToCart();
              }}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
