'use client';

/**
 * Product Card Block Component
 * Displays a product card within Click Pages
 *
 * IMPORTANT: This component MUST reuse the existing ProductCard component
 * from src/components/product/ProductCard.tsx to maintain Single Source of Truth
 */

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductPricingData } from '@/lib/types/pricing';
import type { ProductCardBlock as ProductCardBlockType } from '@/types/click-page.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ProductCardBlockProps {
  block: ProductCardBlockType;
  onProductClick?: (productId: string, productSlug: string) => void;
}

export function ProductCardBlockComponent({
  block,
  onProductClick
}: ProductCardBlockProps) {
  const [product, setProduct] = useState<ProductPricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { settings } = block;

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        if (!settings.productId) {
          setError('No product selected');
          return;
        }

        const response = await fetch(`/api/public/products/${settings.productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found or deleted');
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [settings.productId]);

  // Handle product click for analytics
  const handleProductClick = () => {
    if (product && onProductClick) {
      onProductClick(product.id, product.slug);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Skeleton className="w-full h-96 rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <Alert variant="destructive" className="max-w-sm mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Unable to display product'}
        </AlertDescription>
      </Alert>
    );
  }

  // Determine display options based on layout
  const showDescription = settings.layout !== 'compact' && settings.showDescription;
  const showRating = settings.layout !== 'compact' && settings.showRating;

  // Container width class based on layout
  const widthClass = settings.fullWidth
    ? 'w-full'
    : settings.layout === 'detailed'
      ? 'max-w-md mx-auto'
      : 'max-w-sm mx-auto';

  return (
    <div className={widthClass} onClick={handleProductClick}>
      <ProductCard
        product={product}
        size={settings.layout === 'compact' ? 'sm' : 'md'}
        showDescription={showDescription}
        showRating={showRating}
        className="h-full"
      />
    </div>
  );
}

export default ProductCardBlockComponent;
