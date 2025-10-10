'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Truck,
  MapPin,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatOrderDateTime } from '@/lib/utils/order';
import { getStatusBadge } from '@/lib/utils/order';
import type { TrackingCardProps } from './types';

export function TrackingCard({
  shipment,
  onRefreshTracking,
  isRefreshing = false,
  showFullHistory = false,
}: TrackingCardProps) {
  const [showAll, setShowAll] = useState(showFullHistory);

  if (!shipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No shipment information available
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusBadge(shipment.status, 'shipment');
  const trackingEvents = shipment.trackingEvents || [];
  const displayedEvents = showAll ? trackingEvents : trackingEvents.slice(0, 3);
  const hasMoreEvents = trackingEvents.length > 3;

  const openTrackingLink = () => {
    if (shipment.trackingNumber) {
      // EasyParcel tracking URL
      window.open(
        `https://track.easyparcel.my/${shipment.trackingNumber}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipment Tracking
          </CardTitle>
          {onRefreshTracking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshTracking}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tracking Number & Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Tracking Number</span>
            <Badge variant="outline" className="font-mono text-xs">
              {shipment.trackingNumber || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <Badge
              className={`text-xs bg-${statusConfig.color}-100 text-${statusConfig.color}-800`}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Courier</span>
            <span className="text-sm font-medium">
              {shipment.courierName || 'N/A'}
            </span>
          </div>
        </div>

        {shipment.trackingNumber && (
          <Button
            variant="outline"
            size="sm"
            onClick={openTrackingLink}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Track on EasyParcel
          </Button>
        )}

        {/* Tracking Timeline */}
        {trackingEvents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-gray-700 mb-3">
                Tracking History
              </h4>
              <div className="space-y-3">
                {displayedEvents.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    {/* Timeline Icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          flex items-center justify-center w-6 h-6 rounded-full
                          ${
                            index === 0
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }
                        `}
                      >
                        {index === 0 ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>
                      {index < displayedEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {event.description}
                          </p>
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <time className="text-xs text-gray-500 whitespace-nowrap">
                          {formatOrderDateTime(event.eventTime)}
                        </time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More/Less Button */}
              {hasMoreEvents && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full mt-2 h-8 text-xs"
                >
                  {showAll
                    ? 'Show less'
                    : `Show ${trackingEvents.length - 3} more events`}
                </Button>
              )}
            </div>
          </>
        )}

        {/* No Tracking Events */}
        {trackingEvents.length === 0 && shipment.trackingNumber && (
          <p className="text-xs text-gray-500 text-center py-2">
            No tracking events available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
