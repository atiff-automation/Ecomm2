/**
 * Cart Page - Malaysian E-commerce Platform
 * Full cart page with detailed item management and membership eligibility
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    regularPrice: number;
    memberPrice: number;
    stockQuantity: number;
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

interface CartSummary {
  itemCount: number;
  subtotal: number;
  memberSubtotal: number;
  applicableSubtotal: number;
  potentialSavings: number;
  qualifyingTotal: number;
  membershipThreshold: number;
  isEligibleForMembership: boolean;
  membershipProgress: number;
  amountNeededForMembership: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
}

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCartItems([]);
      setCartSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart');

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items);
        setCartSummary(data.summary);
      } else if (response.status === 401) {
        setCartItems([]);
        setCartSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Update item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      setUpdatingItem(productId);

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert('Failed to update cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item from cart
  const removeItem = (productId: string) => {
    updateQuantity(productId, 0);
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isLoggedIn || !confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (response.ok) {
        setCartItems([]);
        setCartSummary(null);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle quantity input change
  const handleQuantityInputChange = (productId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      updateQuantity(productId, quantity);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn, fetchCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your shopping cart
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
              {cartSummary?.itemCount}{' '}
              {cartSummary?.itemCount === 1 ? 'item' : 'items'} in your cart
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
              onClick={clearCart}
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
                          href={`/products?category=${item.product.category.id}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.product.category.name}
                        </Link>

                        {item.product.shortDescription && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.product.shortDescription}
                          </p>
                        )}

                        {/* Qualifying Category Badge */}
                        {item.product.category.isQualifyingCategory && (
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
                        onClick={() => removeItem(item.product.id)}
                        disabled={updatingItem === item.product.id}
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
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            disabled={
                              updatingItem === item.product.id ||
                              item.quantity <= 1
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
                              handleQuantityInputChange(
                                item.product.id,
                                e.target.value
                              )
                            }
                            disabled={updatingItem === item.product.id}
                            className="w-16 text-center border-0 focus-visible:ring-0"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={
                              updatingItem === item.product.id ||
                              item.quantity >= item.product.stockQuantity
                            }
                            className="w-10 h-10 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {updatingItem === item.product.id && (
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
          {cartSummary && !isMember && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Award className="w-5 h-5" />
                  Membership Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={cartSummary.membershipProgress}
                  className="h-3"
                />

                <div className="flex justify-between text-sm text-blue-700">
                  <span>{formatPrice(cartSummary.qualifyingTotal)}</span>
                  <span>{formatPrice(cartSummary.membershipThreshold)}</span>
                </div>

                {cartSummary.isEligibleForMembership ? (
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
                      {cartSummary.qualifyingTotal > 0 
                        ? `Add ${formatPrice(cartSummary.amountNeededForMembership)} more qualifying items to unlock member pricing`
                        : `Add ${formatPrice(cartSummary.membershipThreshold)} qualifying items to unlock member pricing`
                      }
                    </p>
                    {cartSummary.qualifyingTotal === 0 && (
                      <p className="text-xs text-blue-600">
                        💡 Promotional items don't count toward membership - add regular items to qualify!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          {cartSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartSummary.itemCount} items)</span>
                    <span>{formatPrice(cartSummary.subtotal)}</span>
                  </div>

                  {isMember && cartSummary.potentialSavings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Member Discount</span>
                      <span>-{formatPrice(cartSummary.potentialSavings)}</span>
                    </div>
                  )}

                  {!isMember && cartSummary.potentialSavings > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Potential Member Savings</span>
                      <span>{formatPrice(cartSummary.potentialSavings)}</span>
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
                    <span>{formatPrice(cartSummary.applicableSubtotal)}</span>
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
