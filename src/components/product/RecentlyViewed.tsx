/**
 * Recently Viewed Products Component - Malaysian E-commerce Platform
 * Displays user's recently viewed products with quick actions
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, Clock, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import config from '@/lib/config/app-config';

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
  limit = config.ui.pagination.defaultPageSize / 2.5, // Default to 8 for UI consistency
  showHeader = true,
  className = '',
  horizontal = true,
}: RecentlyViewedProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [, setLoading] = useState(false);
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { showAlert, AlertDialog } = useAlertDialog();

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch recently viewed products
  const fetchRecentlyViewed = useCallback(async () => {
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
    } catch {
      // Handle error silently for now
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, limit]);

  // Clear all recently viewed
  const clearRecentlyViewed = async () => {
    if (!isLoggedIn) {
      return;
    }

    showConfirmation({
      title: 'Clear Recently Viewed',
      description: 'Are you sure you want to clear all recently viewed products? This action cannot be undone.',
      confirmText: 'Clear All',
      cancelText: 'Keep History',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/recently-viewed', {
            method: 'DELETE',
          });

          if (response.ok) {
            setItems([]);
          }
        } catch {
          // Handle error silently
        }
      },
    });
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
        // Success handled silently for now
      } else {
        const data = await response.json();
        showAlert({
          title: 'Add to Cart Failed',
          description: data.message || 'Failed to add item to cart. Please try again.',
          variant: 'error',
          confirmText: 'OK',
        });
      }
    } catch {
      // Handle error silently
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
  }, [isLoggedIn, limit, fetchRecentlyViewed]);

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

          return (
            <Link href={`/products/${item.product.slug}`} key={item.id}>
              <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  {item.product.primaryImage ? (
                    <Image
                      src={item.product.primaryImage.url}
                      alt={
                        item.product.primaryImage.altText || item.product.name
                      }
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
                  <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.preventDefault()}
                  >
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
                    <div
                      className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={e => {
                        e.preventDefault();
                        window.location.href = `/products?category=${item.product.categories?.[0]?.category?.id || ''}`;
                      }}
                    >
                      {item.product.categories?.[0]?.category?.name ||
                        'Uncategorized'}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                      {item.product.name}
                    </h3>

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
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(item.product.id);
                      }}
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
            </Link>
          );
        })}
      </div>
      
      <ConfirmationDialog />
      <AlertDialog />
    </div>
  );
}
