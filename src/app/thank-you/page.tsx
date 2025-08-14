/**
 * Thank You Page - JRM E-commerce Platform
 * Post-purchase confirmation with order summary and receipt download
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Crown,
  Gift,
  Package,
  CreditCard,
  MapPin,
  Clock,
  FileText,
  Sparkles,
  ShoppingBag,
  Home,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import MembershipWelcomeModal from '@/components/membership/MembershipWelcomeModal';

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

interface SecureOrderResponse {
  success: boolean;
  data: OrderData;
  timestamp: string;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [membershipActivated, setMembershipActivated] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const orderRef = searchParams.get('orderRef');
  const amount = searchParams.get('amount');
  const membershipEligible = searchParams.get('membership') === 'true';
  
  // Clear cart immediately when thank-you page loads (after successful payment)
  const clearCartAfterPayment = async () => {
    console.log('🧹 Thank-you page: Clearing cart after successful payment');
    
    try {
      // Clear cart via API
      const response = await fetch('/api/cart', { method: 'DELETE' });
      if (response.ok) {
        console.log('✅ Cart cleared via API');
      }
    } catch (error) {
      console.error('❌ Failed to clear cart:', error);
    }
    
    // Clear localStorage
    ['cart_items', 'guest_cart', 'shopping_cart'].forEach((key) => {
      localStorage.removeItem(key);
    });
    
    // Broadcast cart clearing events
    if (typeof window !== 'undefined') {
      ['cartUpdated', 'cart_updated', 'cart_cleared'].forEach((eventName) => {
        window.dispatchEvent(new CustomEvent(eventName));
      });
    }
    
    console.log('✅ Cart clearing completed on thank-you page');
  };

  // Clear cart on page load (successful payment)
  useEffect(() => {
    clearCartAfterPayment();
  }, []); // Run once on mount
  
  useEffect(() => {
    if (!orderRef) {
      setError('Order reference not found');
      setLoading(false);
      return;
    }

    fetchOrderData();
  }, [orderRef]);

  // Handle membership activation if eligible
  useEffect(() => {
    if (membershipEligible && session?.user && !session.user.isMember) {
      handleMembershipActivation();
    }
  }, [membershipEligible, session]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);

      // Search for order by order number using secured public API
      console.log('🔍 Fetching order details for:', orderRef);
      const response = await fetch(`/api/orders/lookup/${orderRef}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch order' }));
        if (response.status === 404) {
          throw new Error('Order not found or no longer available');
        }
        throw new Error(errorData.message || `Failed to fetch order: ${response.statusText}`);
      }

      const apiResponse: SecureOrderResponse = await response.json();
      
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Invalid order data received');
      }
      
      console.log('✅ Secure order data received:', apiResponse.data);
      setOrderData(apiResponse.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipActivation = async () => {
    try {
      // Update session to get latest user data
      await updateSession();
      setMembershipActivated(true);

      // Show welcome modal after a short delay
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1500);
    } catch (error) {
      console.error('Error updating membership status:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!orderData) {
      return;
    }

    try {
      setDownloadingReceipt(true);

      const response = await fetch(
        `/api/orders/${orderData.id}/receipt?format=pdf&download=true`
      );

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const pdfBuffer = await response.arrayBuffer();

      // Create a blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${orderData.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again or contact support.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-lg text-gray-600">
            Your payment has been processed successfully
          </p>
          {orderData && (
            <p className="text-sm text-gray-500 mt-2">
              Order #{orderData.orderNumber} • {formatDate(orderData.createdAt)}
            </p>
          )}
        </div>

        {/* Membership Activation Alert */}
        {(membershipActivated || session?.user?.isMember) && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Crown className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>🎉 Membership Activated!</strong>
                  <p className="text-sm mt-1">
                    You now have access to exclusive member pricing and
                    benefits. Login on future visits to enjoy member discounts!
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/account/membership')}
                  className="ml-4 border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  View Benefits
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderData?.items.map(item => (
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                        {item.finalPrice < item.price && (
                          <Badge variant="secondary" className="text-xs">
                            Member Price
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(item.finalPrice * item.quantity)}
                      </p>
                      {item.finalPrice < item.price && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {orderData?.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {orderData.shippingAddress.firstName}{' '}
                      {orderData.shippingAddress.lastName}
                    </p>
                    {orderData.shippingAddress.company && (
                      <p className="text-sm text-gray-600">
                        {orderData.shippingAddress.company}
                      </p>
                    )}
                    <p>{orderData.shippingAddress.address}</p>
                    {orderData.shippingAddress.address2 && (
                      <p>{orderData.shippingAddress.address2}</p>
                    )}
                    <p>
                      {orderData.shippingAddress.postcode}{' '}
                      {orderData.shippingAddress.city},{' '}
                      {orderData.shippingAddress.state}
                    </p>
                    <p>{orderData.shippingAddress.country}</p>
                    {orderData.shippingAddress.phone && (
                      <p className="text-sm text-gray-600 mt-2">
                        📞 {orderData.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(orderData?.subtotal || 0)}</span>
                </div>

                {orderData?.memberDiscount && orderData.memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Member Discount</span>
                    <span>-{formatPrice(orderData.memberDiscount)}</span>
                  </div>
                )}

                {orderData?.discountAmount && orderData.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(orderData.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(orderData?.shippingCost || 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (SST)</span>
                  <span>{formatPrice(orderData?.taxAmount || 0)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span>{formatPrice(orderData?.total || 0)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Confirmed</span>
                </div>
              </CardContent>
            </Card>

            {/* Download Receipt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Download your official receipt as PDF for records and tax
                  purposes.
                </p>
                <Button
                  onClick={handleDownloadReceipt}
                  disabled={downloadingReceipt}
                  className="w-full"
                >
                  {downloadingReceipt ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {[
                    "You'll receive an order confirmation email shortly",
                    "We'll send shipping updates as your order is processed",
                    "Track your order anytime in your account"
                  ].map((text, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-2">
                  {session?.user ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push('/member/orders')}
                      className="w-full"
                    >
                      <User className="w-4 h-4 mr-2" />
                      View My Orders
                    </Button>
                  ) : null}

                  <Button
                    onClick={() => router.push('/products')}
                    className="w-full"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Membership Welcome Modal */}
        <MembershipWelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          memberInfo={{
            name: orderData?.customer
              ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
              : undefined,
            memberSince: orderData?.customer?.memberSince,
            orderValue: orderData?.total,
          }}
        />
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
