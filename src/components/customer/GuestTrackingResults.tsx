/**
 * GuestTrackingResults Component
 * Displays tracking results for guest customers
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Calendar, 
  RefreshCw, 
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import TrackingStatus from './TrackingStatus';

interface GuestTrackingData {
  orderNumber: string;
  status: string;
  orderDate: string;
  hasShipment: boolean;
  courierName?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  basicEvents?: Array<{
    eventName: string;
    timestamp: string;
  }>;
}

interface GuestTrackingResultsProps {
  tracking: GuestTrackingData;
  onRefresh?: () => void;
  onBack?: () => void;
  refreshing?: boolean;
  className?: string;
}

/**
 * Format date for display
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    full: date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    short: date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  };
};

/**
 * Get status icon and color
 */
const getStatusInfo = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
      return { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'processing':
    case 'confirmed':
      return { icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    default:
      return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
};

export default function GuestTrackingResults({
  tracking,
  onRefresh,
  onBack,
  refreshing = false,
  className = ''
}: GuestTrackingResultsProps) {
  const statusInfo = getStatusInfo(tracking.status);
  const StatusIcon = statusInfo.icon;

  const orderDate = formatDate(tracking.orderDate);
  const estimatedDelivery = tracking.estimatedDelivery ? formatDate(tracking.estimatedDelivery) : null;
  const actualDelivery = tracking.actualDelivery ? formatDate(tracking.actualDelivery) : null;

  return (
    <div className={`guest-tracking-results space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {onBack && (
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            New Search
          </Button>
        )}
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{tracking.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Order Status */}
            <div className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                <span className="font-medium">Order Status</span>
              </div>
              <TrackingStatus status={tracking.status} size="lg" />
            </div>

            {/* Order Date */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Order Date</span>
              </div>
              <p className="text-lg">{orderDate.full}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Information */}
      {tracking.hasShipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Courier Info */}
              {tracking.courierName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Courier
                  </label>
                  <p className="text-lg font-medium">{tracking.courierName}</p>
                </div>
              )}

              {/* Delivery Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {estimatedDelivery && !actualDelivery && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Estimated Delivery
                    </label>
                    <p className="text-lg">{estimatedDelivery.full}</p>
                  </div>
                )}

                {actualDelivery && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Delivered On
                    </label>
                    <p className="text-lg font-medium text-green-600">
                      {actualDelivery.full}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Timeline */}
      {tracking.basicEvents && tracking.basicEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Tracking Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline events */}
              <div className="space-y-4">
                {tracking.basicEvents.map((event, index) => {
                  const eventDate = formatDate(event.timestamp);
                  const isLatest = index === 0;
                  
                  return (
                    <div key={`${event.timestamp}-${index}`} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className={`
                        relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2
                        ${isLatest 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-gray-100 border-gray-200'
                        }
                      `}>
                        <div className={`w-3 h-3 rounded-full ${
                          isLatest ? 'bg-blue-600' : 'bg-gray-400'
                        }`} />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              isLatest ? 'text-blue-900' : 'text-gray-700'
                            }`}>
                              {event.eventName}
                            </h4>
                          </div>

                          {/* Timestamp */}
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className={`text-sm font-medium ${
                              isLatest ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {eventDate.short}
                            </div>
                            <div className="text-xs text-gray-500">
                              {eventDate.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Shipping Info */}
      {!tracking.hasShipment && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Order Not Yet Shipped
            </h3>
            <p className="text-gray-600 mb-4">
              Your order is being prepared for shipment. You'll receive tracking information once it's dispatched.
            </p>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              Processing
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need More Information?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This is a summary view of your order status. For detailed information or assistance:
            </p>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/contact', '_blank')}
              >
                Contact Support
              </Button>
              
              {tracking.courierName && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Generate tracking URL for guest users (basic external link)
                    const courierName = tracking.courierName!;
                    const searchQuery = `${courierName} tracking Malaysia`;
                    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Track with {tracking.courierName}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <div className="text-xs text-center text-muted-foreground">
        <p>
          This tracking information is provided for order verification only. 
          No personal data is stored during this lookup.
        </p>
      </div>
    </div>
  );
}

/**
 * GuestTrackingResultsSkeleton Component
 * Loading skeleton for tracking results
 */
export function GuestTrackingResultsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`guest-tracking-results-skeleton space-y-6 ${className}`}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Order Summary Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Info Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-36 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div>
              <div className="w-28 h-4 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}