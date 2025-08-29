/**
 * Wishlist Page - Malaysian E-commerce Platform
 * User's saved products with management functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  ShoppingCart,
  Star,
  ArrowLeft,
  Share2,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { usePricing } from '@/hooks/use-pricing';

interface WishlistItem {
  id: string;
  createdAt: string;
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
    primaryImage?: {
      url: string;
      altText?: string;
    };
  };
}

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch wishlist data
  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/wishlist');

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items);
      } else if (response.status === 401) {
        setWishlistItems([]);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Add to cart functionality
  const addToCart = async (productId: string) => {
    if (!isLoggedIn) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setAddingToCart(productId);
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
        // TODO: Add toast notification here
        // Success handled silently for now
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add to cart');
      }
    } catch {
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  // Remove from wishlist
  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev =>
      prev.filter(item => item.product.id !== productId)
    );
  };

  // Share wishlist
  const shareWishlist = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My JRM E-commerce Wishlist',
          text: 'Check out my wishlist on JRM E-commerce!',
          url: window.location.href,
        });
      } catch {
        // Handle error silently
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Wishlist link copied to clipboard!');
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isLoggedIn, fetchWishlist]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Wishlist Item Card Component with centralized pricing
  const WishlistItemCard = ({
    item,
    onRemove,
    onAddToCart,
    addingToCart,
  }: {
    item: WishlistItem;
    onRemove: (productId: string) => void;
    onAddToCart: (productId: string) => Promise<void>;
    addingToCart: string | null;
  }) => {
    const pricing = usePricing(item.product);

    return (
      <Card className="group hover:shadow-lg transition-shadow">
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
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Centralized Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {pricing.badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant}
                className={badge.className}
              >
                {badge.text}
              </Badge>
            ))}
            {item.product.stockQuantity === 0 && (
              <Badge variant="outline" className="bg-white">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <div className="absolute top-2 right-2">
            <WishlistButton
              productId={item.product.id}
              initialInWishlist={true}
              onWishlistChange={inWishlist => {
                if (!inWishlist) {
                  onRemove(item.product.id);
                }
              }}
              variant="secondary"
              className="bg-white/90 hover:bg-white"
            />
          </div>

          {/* Added Date */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="bg-white/90 text-xs">
              Added {formatDate(item.createdAt)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Category */}
            <Link
              href={`/products?category=${item.product.categories?.[0]?.category?.id || ''}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {item.product.categories?.[0]?.category?.name || 'Uncategorized'}
            </Link>

            {/* Product Name */}
            <Link href={`/products/${item.product.slug}`}>
              <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                {item.product.name}
              </h3>
            </Link>

            {/* Description */}
            {item.product.shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.product.shortDescription}
              </p>
            )}

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

            {/* Centralized Pricing */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-lg ${pricing.displayClasses.priceColor}`}
                >
                  {pricing.formattedPrice}
                </span>
              </div>
              {pricing.showSavings && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {pricing.formattedOriginalPrice}
                  </span>
                  <span
                    className={`text-xs font-medium ${pricing.displayClasses.savingsColor}`}
                  >
                    Save {pricing.formattedSavings}
                  </span>
                </div>
              )}
              {pricing.showMemberPreview && (
                <div className="text-xs text-muted-foreground">
                  {pricing.memberPreviewText}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              disabled={
                item.product.stockQuantity === 0 ||
                addingToCart === item.product.id
              }
              onClick={() => onAddToCart(item.product.id)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {addingToCart === item.product.id
                ? 'Adding...'
                : item.product.stockQuantity === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your wishlist
          </p>
          <div className="space-y-3">
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading your wishlist...</span>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Save products you love to your wishlist to buy them later
          </p>
          <Link href="/products">
            <Button className="w-full">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground">
              {wishlistItems.length}{' '}
              {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/products">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={shareWishlist}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Wishlist
          </Button>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map(item => {
          return (
            <WishlistItemCard
              key={item.id}
              item={item}
              onRemove={removeFromWishlist}
              onAddToCart={addToCart}
              addingToCart={addingToCart}
            />
          );
        })}
      </div>
    </div>
  );
}
