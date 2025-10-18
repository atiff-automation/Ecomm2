/**
 * Product Actions Component - JRM E-commerce Platform
 * Modern product action buttons with design system integration
 * Based on ECOMMERCE_UI_IMPROVEMENT_PLAN.md specifications
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { designSystem } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Heart,
  Eye,
  Compare,
  Share2,
  Plus,
  Minus,
  Check,
  Loader2,
} from 'lucide-react';

export interface ProductActionsProps {
  productId: string;
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  layout?: 'horizontal' | 'vertical' | 'grid';
  showQuantity?: boolean;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showCompare?: boolean;
  showShare?: boolean;
  isInWishlist?: boolean;
  isInCart?: boolean;
  isInCompare?: boolean;
  stock?: number;
  maxQuantity?: number;
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  onShare?: (productId: string) => void;
  className?: string;
}

const variantClasses = {
  default: {
    container: 'gap-3',
    primary: 'h-10 px-4 text-sm',
    secondary: 'h-10 w-10',
    quantity: 'h-8 w-8',
  },
  compact: {
    container: 'gap-2',
    primary: 'h-8 px-3 text-xs',
    secondary: 'h-8 w-8',
    quantity: 'h-6 w-6',
  },
  featured: {
    container: 'gap-4',
    primary: 'h-12 px-6 text-base',
    secondary: 'h-12 w-12',
    quantity: 'h-10 w-10',
  },
  minimal: {
    container: 'gap-2',
    primary: 'h-9 px-3 text-sm',
    secondary: 'h-9 w-9',
    quantity: 'h-7 w-7',
  },
};

const layoutClasses = {
  horizontal: 'flex flex-row items-center',
  vertical: 'flex flex-col',
  grid: 'grid grid-cols-2 lg:grid-cols-1',
};

export function ProductActions({
  productId,
  variant = 'default',
  layout = 'horizontal',
  showQuantity = true,
  showWishlist = true,
  showQuickView = true,
  showCompare = false,
  showShare = false,
  isInWishlist = false,
  isInCart = false,
  isInCompare = false,
  stock = 10,
  maxQuantity = 10,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  onToggleCompare,
  onShare,
  className,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const classes = variantClasses[variant];
  const isOutOfStock = stock <= 0;
  const maxQty = Math.min(maxQuantity, stock);

  const handleAddToCart = async () => {
    if (isOutOfStock || isLoading) return;

    setIsLoading(true);
    setLoadingAction('addToCart');

    try {
      await onAddToCart?.(productId, quantity);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleToggleWishlist = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('wishlist');

    try {
      await onToggleWishlist?.(productId);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleQuickView = () => {
    onQuickView?.(productId);
  };

  const handleToggleCompare = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('compare');

    try {
      await onToggleCompare?.(productId);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleShare = () => {
    onShare?.(productId);
  };

  const incrementQuantity = () => {
    if (quantity < maxQty) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Quantity selector component
  const QuantitySelector = () => (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className={cn(classes.quantity, 'p-0')}
        onClick={decrementQuantity}
        disabled={quantity <= 1 || isLoading}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <span
        className={cn(
          'min-w-8 text-center text-sm font-medium',
          variant === 'compact' && 'text-xs min-w-6'
        )}
      >
        {quantity}
      </span>

      <Button
        variant="outline"
        size="sm"
        className={cn(classes.quantity, 'p-0')}
        onClick={incrementQuantity}
        disabled={quantity >= maxQty || isLoading}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );

  // Secondary actions (wishlist, compare, share, etc.)
  const SecondaryActions = () => (
    <>
      {showWishlist && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            classes.secondary,
            'p-0',
            isInWishlist && 'text-destructive border-destructive'
          )}
          onClick={handleToggleWishlist}
          disabled={isLoading}
          title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {loadingAction === 'wishlist' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-current')} />
          )}
        </Button>
      )}

      {showQuickView && (
        <Button
          variant="outline"
          size="sm"
          className={cn(classes.secondary, 'p-0')}
          onClick={handleQuickView}
          title="Quick view"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {showCompare && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            classes.secondary,
            'p-0',
            isInCompare && 'text-primary border-primary'
          )}
          onClick={handleToggleCompare}
          disabled={isLoading}
          title={isInCompare ? 'Remove from compare' : 'Add to compare'}
        >
          {loadingAction === 'compare' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Compare className="h-4 w-4" />
          )}
        </Button>
      )}

      {showShare && (
        <Button
          variant="outline"
          size="sm"
          className={cn(classes.secondary, 'p-0')}
          onClick={handleShare}
          title="Share product"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </>
  );

  return (
    <div className={cn(layoutClasses[layout], classes.container, className)}>
      {/* Primary Action - Add to Cart */}
      <div
        className={cn(
          'flex items-center gap-2',
          layout === 'vertical' && 'w-full'
        )}
      >
        {showQuantity && !isOutOfStock && <QuantitySelector />}

        <Button
          variant={isInCart ? 'secondary' : 'default'}
          size="sm"
          className={cn(
            classes.primary,
            'flex-1 min-w-0',
            layout === 'vertical' && 'w-full'
          )}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isLoading}
        >
          {loadingAction === 'addToCart' && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          {isInCart && !isLoading && <Check className="h-4 w-4 mr-2" />}
          {!isInCart && !isLoading && <ShoppingCart className="h-4 w-4 mr-2" />}

          <span className="truncate">
            {isOutOfStock
              ? 'Out of Stock'
              : isInCart
                ? 'In Cart'
                : 'Add to Cart'}
          </span>
        </Button>
      </div>

      {/* Secondary Actions */}
      {layout === 'horizontal' && (
        <div className="flex items-center gap-2">
          <SecondaryActions />
        </div>
      )}

      {layout === 'vertical' && (
        <div className="flex justify-center gap-2 w-full">
          <SecondaryActions />
        </div>
      )}

      {layout === 'grid' && (
        <>
          <SecondaryActions />
        </>
      )}

      {/* Stock indicator for low stock */}
      {stock > 0 && stock <= 3 && (
        <div
          className={cn(
            'text-xs text-destructive font-medium',
            layout === 'horizontal' && 'ml-auto',
            layout === 'vertical' && 'text-center',
            layout === 'grid' && 'col-span-2 text-center'
          )}
        >
          Only {stock} left!
        </div>
      )}
    </div>
  );
}

// Specialized action components
export const CompactProductActions = ({
  className,
  ...props
}: Omit<ProductActionsProps, 'variant'>) => (
  <ProductActions variant="compact" className={className} {...props} />
);

export const FeaturedProductActions = ({
  className,
  ...props
}: Omit<ProductActionsProps, 'variant'>) => (
  <ProductActions variant="featured" className={className} {...props} />
);

export const MinimalProductActions = ({
  className,
  ...props
}: Omit<ProductActionsProps, 'variant'>) => (
  <ProductActions
    variant="minimal"
    showQuantity={false}
    showCompare={false}
    showShare={false}
    className={className}
    {...props}
  />
);

// Quick add to cart button for minimal interactions
export interface QuickAddButtonProps {
  productId: string;
  isInCart?: boolean;
  isOutOfStock?: boolean;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export function QuickAddButton({
  productId,
  isInCart = false,
  isOutOfStock = false,
  onAddToCart,
  className,
}: QuickAddButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isOutOfStock || isLoading) return;

    setIsLoading(true);
    try {
      await onAddToCart?.(productId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isInCart ? 'secondary' : 'default'}
      size="sm"
      className={cn(
        'h-8 w-8 p-0 rounded-full',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        className
      )}
      onClick={handleClick}
      disabled={isOutOfStock || isLoading}
      title={
        isOutOfStock ? 'Out of stock' : isInCart ? 'In cart' : 'Add to cart'
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isInCart ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
}

export default ProductActions;
