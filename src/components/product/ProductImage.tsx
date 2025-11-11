/**
 * Product Image Component - JRM E-commerce Platform
 * Optimized product image display with modern design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';

export interface ProductImageProps {
  images: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  productName: string;
  metaTitle?: string;
  variant?: 'default' | 'compact' | 'featured';
  aspectRatio?: '1:1' | '4:5' | '3:4';
  showImageCount?: boolean;
  onImageClick?: () => void;
  className?: string;
}

const aspectRatioClasses = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '3:4': 'aspect-[3/4]',
};

const variantClasses = {
  default: 'rounded-lg',
  compact: 'rounded-md',
  featured: 'rounded-xl',
};

export function ProductImage({
  images,
  productName,
  metaTitle,
  variant = 'default',
  aspectRatio = '1:1',
  showImageCount = false,
  onImageClick,
  className,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const primaryImage = images?.find(img => img.isPrimary) || images?.[0];
  const hasMultipleImages = images?.length > 1;

  if (!primaryImage || imageError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          aspectRatioClasses[aspectRatio],
          variantClasses[variant],
          'flex items-center justify-center',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm">No Image</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden group',
        aspectRatioClasses[aspectRatio],
        variantClasses[variant],
        onImageClick && 'cursor-pointer',
        className
      )}
      onClick={onImageClick}
    >
      {/* Main Image */}
      <Image
        src={primaryImage.url}
        alt={metaTitle || primaryImage.altText || productName}
        fill
        className={cn(
          'object-cover transition-all duration-300',
          'group-hover:scale-105',
          isLoading && 'scale-110 blur-sm'
        )}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={variant === 'featured'}
        quality={variant === 'featured' ? 95 : 85}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />

      {/* Loading State */}
      {isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Hover Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/0 transition-all duration-300',
          'group-hover:bg-black/10'
        )}
      />

      {/* Image Count Indicator */}
      {showImageCount && hasMultipleImages && (
        <div
          className={cn(
            'absolute bottom-2 right-2',
            'bg-black/60 backdrop-blur-sm text-white',
            'text-xs px-2 py-1 rounded-md',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
        >
          +{images.length - 1}
        </div>
      )}

      {/* Quick View Hint */}
      {onImageClick && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
        >
          <div
            className={cn(
              'bg-white/90 backdrop-blur-sm text-foreground',
              'px-3 py-1.5 rounded-md text-sm font-medium',
              'shadow-lg'
            )}
          >
            Quick View
          </div>
        </div>
      )}

      {/* Zoom Icon */}
      {onImageClick && (
        <div
          className={cn(
            'absolute top-2 right-2',
            'w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'shadow-md'
          )}
        >
          <svg
            className="w-4 h-4 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Specialized image components
export const CompactProductImage = ({
  className,
  ...props
}: Omit<ProductImageProps, 'variant'>) => (
  <ProductImage variant="compact" className={className} {...props} />
);

export const FeaturedProductImage = ({
  className,
  ...props
}: Omit<ProductImageProps, 'variant'>) => (
  <ProductImage variant="featured" className={className} {...props} />
);

export default ProductImage;
