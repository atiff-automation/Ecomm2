/**
 * Cart Sidebar Component - Malaysian E-commerce Platform
 * Sliding cart sidebar with membership eligibility and real-time updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Award,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React from 'react';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    stockQuantity: number;
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

interface CartSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CartSidebar({
  isOpen,
  onOpenChange,
  trigger,
}: CartSidebarProps) {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Fetch cart data (works for both guest and authenticated users)
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
        setCartSummary(data.summary);
      } else {
        setCartItems([]);
        setCartSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
      setCartSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update item quantity (works for both guest and authenticated users)
  const updateQuantity = async (productId: string, newQuantity: number) => {
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
        // Emit storage event to notify other components (like checkout page)
        localStorage.setItem('cart_updated', Date.now().toString());
        window.dispatchEvent(new Event('cart_updated'));
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

  // Clear entire cart (works for both guest and authenticated users)
  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) {
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
        // Emit storage event to notify other components (like checkout page)
        localStorage.setItem('cart_updated', Date.now().toString());
        window.dispatchEvent(new Event('cart_updated'));
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  // Listen for cart updates from other components (like payment completion)
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cart_items' && event.newValue === null) {
        // Cart was cleared from localStorage
        fetchCart();
      }
    };

    // Listen for custom cart update events
    window.addEventListener('cart_updated', handleCartUpdate);
    // Listen for localStorage changes (like cart clearing after payment)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cart_updated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const CartContent = () => (
    <>
      <SheetHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {cartSummary && (
              <Badge variant="secondary">
                {cartSummary.itemCount}{' '}
                {cartSummary.itemCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <SheetDescription>
          {cartItems.length === 0
            ? 'Your cart is empty'
            : 'Review your items and proceed to checkout'}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading cart...</span>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map(item => (
                <Card key={item.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        {item.product.primaryImage ? (
                          <Image
                            src={item.product.primaryImage.url}
                            alt={
                              item.product.primaryImage.altText ||
                              item.product.name
                            }
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                            {item.product.name}
                          </h4>
                        </Link>

                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product.categories?.[0]?.category?.name ||
                            'Uncategorized'}
                        </p>

                        {/* Pricing */}
                        <div className="mt-2">
                          {isMember ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-green-600">
                                  {formatPrice(item.product.memberPrice)}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-xs py-0"
                                >
                                  Member
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPrice(item.product.regularPrice)}
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium text-sm">
                              {formatPrice(item.product.regularPrice)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border rounded">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                updatingItem === item.product.id ||
                                item.quantity <= 1
                              }
                              className="w-7 h-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                              {updatingItem === item.product.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                updatingItem === item.product.id ||
                                item.quantity >= item.product.stockQuantity
                              }
                              className="w-7 h-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.product.id)}
                            disabled={updatingItem === item.product.id}
                            className="text-red-600 hover:text-red-700 w-7 h-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Stock Warning */}
                        {item.product.stockQuantity <= 5 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {item.product.stockQuantity} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Membership Progress */}
            {cartSummary && !isMember && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Membership Progress
                    </span>
                  </div>

                  <Progress
                    value={cartSummary.membershipProgress}
                    className="mb-2 h-2"
                  />

                  <div className="flex justify-between text-xs text-blue-700">
                    <span>{formatPrice(cartSummary.qualifyingTotal)}</span>
                    <span>{formatPrice(cartSummary.membershipThreshold)}</span>
                  </div>

                  {cartSummary.isEligibleForMembership ? (
                    <p className="text-xs text-blue-800 mt-2 font-medium">
                      🎉 Congratulations! You&apos;re eligible for membership
                      benefits!
                    </p>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-blue-700">
                        {cartSummary.qualifyingTotal > 0
                          ? `Add ${formatPrice(cartSummary.amountNeededForMembership)} more to qualify`
                          : `Add ${formatPrice(cartSummary.membershipThreshold)} qualifying items`}
                      </p>
                      {cartSummary.qualifyingTotal === 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Promotional items don't count - add regular items!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cart Summary */}
            {cartSummary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartSummary.itemCount} items)</span>
                    <span>{formatPrice(cartSummary.subtotal)}</span>
                  </div>

                  {isMember && cartSummary.potentialSavings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Member Discount</span>
                      <span>-{formatPrice(cartSummary.potentialSavings)}</span>
                    </div>
                  )}

                  {!isMember && cartSummary.potentialSavings > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Potential Member Savings</span>
                      <span>{formatPrice(cartSummary.potentialSavings)}</span>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatPrice(cartSummary.applicableSubtotal)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Shipping calculated at checkout
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {cartItems.length > 0 && (
        <div className="border-t pt-4 space-y-2">
          {!isLoggedIn && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 mb-2">
                Sign in to save your cart and get member benefits!
              </p>
              <Link href="/auth/signin" onClick={() => onOpenChange(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          <Link href="/cart" onClick={() => onOpenChange(false)}>
            <Button variant="outline" className="w-full">
              View Full Cart
            </Button>
          </Link>

          <Link href="/checkout" onClick={() => onOpenChange(false)}>
            <Button className="w-full">
              Proceed to Checkout
              {cartSummary && (
                <span className="ml-2">
                  {formatPrice(cartSummary.applicableSubtotal)}
                </span>
              )}
            </Button>
          </Link>
        </div>
      )}
    </>
  );

  if (trigger) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <CartContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <CartContent />
      </SheetContent>
    </Sheet>
  );
}
