/**
 * OrderTrackingCard Component
 * Displays tracking information in order list view
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  Clock,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { copyTrackingNumber } from '@/lib/utils/clipboard';
import {
  generateTrackingUrl,
  getCourierInfo,
} from '@/lib/utils/tracking-links';

interface TrackingInfo {
  trackingNumber?: string;
  status?: string;
  courierName?: string;
  estimatedDelivery?: string;
}

interface OrderTrackingCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    shipment?: TrackingInfo;
  };
  className?: string;
}

/**
 * Get tracking status badge color and icon
 */
const getTrackingStatusInfo = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'Delivered',
      };
    case 'out_for_delivery':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
        text: 'Out for Delivery',
      };
    case 'in_transit':
      return {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: Truck,
        text: 'In Transit',
      };
    case 'picked_up':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Package,
        text: 'Picked Up',
      };
    case 'pending':
    case 'created':
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        text: 'Processing',
      };
    case 'exception':
    case 'failed':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        text: 'Exception',
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package,
        text: status || 'Unknown',
      };
  }
};

export default function OrderTrackingCard({
  order,
  className = '',
}: OrderTrackingCardProps) {
  const [copying, setCopying] = useState(false);

  const { shipment } = order;
  const hasTracking = shipment?.trackingNumber;
  const statusInfo = getTrackingStatusInfo(shipment?.status);
  const StatusIcon = statusInfo.icon;

  const handleCopyTracking = async () => {
    if (!shipment?.trackingNumber) {
      return;
    }

    setCopying(true);
    await copyTrackingNumber(shipment.trackingNumber);
    setCopying(false);
  };

  const handleExternalTracking = () => {
    if (!shipment?.trackingNumber || !shipment?.courierName) {
      return;
    }

    const url = generateTrackingUrl(
      shipment.courierName,
      shipment.trackingNumber
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return '';
    }

    return new Date(dateString).toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!hasTracking) {
    return (
      <div className={`tracking-info-empty ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="h-4 w-4" />
          <span>No tracking available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tracking-info-card space-y-3 ${className}`}>
      {/* Tracking Status */}
      <div className="flex items-center gap-2">
        <Badge className={statusInfo.color} variant="outline">
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.text}
        </Badge>
        {shipment?.courierName && (
          <Badge variant="outline" className="text-xs">
            {shipment.courierName}
          </Badge>
        )}
      </div>

      {/* Tracking Number */}
      <div className="flex items-start sm:items-center gap-2 flex-wrap sm:flex-nowrap">
        <span className="text-sm text-gray-600">Tracking:</span>
        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
          {shipment.trackingNumber}
        </code>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyTracking}
            disabled={copying}
            className="h-7 w-7 p-0"
            title="Copy tracking number"
          >
            <Copy className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalTracking}
            className="h-7 w-7 p-0"
            title="Track on courier website"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Estimated Delivery */}
      {shipment?.estimatedDelivery && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Est. delivery: {formatDate(shipment.estimatedDelivery)}</span>
        </div>
      )}
    </div>
  );
}
