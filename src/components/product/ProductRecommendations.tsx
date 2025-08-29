/**
 * Product Recommendations Component - Malaysian E-commerce Platform
 * Displays personalized product recommendations based on user behavior
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useAlertDialog } from '@/components/ui/alert-dialog';
import config from '@/lib/config/app-config';
import { ProductCard } from '@/components/product/ProductCard';
import { useCart } from '@/hooks/use-cart';

interface RecommendedProduct {
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
  categories: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  images: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
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
  limit = config.ui.pagination.defaultPageSize / 2.5, // Default to 8 for UI consistency
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
  const { showAlert, AlertDialog } = useAlertDialog();
  const { addToCart } = useCart();

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
    fetchRecommendations();
  }, [fetchRecommendations]);

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
        {recommendations.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            size="sm"
            showDescription={false}
            showRating={true}
          />
        ))}
      </div>

      <AlertDialog />
    </div>
  );
}
