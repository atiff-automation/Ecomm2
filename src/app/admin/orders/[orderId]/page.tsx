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
  Trash2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { ResponsiveFulfillmentDialog } from '@/components/admin/orders/ResponsiveFulfillmentDialog';
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

  const [order, setOrder] = useState<OrderDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (response.status === 404) {
        toast.error('Order not found');
        router.push('/admin/orders');
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) {
      return;
    }

    const previousStatus = order.status;
    const statusLabel = ORDER_STATUSES[newStatus]?.label || newStatus;

    setIsUpdatingStatus(true);
    try {
      const response = await fetchWithCSRF(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          triggeredBy: 'admin',
        }),
      });

      if (response.ok) {
        toast.success('Status Updated', {
          description: `Order status changed to "${statusLabel}"`,
        });
        fetchOrder();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFulfill = () => {
    if (!order) {
      return;
    }

    // Prevent fulfillment if order is already fulfilled
    if (order.shipment) {
      toast.error('This order has already been fulfilled');
      return;
    }

    // Prevent fulfillment if payment not completed
    if (order.paymentStatus !== 'PAID') {
      toast.error('Order must be paid before fulfillment');
      return;
    }

    if (!order.selectedCourierServiceId) {
      toast.error(
        'No courier service selected. Please select a courier from the order settings.'
      );
      return;
    }

    setFulfillmentDialogOpen(true);
  };

  const handleConfirmFulfillment = async (
    pickupDate: string,
    shipmentId?: string, // Keep for backward compatibility, but will be undefined
    options?: { overriddenByAdmin: boolean; selectedServiceId: string }
  ) => {
    if (!order) {
      throw new Error('No order available for fulfillment');
    }

    setIsFulfilling(true);

    try {
      const response = await fetchWithCSRF(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId:
            options?.selectedServiceId || order.selectedCourierServiceId,
          pickupDate: pickupDate,
          // No shipmentId - single-step flow
          overriddenByAdmin: options?.overriddenByAdmin || false,
        }),
      });

      if (response.ok) {
        toast.success('Order fulfilled successfully');

        setFulfillmentDialogOpen(false);
        fetchOrder();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fulfill order');
      }
    } catch (error) {
      console.error('[OrderDetailsPage] Fulfillment error:', error);
      throw error;
    } finally {
      setIsFulfilling(false);
    }
  };

  const handlePrintInvoice = () => {
    if (order) {
      window.open(
        `/api/orders/${order.id}/invoice?format=pdf&download=true`,
        '_blank'
      );
    }
  };

  const handlePrintPackingSlip = () => {
    if (!order) {
      return;
    }

    if (order.airwayBillUrl) {
      window.open(order.airwayBillUrl, '_blank');
    } else {
      toast.error(
        'Packing slip is not yet available. Please fulfill the order first.'
      );
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetchWithCSRF(`/api/admin/orders/${order.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Order ${data.orderNumber} has been permanently deleted`);
        router.push('/admin/orders');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete order');
      }
    } catch (error) {
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  // Determine button states
  const canFulfill = order.paymentStatus === 'PAID' && !order.shipment;
  const isFulfilled = order.shipment !== null;
  const hasPackingSlip = order.airwayBillGenerated === true;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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

          {/* Customer & Shipping Information (Combined) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer & Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                </h3>
                <div className="space-y-2 pl-6">
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
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h3>
                <div className="pl-6">
                  {order.shippingAddress ? (
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {order.shippingAddress.recipientName}
                      </p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city},{' '}
                        {order.shippingAddress.state}{' '}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      {order.shippingAddress.phoneNumber && (
                        <p className="pt-2 text-gray-600">
                          Phone: {order.shippingAddress.phoneNumber}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No shipping address</p>
                  )}
                </div>
              </div>
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
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Fulfill Order Button */}
              {canFulfill && (
                <Button
                  type="button"
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

              {/* Fulfill Order - Disabled/Grey if already fulfilled */}
              {isFulfilled && order.paymentStatus === 'PAID' && (
                <Button
                  type="button"
                  size="sm"
                  disabled
                  variant="outline"
                  className="w-full justify-start opacity-50 cursor-not-allowed"
                  title="Order already fulfilled"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Order Fulfilled
                </Button>
              )}

              {/* Print Invoice */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintInvoice}
                className="w-full justify-start"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>

              {/* Print Packing Slip - Only show if available */}
              {hasPackingSlip && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPackingSlip}
                  className="w-full justify-start"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Print Packing Slip
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Shipping & Tracking Information - Show if tracking data or shipment exists */}
          {(order.trackingNumber || order.airwayBillUrl || order.shipment) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Shipping & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tracking Number */}
                {(order.trackingNumber || order.shipment?.trackingNumber) && (
                  <div>
                    <p className="text-sm text-gray-500">Tracking Number</p>
                    <p className="font-semibold font-mono text-sm">
                      {order.trackingNumber || order.shipment?.trackingNumber}
                    </p>
                  </div>
                )}

                {/* Courier Info */}
                {order.courierName && (
                  <div>
                    <p className="text-sm text-gray-500">Courier</p>
                    <p className="font-medium">{order.courierName}</p>
                  </div>
                )}

                {/* Service Type */}
                {order.courierServiceDetail && (
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p className="font-medium capitalize">
                      {order.courierServiceDetail}
                    </p>
                  </div>
                )}

                {/* Shipping Cost Charged */}
                {order.shippingCostCharged && (
                  <div>
                    <p className="text-sm text-gray-500">Shipping Cost</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(order.shippingCostCharged)}
                    </p>
                  </div>
                )}

                {/* Shipment Status */}
                {order.shipment?.status && (
                  <div>
                    <p className="text-sm text-gray-500">Shipment Status</p>
                    <OrderStatusBadge
                      status={order.shipment.status}
                      type="shipment"
                      size="sm"
                    />
                  </div>
                )}

                {/* Pickup Date */}
                {order.scheduledPickupDate && (
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Pickup</p>
                    <p className="font-medium">
                      {new Date(order.scheduledPickupDate).toLocaleDateString(
                        'en-MY',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                )}

                {/* Estimated Delivery */}
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-sm text-gray-500">Estimated Delivery</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.estimatedDelivery}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Track Shipment */}
                  {order.trackingUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(order.trackingUrl || '', '_blank')
                      }
                      className="w-full justify-start text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Track Shipment
                    </Button>
                  )}

                  {/* View AWB */}
                  {order.airwayBillUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(order.airwayBillUrl || '', '_blank')
                      }
                      className="w-full justify-start text-xs"
                    >
                      <Package className="h-3 w-3 mr-2" />
                      View Airway Bill
                    </Button>
                  )}
                </div>

                {/* Tracking Events */}
                {order.shipment?.trackingEvents &&
                  order.shipment.trackingEvents.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Recent Updates
                        </p>
                        <div className="space-y-2">
                          {order.shipment.trackingEvents
                            .slice(0, 3)
                            .map((event, index) => (
                              <div
                                key={index}
                                className="text-xs border-l-2 border-gray-200 pl-3 py-1"
                              >
                                <p className="font-medium">{event.eventName}</p>
                                {event.description && (
                                  <p className="text-gray-600">
                                    {event.description}
                                  </p>
                                )}
                                <p className="text-gray-400 text-[10px] mt-1">
                                  {new Date(event.timestamp).toLocaleString(
                                    'en-MY'
                                  )}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* AWB Generated Timestamp */}
                {order.airwayBillGeneratedAt && (
                  <p className="text-xs text-gray-400 pt-2">
                    AWB Generated:{' '}
                    {new Date(order.airwayBillGeneratedAt).toLocaleString(
                      'en-MY'
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone - Always at the bottom */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-sm text-red-600">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="w-full justify-start"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Order
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Permanently delete this order and all related data. This action
                cannot be undone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fulfillment Confirmation Dialog */}
      {order && (
        <ResponsiveFulfillmentDialog
          open={fulfillmentDialogOpen}
          onOpenChange={setFulfillmentDialogOpen}
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            courierName: order.courierName,
            courierServiceDetail: order.courierServiceDetail,
            selectedCourierServiceId: order.selectedCourierServiceId || '',
            shippingCost: order.shippingCost,
          }}
          onConfirm={handleConfirmFulfillment}
          isLoading={isFulfilling}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Are you absolutely sure?
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  This will permanently delete order{' '}
                  <span className="font-semibold text-red-600">
                    {order.orderNumber}
                  </span>{' '}
                  and all its associated data including order items, addresses,
                  and payment records.
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteOrder}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Order'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
