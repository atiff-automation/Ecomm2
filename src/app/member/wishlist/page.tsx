/**
 * Member Wishlist Page - JRM E-commerce Platform
 * View and manage saved/wishlisted products
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePricing } from '@/hooks/use-pricing';
import {
  Heart,
  ShoppingCart,
  Search,
  Trash2,
  Star,
  Package,
} from 'lucide-react';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    stockQuantity: number;
    featured?: boolean;
    isPromotional: boolean;
    isQualifyingForMembership: boolean;
    promotionalPrice?: number | null;
    promotionStartDate?: string | null;
    promotionEndDate?: string | null;
    memberOnlyUntil?: string | null;
    earlyAccessStart?: string | null;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
    categories: Array<{
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
    averageRating?: number;
    reviewCount?: number;
  };
  createdAt: string;
}

// Centralized pricing component for member wishlist
const MemberWishlistPricing = ({
  product,
}: {
  product: WishlistItem['product'];
}) => {
  const pricing = usePricing(product);

  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <span
          className={`text-lg font-bold ${pricing.displayClasses.priceColor}`}
        >
          {pricing.formattedPrice}
        </span>
        {pricing.badges.map((badge, index) => (
          <Badge
            key={index}
            variant={badge.variant}
            className={badge.className}
          >
            {badge.text}
          </Badge>
        ))}
      </div>
      {pricing.showSavings && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 line-through">
            {pricing.formattedOriginalPrice}
          </span>
          <span
            className={`text-xs font-medium ${pricing.displayClasses.savingsColor}`}
          >
            Save {pricing.formattedSavings}
          </span>
        </div>
      )}
    </div>
  );
};

export default function MemberWishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetchWithCSRF('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setWishlistItems(items =>
          items.filter(item => item.product.id !== productId)
        );
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetchWithCSRF('/api/cart', {
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
        // Optionally remove from wishlist after adding to cart
        // removeFromWishlist(productId);
        alert('Added to cart successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const filteredItems = wishlistItems.filter(
    item =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product.categories?.[0]?.category?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}{' '}
            saved for later
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search your wishlist..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const primaryImage =
              item.product.images.find(img => img.isPrimary) ||
              item.product.images[0];
            const isInStock = item.product.stockQuantity > 0;

            return (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.altText || item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {!isInStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      onClick={() => removeFromWishlist(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        {item.product.categories?.[0]?.category?.name ||
                          'Uncategorized'}
                      </p>
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="font-semibold line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                    </div>

                    {item.product.averageRating && item.product.reviewCount && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= (item.product.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({item.product.reviewCount})
                        </span>
                      </div>
                    )}

                    <MemberWishlistPricing product={item.product} />

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={() => addToCart(item.product.id)}
                        disabled={!isInStock}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isInStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Added{' '}
                      {new Date(item.createdAt).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No items found' : 'Your wishlist is empty'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Save items you love for later by clicking the heart icon on products.'}
              </p>
              {!searchTerm && (
                <Link href="/products">
                  <Button>Browse Products</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
