/**
 * Recently Viewed Products Component - Malaysian E-commerce Platform
 * Displays user's recently viewed products with quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, Clock, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';

interface RecentlyViewedItem {
  id: string;
  viewedAt: string;
  product: {
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
    category: {
      id: string;
      name: string;
      slug: string;
    };
    primaryImage?: {
      url: string;
      altText?: string;
    };
  };
}

interface RecentlyViewedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  horizontal?: boolean;
}

export function RecentlyViewed({
  limit = 8,
  showHeader = true,
  className = '',
  horizontal = true,
}: RecentlyViewedProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch recently viewed products
  const fetchRecentlyViewed = async () => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }

    try {
      // setLoading(true);
      const response = await fetch(`/api/recently-viewed?limit=${limit}`);

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all recently viewed
  const clearRecentlyViewed = async () => {
    if (!isLoggedIn || !confirm('Clear all recently viewed products?')) return;

    try {
      const response = await fetch('/api/recently-viewed', {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error('Failed to clear recently viewed:', error);
    }
  };

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
        console.log('Added to cart successfully');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
  }, [isLoggedIn, limit]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatViewedTime = (dateString: string) => {
    const now = new Date();
    const viewed = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - viewed.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (!isLoggedIn || items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Recently Viewed</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
            {items.length > limit && (
              <Link href="/recently-viewed">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        className={`grid gap-4 ${
          horizontal
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {items.map(item => {
          const showMemberPrice = isLoggedIn && isMember;
          const savings = item.product.regularPrice - item.product.memberPrice;

          return (
            <Card
              key={item.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                {item.product.primaryImage ? (
                  <Image
                    src={item.product.primaryImage.url}
                    alt={item.product.primaryImage.altText || item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}

                {/* Viewed Time Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-white/90 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    {formatViewedTime(item.viewedAt)}
                  </Badge>
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <WishlistButton
                    productId={item.product.id}
                    size="sm"
                    variant="secondary"
                    className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                  />
                </div>

                {/* Stock Status */}
                {item.product.stockQuantity === 0 && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="bg-white/90">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Category */}
                  <Link
                    href={`/products?category=${item.product.category.id}`}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {item.product.category.name}
                  </Link>

                  {/* Product Name */}
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {item.product.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= item.product.averageRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({item.product.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="space-y-1">
                    {showMemberPrice ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm text-green-600">
                            {formatPrice(item.product.memberPrice)}
                          </span>
                          <Badge variant="secondary" className="text-xs py-0">
                            Member
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.product.regularPrice)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-sm">
                          {formatPrice(item.product.regularPrice)}
                        </span>
                        {!isLoggedIn &&
                          item.product.memberPrice <
                            item.product.regularPrice && (
                            <div className="text-xs text-muted-foreground">
                              Member: {formatPrice(item.product.memberPrice)}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Quick Add to Cart */}
                  <Button
                    size="sm"
                    className="w-full text-xs h-8"
                    disabled={item.product.stockQuantity === 0}
                    onClick={() => addToCart(item.product.id)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {item.product.stockQuantity === 0
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </Button>

                  {/* Stock Warning */}
                  {item.product.stockQuantity <= 5 &&
                    item.product.stockQuantity > 0 && (
                      <p className="text-xs text-orange-600">
                        Only {item.product.stockQuantity} left
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
