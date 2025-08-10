/**
 * Product Recommendations Component - Malaysian E-commerce Platform
 * Displays personalized product recommendations based on user behavior
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  categories: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  primaryImage?: {
    url: string;
    altText?: string;
  };
}

interface ProductRecommendationsProps {
  type?: 'general' | 'similar' | 'trending' | 'category';
  productId?: string;
  categoryId?: string;
  limit?: number;
  title?: string;
  description?: string;
  showHeader?: boolean;
  className?: string;
}

export function ProductRecommendations({
  type = 'general',
  productId,
  categoryId,
  limit = 8,
  title,
  description,
  showHeader = true,
  className = '',
}: ProductRecommendationsProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch recommendations
  const fetchRecommendations = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          type,
          limit: limit.toString(),
        });

        if (productId) {
          params.append('productId', productId);
        }
        if (categoryId) {
          params.append('categoryId', categoryId);
        }

        const response = await fetch(`/api/recommendations?${params}`);

        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations);
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [type, productId, categoryId, limit]
  );

  // Add to cart functionality
  const addToCart = async (productId: string) => {
    if (!isLoggedIn) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        // TODO: Add toast notification
        // Success handled silently for now
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add to cart');
      }
    } catch {
      // Handle error silently
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const getHeaderIcon = () => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="w-5 h-5" />;
      case 'similar':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'trending':
        return 'Trending Products';
      case 'similar':
        return 'Similar Products';
      case 'category':
        return 'More in This Category';
      default:
        return isLoggedIn ? 'Recommended for You' : 'Featured Products';
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case 'trending':
        return 'Popular products that other customers love';
      case 'similar':
        return "Products similar to what you're viewing";
      case 'category':
        return 'Discover more products in this category';
      default:
        return isLoggedIn
          ? 'Personalized recommendations based on your preferences'
          : 'Handpicked products just for you';
    }
  };

  if (loading || recommendations.length === 0) {
    if (loading) {
      return (
        <div className={className}>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading recommendations...</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getHeaderIcon()}
              <h2 className="text-xl font-semibold">
                {title || getDefaultTitle()}
              </h2>
              {isLoggedIn && type === 'general' && (
                <Badge variant="secondary" className="text-xs">
                  Personalized
                </Badge>
              )}
            </div>
            {(description || !title) && (
              <p className="text-sm text-muted-foreground">
                {description || getDefaultDescription()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing}
              className="text-muted-foreground"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {recommendations.map(product => {
          const showMemberPrice = isLoggedIn && isMember;
          // const savings = product.regularPrice - product.memberPrice;

          return (
            <Card
              key={product.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                {product.primaryImage ? (
                  <Image
                    src={product.primaryImage.url}
                    alt={product.primaryImage.altText || product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.featured && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500 text-white text-xs"
                    >
                      Featured
                    </Badge>
                  )}
                  {product.stockQuantity === 0 && (
                    <Badge variant="outline" className="bg-white text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <WishlistButton
                    productId={product.id}
                    size="sm"
                    variant="secondary"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                  />
                </div>
              </div>

              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Category */}
                  <Link
                    href={`/products?category=${product.categories?.[0]?.category?.id || ''}`}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {product.categories?.[0]?.category?.name || 'Uncategorized'}
                  </Link>

                  {/* Product Name */}
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.averageRating > 0 && (
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

                  {/* Pricing */}
                  <div className="space-y-1">
                    {showMemberPrice ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm text-green-600">
                            {formatPrice(product.memberPrice)}
                          </span>
                          <Badge variant="secondary" className="text-xs py-0">
                            Member
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.regularPrice)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-sm">
                          {formatPrice(product.regularPrice)}
                        </span>
                        {!isLoggedIn &&
                          product.memberPrice < product.regularPrice && (
                            <div className="text-xs text-muted-foreground">
                              Member: {formatPrice(product.memberPrice)}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Quick Add to Cart */}
                  <Button
                    size="sm"
                    className="w-full text-xs h-8"
                    disabled={product.stockQuantity === 0}
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {product.stockQuantity === 0
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </Button>

                  {/* Stock Warning */}
                  {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                    <p className="text-xs text-orange-600">
                      Only {product.stockQuantity} left
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
