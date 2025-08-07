'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendingProduct {
  productId: string;
  productName: string;
  purchaseCount: number;
  slug: string;
}

interface TrendingProductsProps {
  limit?: number;
  showTitle?: boolean;
  variant?: 'card' | 'list' | 'compact';
  className?: string;
}

export default function TrendingProducts({
  limit = 5,
  showTitle = true,
  variant = 'card',
  className,
}: TrendingProductsProps) {
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingProducts();
  }, [limit]);

  const fetchTrendingProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/social-proof/trending?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trending products');
      }

      const data = await response.json();
      setTrendingProducts(data.trendingProducts || []);
    } catch (err) {
      console.error('Error fetching trending products:', err);
      setError('Failed to load trending products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {showTitle && (
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Trending Now</h3>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-100 animate-pulse rounded-lg"
            >
              <div className="h-4 w-4 bg-gray-300 rounded-full" />
              <div className="flex-1 h-4 bg-gray-300 rounded" />
              <div className="h-4 w-12 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || trendingProducts.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {showTitle && (
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Trending</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {trendingProducts.slice(0, 3).map((product, index) => (
            <Link
              key={product.productId}
              href={`/products/${product.slug}`}
              className="group"
            >
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs hover:bg-orange-100 transition-colors"
              >
                <span className="font-bold text-orange-600">#{index + 1}</span>
                <span className="truncate max-w-20">{product.productName}</span>
                <TrendingUp className="h-3 w-3 text-orange-500" />
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {showTitle && (
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Trending Now</h3>
          </div>
        )}

        <div className="space-y-3">
          {trendingProducts.map((product, index) => (
            <Link
              key={product.productId}
              href={`/products/${product.slug}`}
              className="group block"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-orange-200 hover:bg-orange-50 transition-all duration-200">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-sm">
                  #{index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate group-hover:text-orange-700">
                    {product.productName}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>{product.purchaseCount} recent purchases</span>
                  </div>
                </div>

                <div className="flex items-center text-orange-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Trending Now
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {trendingProducts.map((product, index) => (
          <Link
            key={product.productId}
            href={`/products/${product.slug}`}
            className="group block"
          >
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors">
              <div className="relative">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-xs">
                  {index + 1}
                </div>
                {index === 0 && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-orange-700">
                  {product.productName}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  <span>{product.purchaseCount} bought today</span>
                </div>
              </div>

              <div className="flex items-center text-orange-500">
                <TrendingUp className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}

        {trendingProducts.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No trending products at the moment
          </div>
        )}
      </CardContent>
    </Card>
  );
}
