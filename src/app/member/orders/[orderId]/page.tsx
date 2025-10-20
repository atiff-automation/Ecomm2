'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OrderStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { OrderStatusTimeline } from '@/components/tracking/OrderStatusTimeline';
import Image from 'next/image';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  regularPrice: number;
  memberPrice: number;
  appliedPrice: number;
  totalPrice: number;
  productName: string;
  productSku: string;
  product?: {
    id: string;
    name: string;
    images?: Array<{
      url: string;
      altText?: string;
    }>;
  };
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  memberDiscount: number;
  discountAmount?: number; // Promotional discount
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  customerNotes?: string;
  orderItems: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  shipment?: {
    id: string;
    trackingNumber?: string;
    status?: string;
    courierName?: string;
    serviceName?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    trackingEvents?: Array<{
      eventName: string;
      description: string;
      timestamp: string;
      location?: string;
    }>;
  };
}

export default function OrderDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingTracking, setRefreshingTracking] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/member/orders/${orderId}`);

        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
        } else if (response.status === 404) {
          setError('Order not found');
        } else {
          setError('Failed to load order details');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [session, orderId, router]);

  const handleTrackingRefresh = async () => {
    if (!order?.shipment?.trackingNumber) {
      return;
    }

    setRefreshingTracking(true);
    try {
      const response = await fetch(
        `/api/customer/orders/${orderId}/tracking/refresh`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        // Refetch order data to get updated tracking
        await fetchOrder();
      } else {
        console.error('Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
    } finally {
      setRefreshingTracking(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  // Determine price type and savings information using Source of Truth (stored order data)
  const getPriceTypeInfo = (item: OrderItem, order: Order) => {
    // If no discount applied, it's regular price
    if (item.appliedPrice >= item.regularPrice) {
      return {
        priceType: 'regular',
        savingsText: '',
        savingsColor: '',
      };
    }

    // Use stored order-level discount data to determine price type (Source of Truth)
    const hasPromotionalDiscount =
      order.discountAmount && order.discountAmount > 0;
    const hasMemberDiscount = order.memberDiscount && order.memberDiscount > 0;

    if (hasPromotionalDiscount && hasMemberDiscount) {
      // Both discounts exist - determine which one was applied based on the price comparison
      if (item.appliedPrice < item.memberPrice) {
        return {
          priceType: 'promotional',
          savingsText: 'Promotional savings',
          savingsColor: 'text-red-600',
        };
      } else if (item.appliedPrice === item.memberPrice) {
        return {
          priceType: 'member',
          savingsText: 'Member savings',
          savingsColor: 'text-green-600',
        };
      }
    } else if (hasPromotionalDiscount) {
      return {
        priceType: 'promotional',
        savingsText: 'Promotional savings',
        savingsColor: 'text-red-600',
      };
    } else if (hasMemberDiscount || item.appliedPrice === item.memberPrice) {
      return {
        priceType: 'member',
        savingsText: 'Member savings',
        savingsColor: 'text-green-600',
      };
    }

    // Fallback for edge cases
    return {
      priceType: 'discounted',
      savingsText: 'Savings',
      savingsColor: 'text-gray-600',
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <Button onClick={() => router.push('/member/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status)} variant="outline">
              {order.status}
            </Badge>
            <Badge
              className={getPaymentStatusColor(order.paymentStatus)}
              variant="outline"
            >
              Payment: {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Order Status Timeline */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order #{order.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusTimeline currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.images[0].altText || item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.productSku}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.totalPrice)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.appliedPrice)} each
                    </p>
                    {item.appliedPrice < item.regularPrice &&
                      (() => {
                        const priceInfo = getPriceTypeInfo(item, order);
                        return (
                          priceInfo.savingsText && (
                            <p className={`text-xs ${priceInfo.savingsColor}`}>
                              {priceInfo.savingsText}:{' '}
                              {formatPrice(
                                (item.regularPrice - item.appliedPrice) *
                                  item.quantity
                              )}
                            </p>
                          )
                        );
                      })()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping & Tracking Information */}
          {order.shipment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Shipping & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tracking Number
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {order.shipment.trackingNumber || 'Not available'}
                      </code>
                      {order.shipment.trackingNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              order.shipment!.trackingNumber!
                            )
                          }
                          className="h-7 w-7 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Courier
                    </label>
                    <p className="mt-1">
                      {order.shipment.courierName || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Service
                    </label>
                    <p className="mt-1">
                      {order.shipment.serviceName || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <p className="mt-1 capitalize">
                      {order.shipment.status || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Delivery Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.shipment.estimatedDelivery && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Estimated Delivery
                      </label>
                      <p className="mt-1">
                        {formatDate(order.shipment.estimatedDelivery)}
                      </p>
                    </div>
                  )}

                  {order.shipment.actualDelivery && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Actual Delivery
                      </label>
                      <p className="mt-1">
                        {formatDate(order.shipment.actualDelivery)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                {order.shipment.trackingNumber && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleTrackingRefresh}
                      disabled={refreshingTracking}
                      size="sm"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${refreshingTracking ? 'animate-spin' : ''}`}
                      />
                      {refreshingTracking
                        ? 'Refreshing...'
                        : 'Refresh Tracking'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tracking Timeline - Simple events display */}
          {order.shipment?.trackingEvents &&
            order.shipment.trackingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.shipment.trackingEvents.map((event, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-gray-200 pl-4"
                      >
                        <p className="font-medium">{event.eventName}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Shipping Address */}
          {order.shippingAddress && (
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
                    {order.shippingAddress.firstName}{' '}
                    {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="text-muted-foreground">
                    Phone: {order.shippingAddress.phone}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {order.memberDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Member Discount</span>
                  <span>-{formatPrice(order.memberDiscount)}</span>
                </div>
              )}

              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Promotional Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Order Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </label>
                <p className="capitalize">{order.paymentMethod || 'N/A'}</p>
              </div>

              {order.trackingNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tracking Number
                  </label>
                  <p className="font-mono text-sm">{order.trackingNumber}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Order Date
                </label>
                <p>{formatDate(order.createdAt)}</p>
              </div>

              {order.shippedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Shipped Date
                  </label>
                  <p>{formatDate(order.shippedAt)}</p>
                </div>
              )}

              {order.deliveredAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Delivered Date
                  </label>
                  <p>{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Have questions about your order? Contact our support team.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
