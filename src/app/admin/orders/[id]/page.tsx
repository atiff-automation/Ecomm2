/**
 * Admin Order Details Page - JRM E-commerce Platform
 * Detailed view of individual orders for admin management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Edit,
  FileText,
  AlertCircle,
  CheckCircle2,
  Truck,
  Calendar,
  Mail,
  Phone,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Download,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

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

interface Address {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

// Define tracking status type
type TrackingStatus = 
  | 'pending'
  | 'booked' 
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'cancelled';

interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description: string;
  courierStatus?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount?: number;
  memberDiscount?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isMember: boolean;
    memberSince?: string;
  };
  
  // NEW: Comprehensive shipment data
  shipment?: {
    id: string;
    easyParcelShipmentId?: string;
    trackingNumber?: string;
    courierName?: string;
    serviceName?: string;
    status?: TrackingStatus;
    statusDescription?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    trackingEvents?: TrackingEvent[];
    lastTrackedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  
  // NEW: Tracking state
  const [refreshingTracking, setRefreshingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string>('');

  const orderId = params.id as string;

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin/orders');
      return;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      router.push('/');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [session, status, router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
        } else {
          throw new Error('Failed to fetch order details');
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  // Determine price type and badge information for order items
  const getPriceTypeInfo = (item: OrderItem, order: OrderDetails) => {
    // If no discount applied, it's regular price
    if (item.finalPrice >= item.price) {
      return {
        priceType: 'regular',
        badgeText: '',
        badgeVariant: 'outline' as const,
        textColor: 'text-gray-900'
      };
    }

    // If there's a discount, determine if it's member or promotional based on order-level discounts
    const hasPromotionalDiscount = order.discountAmount && order.discountAmount > 0;
    const hasMemberDiscount = order.memberDiscount && order.memberDiscount > 0;

    // If both discounts exist, prioritize promotional (as that's what our logic does)
    if (hasPromotionalDiscount) {
      return {
        priceType: 'promotional',
        badgeText: 'Promotional',
        badgeVariant: 'destructive' as const,
        textColor: 'text-red-600'
      };
    } else if (hasMemberDiscount) {
      return {
        priceType: 'member',
        badgeText: 'Member Price',
        badgeVariant: 'secondary' as const,
        textColor: 'text-green-600'
      };
    } else {
      // Fallback for unknown discount type
      return {
        priceType: 'discounted',
        badgeText: 'Discounted',
        badgeVariant: 'outline' as const,
        textColor: 'text-gray-700'
      };
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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

  // NEW: Tracking helper functions
  const getTrackingStatusColor = (status?: TrackingStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'booked':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'exception':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTrackingStatus = (status?: TrackingStatus): string => {
    if (!status) return 'No Status';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleRefreshTracking = async (orderId: string) => {
    setRefreshingTracking(true);
    setTrackingError('');
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: 'POST', // POST to trigger refresh
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refresh order details to get updated tracking
        await fetchOrderDetails();
      } else {
        const error = await response.json();
        setTrackingError(error.message || 'Failed to refresh tracking');
      }
    } catch (error) {
      setTrackingError('Network error while refreshing tracking');
    } finally {
      setRefreshingTracking(false);
    }
  };

  const openCourierTracking = (courierName: string, trackingNumber: string) => {
    const courierUrls: Record<string, string> = {
      'Pos Laju': `https://www.pos.com.my/postal-services/quick-access/?track-trace=${trackingNumber}`,
      'GDex': `https://gdexpress.com/home/parcel_tracking?tracking_number=${trackingNumber}`,
      'City-Link': `https://www.citylinkexpress.com/tools/parcel-tracking?awb=${trackingNumber}`,
      'J&T Express': `https://www.jtexpress.my/index/query/gzquery.html?bills=${trackingNumber}`,
      'DHL': `https://www.dhl.com/my-en/home/tracking.html?tracking-id=${trackingNumber}`,
    };
    
    const url = courierUrls[courierName];
    if (url) {
      window.open(url, '_blank');
    } else {
      // Fallback to Google search
      window.open(`https://www.google.com/search?q=${courierName}+tracking+${trackingNumber}`, '_blank');
    }
  };

  const handleDownloadLabel = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/admin/shipping/labels/${shipmentId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `label-${shipmentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download label:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading order details...</p>
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
            <Button onClick={() => router.push('/admin/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Orders', href: '/admin/orders' },
            { label: `Order #${order.orderNumber}` },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/orders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={`${getStatusColor(order.status)} border px-3 py-1`}
            >
              {order.status}
            </Badge>
            <Badge
              className={`${getPaymentStatusColor(order.paymentStatus)} border px-3 py-1`}
            >
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
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
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: {formatPrice(item.finalPrice)}</span>
                          {(() => {
                            const priceInfo = getPriceTypeInfo(item, order);
                            return priceInfo.badgeText && (
                              <Badge variant={priceInfo.badgeVariant} className="text-xs">
                                {priceInfo.badgeText}
                              </Badge>
                            );
                          })()}
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
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {order.customer.firstName} {order.customer.lastName}
                    </span>
                    {order.customer.isMember && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        Member
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{order.customer.email}</span>
                  </div>
                  {order.customer.memberSince && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Member since {formatDate(order.customer.memberSince)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {order.shippingAddress.firstName}{' '}
                      {order.shippingAddress.lastName}
                    </p>
                    {order.shippingAddress.email && (
                      <p>{order.shippingAddress.email}</p>
                    )}
                    {order.shippingAddress.phone && (
                      <p>{order.shippingAddress.phone}</p>
                    )}
                    <p>{order.shippingAddress.address}</p>
                    {order.shippingAddress.address2 && (
                      <p>{order.shippingAddress.address2}</p>
                    )}
                    <p>
                      {order.shippingAddress.postcode}{' '}
                      {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {order.billingAddress.firstName}{' '}
                      {order.billingAddress.lastName}
                    </p>
                    {order.billingAddress.email && (
                      <p>{order.billingAddress.email}</p>
                    )}
                    {order.billingAddress.phone && (
                      <p>{order.billingAddress.phone}</p>
                    )}
                    <p>{order.billingAddress.address}</p>
                    {order.billingAddress.address2 && (
                      <p>{order.billingAddress.address2}</p>
                    )}
                    <p>
                      {order.billingAddress.postcode}{' '}
                      {order.billingAddress.city}, {order.billingAddress.state}
                    </p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Update Order Status
                  </label>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusUpdate}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {updating && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Updating order status...
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `/api/orders/${order.id}/invoice?format=pdf&download=true`
                      )
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Shipping & Tracking Section */}
            {order.shipment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping & Tracking
                    {order.shipment.lastTrackedAt && (
                      <Badge variant="outline" className="text-xs">
                        Updated {formatRelativeTime(order.shipment.lastTrackedAt)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tracking Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">{order.shipment.trackingNumber || 'N/A'}</span>
                        {order.shipment.trackingNumber && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(order.shipment!.trackingNumber!)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Courier</label>
                      <div className="text-sm mt-1">
                        {order.shipment.courierName || 'N/A'}
                        {order.shipment.serviceName && (
                          <div className="text-xs text-gray-500">{order.shipment.serviceName}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge className={`${getTrackingStatusColor(order.shipment.status)} border`}>
                          {formatTrackingStatus(order.shipment.status)}
                        </Badge>
                        {order.shipment.statusDescription && (
                          <div className="text-xs text-gray-500 mt-1">{order.shipment.statusDescription}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Delivery</label>
                      <div className="text-sm mt-1">
                        {order.shipment.estimatedDelivery ? formatDate(order.shipment.estimatedDelivery) : 'TBD'}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tracking Timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Tracking History</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshTracking(order.id)}
                        disabled={refreshingTracking}
                      >
                        {refreshingTracking ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>
                    
                    {trackingError && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{trackingError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {order.shipment.trackingEvents && order.shipment.trackingEvents.length > 0 ? (
                        order.shipment.trackingEvents.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                              index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm">{event.status}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                  {event.location && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 text-right ml-2">
                                  {formatDateTime(event.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No tracking events available yet</p>
                          <p className="text-sm">Tracking information will appear once the shipment is picked up</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.shipment.trackingNumber && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://track.easyparcel.my/${order.shipment!.trackingNumber}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Track on EasyParcel
                        </Button>
                        
                        {order.shipment.courierName && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCourierTracking(order.shipment!.courierName!, order.shipment!.trackingNumber!)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Track on {order.shipment.courierName}
                          </Button>
                        )}
                      </>
                    )}
                    
                    {order.shipment.easyParcelShipmentId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadLabel(order.shipment!.easyParcelShipmentId!)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Label
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                {order.memberDiscount && order.memberDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Member Discount</span>
                    <span>-{formatPrice(order.memberDiscount)}</span>
                  </div>
                )}

                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Promotional Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax (SST)</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Status</span>
                  <Badge
                    className={`${getPaymentStatusColor(order.paymentStatus)} border text-xs`}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Method</span>
                    <span className="text-sm font-medium">
                      {order.paymentMethod}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm">{formatDate(order.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
