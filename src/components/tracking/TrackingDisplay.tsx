'use client';

import React from 'react';
import { OrderStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, ExternalLink, AlertCircle } from 'lucide-react';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { TRACKING_MESSAGES } from '@/lib/config/tracking-simple';

interface TrackingDisplayProps {
  order: {
    orderNumber: string;
    status: OrderStatus;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  };
}

/**
 * TrackingDisplay Component
 *
 * Displays order tracking information with timeline
 * Following @CLAUDE.md: Type Safety, Single Responsibility
 *
 * @param order - Order data from API
 */
export function TrackingDisplay({ order }: TrackingDisplayProps) {
  const { orderNumber, status, courierName, trackingNumber, trackingUrl } = order;

  // Handle special statuses
  if (status === 'PENDING') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Order #{orderNumber}</h3>
          <p className="text-gray-600">{TRACKING_MESSAGES.PENDING_PAYMENT}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Badge variant="destructive" className="mb-4 text-base px-4 py-2">
            {TRACKING_MESSAGES.CANCELLED}
          </Badge>
          <h3 className="text-lg font-semibold">Order #{orderNumber}</h3>
        </CardContent>
      </Card>
    );
  }

  if (status === 'REFUNDED') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Badge variant="outline" className="mb-4 text-base px-4 py-2 border-orange-500 text-orange-700">
            {TRACKING_MESSAGES.REFUNDED}
          </Badge>
          <h3 className="text-lg font-semibold">Order #{orderNumber}</h3>
        </CardContent>
      </Card>
    );
  }

  // Normal timeline display
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order #{orderNumber}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timeline */}
        <OrderStatusTimeline currentStatus={status} />

        {/* Divider */}
        <div className="border-t pt-4" />

        {/* Shipping Information */}
        <div className="space-y-3">
          {/* Courier Name */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Courier:</span>
            <span className="font-medium">
              {courierName || '—'}
            </span>
          </div>

          {/* Tracking Number */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tracking Number:</span>
            <span className="font-medium font-mono text-sm">
              {trackingNumber || '—'}
            </span>
          </div>
        </div>

        {/* EasyParcel Tracking Button or Preparing Message */}
        {trackingUrl ? (
          <Button
            className="w-full"
            onClick={() => window.open(trackingUrl, '_blank', 'noopener,noreferrer')}
          >
            <Truck className="w-4 h-4 mr-2" />
            Track with EasyParcel
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              {TRACKING_MESSAGES.PREPARING_SHIPMENT}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
