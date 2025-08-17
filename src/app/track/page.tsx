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
import DeliveryTimelineVisualization from '@/components/tracking/DeliveryTimelineVisualization';
import DeliveryNotifications from '@/components/tracking/DeliveryNotifications';
import ProofOfDelivery from '@/components/tracking/ProofOfDelivery';
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
  id?: string;
  eventCode: string;
  eventName: string;
  description: string;
  location?: string;
  eventTime: string;
  source: string;
  category?: string;
  isImportant?: boolean;
  courierRemarks?: string;
  // Legacy support
  timestamp: string;
  status: string;
}

interface DeliveryProof {
  deliveredAt: string;
  receivedBy: string;
  receiverName?: string;
  receiverRelationship?: string;
  signatureImage?: string;
  deliveryPhoto?: string;
  deliveryNotes?: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  courierName?: string;
  courierPhone?: string;
  verificationMethod?: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  deliveredAt?: string;
  actualDelivery?: string;
  courierName?: string;
  serviceName?: string;
  progress?: number;
  isDelivered?: boolean;
  inTransit?: boolean;
  deliveryProof?: DeliveryProof;
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
  shipment?: {
    id: string;
    trackingNumber: string;
    status: string;
    progress: number;
    isDelivered: boolean;
    estimatedDelivery?: string;
    actualDelivery?: string;
    courierName?: string;
    serviceName?: string;
    deliveryProof?: DeliveryProof;
  };
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

          {/* Enhanced Delivery Timeline Visualization */}
          <DeliveryTimelineVisualization
            trackingNumber={trackingData.tracking.trackingNumber}
            currentStatus={trackingData.tracking.status}
            statusDescription={trackingData.tracking.statusDescription}
            estimatedDelivery={trackingData.tracking.estimatedDelivery || trackingData.shipment?.estimatedDelivery}
            actualDelivery={trackingData.tracking.actualDelivery || trackingData.tracking.deliveredAt || trackingData.shipment?.actualDelivery}
            trackingEvents={trackingData.tracking.events.map(event => ({
              ...event,
              eventCode: event.eventCode || event.status,
              eventName: event.eventName || event.description,
              eventTime: event.eventTime || event.timestamp,
              source: event.source || 'EASYPARCEL',
            }))}
            courierName={trackingData.tracking.courierName || trackingData.shipment?.courierName}
            serviceName={trackingData.tracking.serviceName || trackingData.shipment?.serviceName}
            progress={trackingData.tracking.progress || trackingData.shipment?.progress}
            isDelivered={trackingData.tracking.isDelivered || trackingData.shipment?.isDelivered || trackingData.tracking.status === 'DELIVERED'}
            inTransit={trackingData.tracking.inTransit || ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(trackingData.tracking.status)}
          />

          {/* Delivery Notifications */}
          <DeliveryNotifications
            trackingNumber={trackingData.tracking.trackingNumber}
            currentStatus={trackingData.tracking.status}
            customerEmail={trackingData.order?.customerName ? `${trackingData.order.customerName.toLowerCase().replace(' ', '.')}@example.com` : undefined}
          />

          {/* Proof of Delivery */}
          {(trackingData.tracking.isDelivered || trackingData.shipment?.isDelivered || trackingData.tracking.status === 'DELIVERED') && (
            <ProofOfDelivery
              trackingNumber={trackingData.tracking.trackingNumber}
              deliveryProof={trackingData.tracking.deliveryProof || trackingData.shipment?.deliveryProof}
              customerName={trackingData.order?.customerName}
              deliveryAddress={trackingData.order?.deliveryAddress ? 
                `${trackingData.order.deliveryAddress.addressLine1}, ${trackingData.order.deliveryAddress.city}, ${trackingData.order.deliveryAddress.state} ${trackingData.order.deliveryAddress.postalCode}` : 
                undefined
              }
            />
          )}

          {/* Legacy Tracking Status - kept for fallback */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-600">
                <Truck className="h-5 w-5" />
                Legacy Tracking View
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

              {/* Simple Event List */}
              {trackingData.tracking.events &&
              trackingData.tracking.events.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-700">Recent Events:</p>
                  {trackingData.tracking.events
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .slice(0, 3)
                    .map((event, index) => (
                      <div key={index} className="text-sm text-gray-600 border-l-2 border-gray-200 pl-2">
                        <span className="font-medium">{event.description}</span>
                        {event.location && <span className="ml-2">- {event.location}</span>}
                        <div className="text-xs text-gray-400">
                          {formatDate(event.timestamp, true)}
                        </div>
                      </div>
                    ))}
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
