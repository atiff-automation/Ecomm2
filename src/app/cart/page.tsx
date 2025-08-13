/**
 * Cart Page - Malaysian E-commerce Platform
 * Full cart page with detailed item management and membership eligibility
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Award,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Shield,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    cart,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    total,
    memberDiscount,
    qualifiesForMembership,
    membershipProgress,
    membershipRemaining,
  } = useCart();

  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;
  const cartItems = cart?.items || [];
  const membershipThreshold = cart?.membershipThreshold || 80;

  // Handle quantity update with loading state
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      setUpdatingItem(itemId);
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItem(itemId);
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) {
      return;
    }
    try {
      await clearCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // Handle quantity input change
  const handleQuantityInputChange = (itemId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      handleUpdateQuantity(itemId, quantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  // Remove login requirement - allow guest users to view cart

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading your cart...</span>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven&apos;t added anything to your cart yet
          </p>
          <Link href="/products">
            <Button className="w-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
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
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <div className="flex items-center justify-between">
            <Link href="/products">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.primaryImage ? (
                      <Image
                        src={item.product.primaryImage.url}
                        alt={
                          item.product.primaryImage.altText || item.product.name
                        }
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-4">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {item.product.name}
                          </h3>
                        </Link>

                        <Link
                          href={`/products?category=${item.product.categories?.[0]?.category?.id || ''}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.product.categories?.[0]?.category?.name ||
                            'Uncategorized'}
                        </Link>

                        {item.product.shortDescription && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.product.shortDescription}
                          </p>
                        )}

                        {/* Qualifying Category Badge */}
                        {item.product.categories?.[0]?.category
                          ?.isQualifyingCategory && (
                          <Badge variant="outline" className="mt-2">
                            <Award className="w-3 h-3 mr-1" />
                            Membership Qualifying
                          </Badge>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingItem === item.id}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Price and Controls */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {isMember ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-green-600">
                                {formatPrice(item.product.memberPrice)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Member Price
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through">
                                {formatPrice(item.product.regularPrice)}
                              </span>
                              <span className="text-green-600 font-medium">
                                Save{' '}
                                {formatPrice(
                                  item.product.regularPrice -
                                    item.product.memberPrice
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-lg">
                              {formatPrice(item.product.regularPrice)}
                            </span>
                            {item.product.memberPrice <
                              item.product.regularPrice && (
                              <div className="text-sm text-muted-foreground">
                                Member price:{' '}
                                {formatPrice(item.product.memberPrice)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={
                              updatingItem === item.id || item.quantity <= 1
                            }
                            className="w-10 h-10 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          <Input
                            type="number"
                            min="1"
                            max={item.product.stockQuantity}
                            value={item.quantity}
                            onChange={e =>
                              handleQuantityInputChange(item.id, e.target.value)
                            }
                            disabled={updatingItem === item.id}
                            className="w-16 text-center border-0 focus-visible:ring-0"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              updatingItem === item.id ||
                              item.quantity >= item.product.stockQuantity
                            }
                            className="w-10 h-10 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {updatingItem === item.id && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.product.stockQuantity <= 5 && (
                      <p className="text-sm text-orange-600 mt-2">
                        ⚠️ Only {item.product.stockQuantity} left in stock
                      </p>
                    )}

                    {/* Out of Stock */}
                    {item.product.stockQuantity === 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        ❌ Out of stock
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Membership Progress */}
          {!isMember && subtotal > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Award className="w-5 h-5" />
                  Membership Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={membershipProgress} className="h-3" />

                <div className="flex justify-between text-sm text-blue-700">
                  <span>{formatPrice(cart?.qualifyingTotal || 0)}</span>
                  <span>{formatPrice(membershipThreshold)}</span>
                </div>

                {qualifiesForMembership ? (
                  <div className="text-center">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      🎉 Congratulations! You&apos;re eligible for membership
                      benefits!
                    </p>
                    <p className="text-xs text-blue-700">
                      Enjoy member pricing on future purchases
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-blue-700 mb-1">
                      Add {formatPrice(membershipRemaining)} more to qualify for
                      membership
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          {totalItems > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {isMember && memberDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Member Discount</span>
                      <span>-{formatPrice(memberDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <Truck className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Free Shipping
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Secure Payment
                    </p>
                  </div>
                  <div className="text-center">
                    <Award className="w-8 h-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Quality Guarantee
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
