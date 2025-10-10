'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Printer,
  Truck,
  Loader2,
  Package,
  User,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { TrackingCard } from '@/components/admin/orders/TrackingCard';
import {
  formatCurrency,
  formatOrderDateTime,
  getCustomerName,
} from '@/lib/utils/order';
import { ORDER_STATUSES } from '@/lib/constants/order';
import { OrderStatus } from '@prisma/client';
import type { OrderDetailsData } from '@/components/admin/orders/types';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (response.status === 404) {
        toast({
          title: 'Error',
          description: 'Order not found',
          variant: 'destructive',
        });
        router.push('/admin/orders');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load order details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, router, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          triggeredBy: 'admin',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order status updated successfully',
        });
        fetchOrder(); // Refresh order data
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFulfill = async () => {
    if (!order) {
      return;
    }

    setIsFulfilling(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order fulfilled successfully',
        });
        fetchOrder(); // Refresh order data
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to fulfill order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fulfill order',
        variant: 'destructive',
      });
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!order?.shipment) {
      return;
    }

    setIsRefreshingTracking(true);
    try {
      const response = await fetch(
        `/api/shipments/${order.shipment.id}/tracking/refresh`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tracking information updated',
        });
        fetchOrder(); // Refresh order data
      } else {
        toast({
          title: 'Error',
          description: 'Failed to refresh tracking',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh tracking',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  const handlePrintInvoice = () => {
    if (order) {
      window.open(`/api/orders/${order.id}/invoice?download=true`, '_blank');
    }
  };

  const handlePrintPackingSlip = () => {
    if (order) {
      window.open(
        `/api/orders/${order.id}/packing-slip?download=true`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Order not found</p>
      </div>
    );
  }

  const canFulfill = order.paymentStatus === 'PAID' && !order.shipment;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">
              {formatOrderDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} type="order" />
          <OrderStatusBadge status={order.paymentStatus} type="payment" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Details (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.orderItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.productName ||
                          item.product?.name ||
                          'Product unavailable'}
                      </p>
                      {item.product?.sku && (
                        <p className="text-sm text-gray-500">
                          SKU: {item.product.sku}
                        </p>
                      )}
                      {!item.product && item.productName && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Product unavailable
                        </Badge>
                      )}
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.appliedPrice)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(
                          Number(item.appliedPrice) * item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{getCustomerName(order)}</p>
              </div>
              {order.user?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
              )}
              {order.guestEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email (Guest)</p>
                  <p className="font-medium">{order.guestEmail}</p>
                </div>
              )}
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
              )}
              {order.user?.isMember && (
                <Badge variant="secondary">Member</Badge>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="text-sm space-y-1">
                  <p>{order.shippingAddress.recipientName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phoneNumber && (
                    <p className="pt-2">
                      Phone: {order.shippingAddress.phoneNumber}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No shipping address</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">
                  {order.paymentMethod || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <OrderStatusBadge
                  status={order.paymentStatus}
                  type="payment"
                  size="sm"
                />
              </div>
              {order.paidAt && (
                <div>
                  <p className="text-sm text-gray-500">Paid At</p>
                  <p className="font-medium">
                    {formatOrderDateTime(order.paidAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Actions & Status (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* Status Update Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Order Status
                </label>
                <Select
                  value={order.status}
                  onValueChange={value =>
                    handleStatusUpdate(value as OrderStatus)
                  }
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger>
                    {isUpdatingStatus && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ORDER_STATUSES).map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintInvoice}
                className="w-full justify-start"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPackingSlip}
                className="w-full justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                Print Packing Slip
              </Button>
              {canFulfill && (
                <Button
                  size="sm"
                  onClick={handleFulfill}
                  disabled={isFulfilling}
                  className="w-full justify-start"
                >
                  {isFulfilling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4 mr-2" />
                  )}
                  Fulfill Order
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tracking Card */}
          {order.shipment && (
            <TrackingCard
              shipment={order.shipment}
              onRefreshTracking={handleRefreshTracking}
              isRefreshing={isRefreshingTracking}
            />
          )}
        </div>
      </div>
    </div>
  );
}
