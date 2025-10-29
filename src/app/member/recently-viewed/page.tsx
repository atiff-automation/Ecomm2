/**
 * Recently Viewed Products Page - JRM E-commerce Platform
 * Display user's browsing history with quick add-to-cart functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ShoppingCart,
  Eye,
  RefreshCw,
  Trash2,
  Package,
} from 'lucide-react';

interface RecentlyViewedProduct {
  id: string;
  viewedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    stockQuantity: number;
    status: string;
    featured: boolean;
    averageRating: number;
    reviewCount: number;
    primaryImage: {
      url: string;
      altText: string | null;
    } | null;
  };
}

export default function RecentlyViewedPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentlyViewed();
  }, []);

  const fetchRecentlyViewed = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recently-viewed?limit=30');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (response.ok) {
        // Success feedback
        const button = document.getElementById(`cart-btn-${productId}`);
        if (button) {
          button.textContent = 'Added!';
          setTimeout(() => {
            button.textContent = 'Add to Cart';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all recently viewed products?')) return;

    try {
      const response = await fetch('/api/recently-viewed', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to clear recently viewed:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const getProductPrice = (product: RecentlyViewedProduct['product']) => {
    return session?.user?.isMember ? product.memberPrice : product.regularPrice;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recently Viewed</h1>
          <p className="text-gray-600 mt-2">
            Products you&apos;ve recently browsed
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" onClick={fetchRecentlyViewed} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {products.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(item => (
            <Card
              key={item.id}
              className="group hover:shadow-lg transition-shadow overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Product Image */}
                <Link href={`/products/${item.product.slug}`}>
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {item.product.primaryImage ? (
                      <Image
                        src={item.product.primaryImage.url}
                        alt={
                          item.product.primaryImage.altText ||
                          item.product.name
                        }
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-300" />
                      </div>
                    )}

                    {/* Featured Badge */}
                    {item.product.featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    )}

                    {/* Stock Status */}
                    {item.product.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[48px]">
                      {item.product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {item.product.reviewCount > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>
                        {item.product.averageRating.toFixed(1)} (
                        {item.product.reviewCount})
                      </span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="space-y-1">
                    {session?.user?.isMember &&
                    item.product.memberPrice < item.product.regularPrice ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-green-600">
                            {formatPrice(item.product.memberPrice)}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Member
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 line-through">
                          {formatPrice(item.product.regularPrice)}
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(getProductPrice(item.product))}
                      </div>
                    )}
                  </div>

                  {/* Viewed Time */}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Viewed{' '}
                      {new Date(item.viewedAt).toLocaleDateString('en-MY', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      id={`cart-btn-${item.product.id}`}
                      onClick={() => handleAddToCart(item.product.id)}
                      disabled={
                        item.product.stockQuantity === 0 ||
                        addingToCart === item.product.id
                      }
                      className="flex-1"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {addingToCart === item.product.id
                        ? 'Adding...'
                        : 'Add to Cart'}
                    </Button>
                    <Link href={`/products/${item.product.slug}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Recently Viewed Products
              </h3>
              <p className="text-gray-600 mb-6">
                Start browsing our products to see your viewing history here.
              </p>
              <Link href="/products">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
