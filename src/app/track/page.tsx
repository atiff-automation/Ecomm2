'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
// Simple date formatting utility
const formatDate = (dateString: string, includeTime = false) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
  return date.toLocaleDateString('en-MY', options);
};

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  deliveredAt?: string;
}

interface OrderInfo {
  orderNumber: string;
  status: string;
  shippedAt: string;
  total: number;
  customerName: string;
  deliveryAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

interface TrackingResponse {
  tracking: TrackingInfo;
  order?: OrderInfo;
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/shipping/track/${encodeURIComponent(trackingNumber.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to retrieve tracking information'
        );
      }

      setTrackingData(data);
    } catch (error) {
      console.error('Tracking error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve tracking information'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrack();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'picked_up':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'exception':
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-orange-100 text-orange-800';
      case 'exception':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Track Your Order
        </h1>
        <p className="text-gray-600">
          Enter your tracking number to get real-time updates on your shipment
        </p>
      </div>

      {/* Tracking Input */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Track Shipment
          </CardTitle>
          <CardDescription>
            Enter your tracking number from your order confirmation email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter tracking number (e.g., EP1234567890)"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleTrack} disabled={loading}>
              {loading ? 'Tracking...' : 'Track'}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingData && (
        <div className="space-y-6">
          {/* Order Summary */}
          {trackingData.order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold">
                      {trackingData.order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">
                      RM {trackingData.order.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold">
                      {trackingData.order.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shipped Date</p>
                    <p className="font-semibold">
                      {formatDate(trackingData.order.shippedAt, true)}
                    </p>
                  </div>
                </div>

                {trackingData.order.deliveryAddress && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Delivery Address
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold">
                        {trackingData.order.deliveryAddress.name}
                      </p>
                      <p>{trackingData.order.deliveryAddress.addressLine1}</p>
                      {trackingData.order.deliveryAddress.addressLine2 && (
                        <p>{trackingData.order.deliveryAddress.addressLine2}</p>
                      )}
                      <p>
                        {trackingData.order.deliveryAddress.city},{' '}
                        {trackingData.order.deliveryAddress.state}{' '}
                        {trackingData.order.deliveryAddress.postalCode}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tracking Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Tracking Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(trackingData.tracking.status)}
                  <span className="font-semibold">
                    Tracking #: {trackingData.tracking.trackingNumber}
                  </span>
                </div>
                <Badge className={getStatusColor(trackingData.tracking.status)}>
                  {trackingData.tracking.statusDescription}
                </Badge>
              </div>

              {trackingData.tracking.estimatedDelivery &&
                !trackingData.tracking.deliveredAt && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <p className="text-blue-800 font-medium">
                        Estimated Delivery:{' '}
                        {formatDate(trackingData.tracking.estimatedDelivery)}
                      </p>
                    </div>
                  </div>
                )}

              {trackingData.tracking.deliveredAt && (
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">
                      Delivered on{' '}
                      {formatDate(trackingData.tracking.deliveredAt, true)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Tracking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackingData.tracking.events &&
              trackingData.tracking.events.length > 0 ? (
                <div className="space-y-4">
                  {trackingData.tracking.events
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                          {index < trackingData.tracking.events.length - 1 && (
                            <div className="w-px h-12 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">
                              {event.description}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {event.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.timestamp, true)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tracking events available yet</p>
                  <p className="text-sm">
                    Tracking information will appear once your package is picked
                    up
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  If you have questions about your shipment or need assistance,
                  please contact our customer service team.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/support" className="flex items-center gap-2">
                      Contact Support
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://track.easyparcel.my"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Carrier Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      {!trackingData && (
        <Card>
          <CardHeader>
            <CardTitle>How to Track Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  1. Get Your Tracking Number
                </h3>
                <p className="text-sm text-gray-600">
                  Your tracking number is included in your order confirmation
                  email
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Enter Tracking Number</h3>
                <p className="text-sm text-gray-600">
                  Type or paste your tracking number in the search box above
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  3. View Real-time Updates
                </h3>
                <p className="text-sm text-gray-600">
                  See your package&apos;s journey from our warehouse to your
                  door
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
