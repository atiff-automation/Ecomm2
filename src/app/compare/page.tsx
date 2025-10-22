'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Star, ShoppingCart, Eye, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  regularPrice: number;
  memberPrice: number;
  images: string[];
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

interface Specification {
  key: string;
  label: string;
  values: Record<string, string | number | null>;
}

export default function ComparisonPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ComparisonProduct[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComparison = useCallback(async (productIds: string[]) => {
    if (productIds.length < 2) {
      setError('Please select at least 2 products to compare');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithCSRF('/api/products/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to load comparison data');
      }

      const data = await response.json();
      setProducts(data.products);
      setSpecifications(data.specifications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load comparison'
      );
      setProducts([]);
      setSpecifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || [];
    if (productIds.length > 0) {
      loadComparison(productIds);
    } else {
      setLoading(false);
      setError('No products selected for comparison');
    }
  }, [searchParams, loadComparison]);

  const removeProduct = (productIdToRemove: string) => {
    const currentProductIds = searchParams.get('products')?.split(',') || [];
    const updatedProductIds = currentProductIds.filter(
      id => id !== productIdToRemove
    );

    if (updatedProductIds.length > 0) {
      const params = new URLSearchParams();
      params.set('products', updatedProductIds.join(','));
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${params}`
      );
      loadComparison(updatedProductIds);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
      setProducts([]);
      setSpecifications([]);
      setError('No products selected for comparison');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h1 className="text-2xl font-bold mb-4">Product Comparison</h1>
            <p className="text-muted-foreground mb-6 text-center">
              {error ||
                'No products selected for comparison. Browse our products and add them to compare.'}
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Product Comparison</h1>
        <p className="text-muted-foreground">
          Compare {products.length} products side by side
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Product Headers */}
          <div
            className="grid grid-cols-1 gap-4 mb-6"
            style={{
              gridTemplateColumns: `300px repeat(${products.length}, 250px)`,
            }}
          >
            <div className="font-medium">Product</div>
            {products.map(product => (
              <Card key={product.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
                  onClick={() => removeProduct(product.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardContent className="p-4">
                  <div className="aspect-square relative mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        quality={100}
                        unoptimized={true}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <Badge variant="outline" className="text-xs mb-3">
                    {product.categories?.[0]?.category?.name || 'Uncategorized'}
                  </Badge>
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.averageRating)
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
                  <div className="space-y-2">
                    <Link href={`/products/${product.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button size="sm" className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card>
            <CardContent className="p-0">
              {specifications.map((spec, index) => (
                <div key={spec.key}>
                  <div
                    className="grid items-center py-3 px-4"
                    style={{
                      gridTemplateColumns: `300px repeat(${products.length}, 250px)`,
                    }}
                  >
                    <div className="font-medium text-sm">{spec.label}</div>
                    {products.map(product => (
                      <div key={product.id} className="text-sm">
                        {spec.values[product.id] !== null ? (
                          <span>{spec.values[product.id]}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {index < specifications.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/products">
          <Button variant="outline">Browse More Products</Button>
        </Link>
      </div>
    </div>
  );
}
