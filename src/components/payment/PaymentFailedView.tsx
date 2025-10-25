/**
 * Payment Failed View Component
 * Displays failed payment information with retry option
 * FOLLOWS @CLAUDE.md: DRY | NO HARDCODE | SINGLE SOURCE OF TRUTH
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  XCircle,
  Package,
  Home,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  finalPrice: number;
  product: {
    name: string;
    slug: string;
    primaryImage?: {
      url: string;
      altText?: string;
    };
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount?: number;
  memberDiscount?: number;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone?: string;
  } | null;
  customer: {
    firstName: string;
    isMember: boolean;
    memberSince?: string;
  };
}

interface PaymentFailedViewProps {
  orderData: OrderData;
}

export default function PaymentFailedView({ orderData }: PaymentFailedViewProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  // SINGLE SOURCE OF TRUTH: Currency formatting
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // DRY: Retry payment handler
  const handleRetryPayment = async () => {
    try {
      setIsRetrying(true);

      // Call retry payment API
      const response = await fetchWithCSRF('/api/orders/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failedOrderNumber: orderData.orderNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle out of stock error
        if (errorData.error === 'OUT_OF_STOCK') {
          toast.error('Item No Longer Available', {
            description: `Sorry, ${errorData.unavailableItems?.join(', ') || 'some items'} are now out of stock.`,
          });
          return;
        }

        throw new Error(errorData.message || 'Failed to retry payment');
      }

      const data = await response.json();

      // Redirect to new payment URL
      if (data.paymentUrl) {
        toast.success('Redirecting to payment...', {
          description: `Order ${data.newOrderNumber} created`,
        });

        // Small delay for user to see the message
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1000);
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Retry payment error:', error);
      toast.error('Could not retry payment', {
        description: error instanceof Error ? error.message : 'Please try again or contact support',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Could Not Be Completed
          </h1>
          <p className="text-lg text-gray-600">
            Your payment was not successful
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Order #{orderData.orderNumber} • {formatDate(orderData.createdAt)}
          </p>
        </div>

        {/* Information Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>What happened?</strong>
            <p className="text-sm mt-1">
              Your payment was declined by the payment gateway. No charges were
              made to your account, and the items have been returned to stock.
            </p>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  What You Tried to Purchase
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderData.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-4 border-b last:border-b-0"
                  >
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <span className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(item.finalPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(orderData.subtotal)}</span>
                </div>

                {orderData.memberDiscount && orderData.memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Member Discount</span>
                    <span>-{formatPrice(orderData.memberDiscount)}</span>
                  </div>
                )}

                {orderData.discountAmount && orderData.discountAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Promotional Discount</span>
                    <span>-{formatPrice(orderData.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(orderData.shippingCost)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (SST)</span>
                  <span>{formatPrice(orderData.taxAmount)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(orderData.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>What Would You Like to Do?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleRetryPayment}
                  disabled={isRetrying}
                  className="w-full"
                  size="lg"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Payment Again
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/products')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Need help?</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Contact our support team if you continue to experience issues
                  with payment. Have your order number ready: <code className="bg-white px-2 py-1 rounded">{orderData.orderNumber}</code>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
