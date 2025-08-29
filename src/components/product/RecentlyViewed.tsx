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
import { ProductCard } from '@/components/product/ProductCard';
import { useCart } from '@/hooks/use-cart';

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
    isPromotional: boolean;
    isQualifyingForMembership: boolean;
    promotionalPrice?: number | null;
    promotionStartDate?: string | null;
    promotionEndDate?: string | null;
    memberOnlyUntil?: string | null;
    earlyAccessStart?: string | null;
    averageRating: number;
    reviewCount: number;
    categories: Array<{
      category: {
        id: string;
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
  const { addToCart } = useCart();

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
      description:
        'Are you sure you want to clear all recently viewed products? This action cannot be undone.',
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

  // Add to cart functionality using centralized hook
  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      // The success toast is handled by the useCart hook
    } catch (error) {
      // The error toast is handled by the useCart hook
      console.error('Error adding to cart:', error);
    }
  };

  useEffect(() => {
    fetchRecentlyViewed();
  }, [isLoggedIn, limit, fetchRecentlyViewed]);

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
          // Transform RecentlyViewedItem to match ProductCard expectations
          const productCardData = {
            ...item.product,
            images: item.product.primaryImage
              ? [
                  {
                    url: item.product.primaryImage.url,
                    altText: item.product.primaryImage.altText,
                    isPrimary: true,
                  },
                ]
              : [],
          };

          return (
            <div key={item.id} className="relative">
              {/* Viewed Time Badge Overlay */}
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="outline" className="bg-white/90 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatViewedTime(item.viewedAt)}
                </Badge>
              </div>

              <ProductCard
                product={productCardData}
                onAddToCart={handleAddToCart}
                size="sm"
                showDescription={false}
                showRating={true}
              />
            </div>
          );
        })}
      </div>

      <ConfirmationDialog />
      <AlertDialog />
    </div>
  );
}
