/**
 * Product Price Component - JRM E-commerce Platform
 * Modern product price display with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem, productTypography } from '@/lib/design-system';

export interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  variant?: 'default' | 'compact' | 'featured' | 'large';
  showDiscount?: boolean;
  discountType?: 'percentage' | 'amount';
  isMemberPrice?: boolean;
  memberPrice?: number;
  className?: string;
}

const variantClasses = {
  default: {
    price: 'text-lg font-bold',
    original: 'text-sm text-muted-foreground line-through',
    discount: 'text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded-md',
    member: 'text-sm text-primary font-medium'
  },
  compact: {
    price: 'text-base font-semibold',
    original: 'text-xs text-muted-foreground line-through',
    discount: 'text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded',
    member: 'text-xs text-primary font-medium'
  },
  featured: {
    price: 'text-2xl font-bold',
    original: 'text-lg text-muted-foreground line-through',
    discount: 'text-sm bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg',
    member: 'text-base text-primary font-semibold'
  },
  large: {
    price: 'text-3xl font-bold',
    original: 'text-xl text-muted-foreground line-through',
    discount: 'text-base bg-destructive text-destructive-foreground px-4 py-2 rounded-lg',
    member: 'text-lg text-primary font-semibold'
  }
};

export function ProductPrice({
  price,
  originalPrice,
  currency = 'RM',
  variant = 'default',
  showDiscount = true,
  discountType = 'percentage',
  isMemberPrice = false,
  memberPrice,
  className
}: ProductPriceProps) {
  const classes = variantClasses[variant];

  // Calculate discount
  const hasDiscount = originalPrice && originalPrice > price;
  const discountAmount = hasDiscount ? originalPrice - price : 0;
  const discountPercentage = hasDiscount ? Math.round((discountAmount / originalPrice) * 100) : 0;

  // Determine display price (member price takes precedence)
  const displayPrice = isMemberPrice && memberPrice ? memberPrice : price;
  const showMemberSavings = isMemberPrice && memberPrice && memberPrice < price;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency === 'RM' ? 'MYR' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Main Price Section */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Current/Display Price */}
        <span className={cn(
          classes.price,
          'text-foreground',
          isMemberPrice && 'text-primary'
        )}>
          {formatPrice(displayPrice)}
        </span>

        {/* Original Price (if discounted) */}
        {hasDiscount && (
          <span className={classes.original}>
            {formatPrice(originalPrice)}
          </span>
        )}

        {/* Discount Badge */}
        {hasDiscount && showDiscount && (
          <span className={classes.discount}>
            {discountType === 'percentage'
              ? `-${discountPercentage}%`
              : `-${formatPrice(discountAmount)}`
            }
          </span>
        )}
      </div>

      {/* Member Price Section */}
      {showMemberSavings && (
        <div className="flex items-center gap-2">
          <span className={classes.member}>
            Member saves {formatPrice(price - memberPrice)}
          </span>
          <div className={cn(
            'w-2 h-2 rounded-full bg-primary',
            'animate-pulse'
          )} />
        </div>
      )}

      {/* Member Price Indicator */}
      {isMemberPrice && !showMemberSavings && (
        <span className={classes.member}>
          Member Price
        </span>
      )}

      {/* Price per unit (if applicable) */}
      {variant === 'featured' && (
        <span className="text-xs text-muted-foreground">
          Free shipping on orders over RM100
        </span>
      )}
    </div>
  );
}

// Specialized price components
export const CompactProductPrice = ({ className, ...props }: Omit<ProductPriceProps, 'variant'>) => (
  <ProductPrice variant="compact" className={className} {...props} />
);

export const FeaturedProductPrice = ({ className, ...props }: Omit<ProductPriceProps, 'variant'>) => (
  <ProductPrice variant="featured" className={className} {...props} />
);

export const LargeProductPrice = ({ className, ...props }: Omit<ProductPriceProps, 'variant'>) => (
  <ProductPrice variant="large" className={className} {...props} />
);

// Price comparison component for multiple pricing tiers
export interface PriceComparisonProps {
  prices: Array<{
    label: string;
    price: number;
    originalPrice?: number;
    isMemberPrice?: boolean;
    isRecommended?: boolean;
  }>;
  currency?: string;
  className?: string;
}

export function PriceComparison({ prices, currency = 'RM', className }: PriceComparisonProps) {
  return (
    <div className={cn('grid gap-3', className)}>
      {prices.map((priceOption, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            priceOption.isRecommended && 'border-primary bg-primary/5',
            !priceOption.isRecommended && 'border-border'
          )}
        >
          <div className="flex flex-col">
            <span className={cn(
              'font-medium',
              priceOption.isRecommended && 'text-primary'
            )}>
              {priceOption.label}
            </span>
            {priceOption.isRecommended && (
              <span className="text-xs text-primary">Recommended</span>
            )}
          </div>

          <ProductPrice
            price={priceOption.price}
            originalPrice={priceOption.originalPrice}
            currency={currency}
            variant="compact"
            isMemberPrice={priceOption.isMemberPrice}
          />
        </div>
      ))}
    </div>
  );
}

export default ProductPrice;