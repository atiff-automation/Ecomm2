/**
 * Cart Sidebar Component - Malaysian E-commerce Platform
 * Sliding cart sidebar with membership eligibility and real-time updates
 */

'use client';

import { useState } from 'react';
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
import { useCart } from '@/hooks/use-cart';
import { useFreshMembership } from '@/hooks/use-fresh-membership';
import { getBestPrice } from '@/lib/promotions/promotion-utils';
import config from '@/lib/config/app-config';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import React from 'react';

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
    promotionalDiscount,
    qualifiesForMembership,
    membershipProgress,
    membershipRemaining,
  } = useCart();
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const freshMembership = useFreshMembership();

  const isLoggedIn = freshMembership.isLoggedIn;
  const isMember = freshMembership.isMember;
  const cartItems = cart?.items || [];
  const membershipThreshold =
    cart?.membershipThreshold || config.business.membership.threshold;

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
    showConfirmation({
      title: 'Clear Cart',
      description:
        'Are you sure you want to clear your cart? This action cannot be undone.',
      confirmText: 'Clear Cart',
      cancelText: 'Keep Items',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await clearCart();
        } catch (error) {
          console.error('Failed to clear cart:', error);
        }
      },
    });
  };

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
            {totalItems > 0 && (
              <Badge variant="secondary">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
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
        {isLoading ? (
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
                              item.product.metaTitle ||
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
                          {(() => {
                            // Wait for fresh membership data to load
                            if (freshMembership.loading) {
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-400">
                                    {formatPrice(
                                      Number(item.product.regularPrice)
                                    )}
                                  </span>
                                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                              );
                            }

                            // Get the best price for this product
                            const bestPrice = getBestPrice(
                              {
                                regularPrice: Number(item.product.regularPrice),
                                memberPrice: Number(item.product.memberPrice),
                                isPromotional:
                                  item.product.isPromotional || false,
                                promotionalPrice: item.product.promotionalPrice
                                  ? Number(item.product.promotionalPrice)
                                  : null,
                                promotionStartDate:
                                  item.product.promotionStartDate,
                                promotionEndDate: item.product.promotionEndDate,
                                isQualifyingForMembership:
                                  item.product.isQualifyingForMembership ||
                                  false,
                                memberOnlyUntil: item.product.memberOnlyUntil,
                                earlyAccessStart: item.product.earlyAccessStart,
                              },
                              isMember
                            );

                            // Price type styling configuration (centralized)
                            const priceTypeConfig = {
                              promotional: {
                                textColor: 'text-red-600',
                                badgeVariant: 'destructive' as const,
                                badgeText: 'Promo',
                              },
                              member: {
                                textColor: 'text-green-600',
                                badgeVariant: 'secondary' as const,
                                badgeText: 'Member',
                              },
                              'early-access': {
                                textColor: 'text-blue-600',
                                badgeVariant: 'default' as const,
                                badgeText: 'Early',
                              },
                              regular: {
                                textColor: 'text-gray-900',
                                badgeVariant: 'outline' as const,
                                badgeText: 'Regular',
                              },
                            };

                            const currentConfig =
                              priceTypeConfig[
                                bestPrice.priceType as keyof typeof priceTypeConfig
                              ] || priceTypeConfig.regular;

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-medium text-sm ${currentConfig.textColor}`}
                                  >
                                    {formatPrice(bestPrice.price)}
                                  </span>
                                  {bestPrice.priceType !== 'regular' && (
                                    <Badge
                                      variant={currentConfig.badgeVariant}
                                      className="text-xs py-0"
                                    >
                                      {currentConfig.badgeText}
                                    </Badge>
                                  )}
                                </div>
                                {bestPrice.savings > 0 && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    {formatPrice(bestPrice.originalPrice)}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border rounded">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={
                                updatingItem === item.id || item.quantity <= 1
                              }
                              className="w-7 h-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                              {updatingItem === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : (
                                item.quantity
                              )}
                            </span>

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
                              className="w-7 h-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updatingItem === item.id}
                            className="text-red-600 hover:text-red-700 w-7 h-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Stock Warning */}
                        {item.product.stockQuantity <=
                          config.business.product.lowStockThreshold && (
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
            {!isMember && !freshMembership.loading && subtotal > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Membership Progress
                    </span>
                  </div>

                  <Progress value={membershipProgress} className="mb-2 h-2" />

                  <div className="flex justify-between text-xs text-blue-700">
                    <span>{formatPrice(cart?.qualifyingTotal || 0)}</span>
                    <span>{formatPrice(membershipThreshold)}</span>
                  </div>

                  {qualifiesForMembership ? (
                    <p className="text-xs text-blue-800 mt-2 font-medium">
                      🎉 Congratulations! You&apos;re eligible for membership
                      benefits!
                    </p>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-blue-700">
                        Add {formatPrice(membershipRemaining)} more to qualify
                        for membership
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cart Summary */}
            {totalItems > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {promotionalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Promotional Discount</span>
                      <span>-{formatPrice(promotionalDiscount)}</span>
                    </div>
                  )}

                  {isMember &&
                    !freshMembership.loading &&
                    memberDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Member Discount</span>
                        <span>-{formatPrice(memberDiscount)}</span>
                      </div>
                    )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
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
            <Button className="w-full" disabled={totalItems === 0 || isLoading}>
              {totalItems === 0 ? (
                'Cart is Empty'
              ) : (
                <>
                  Proceed to Checkout
                  <span className="ml-2">{formatPrice(total)}</span>
                </>
              )}
            </Button>
          </Link>
        </div>
      )}

      <ConfirmationDialog />
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
