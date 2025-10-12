'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  Truck,
  Package,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUSES } from '@/lib/constants/order';
import type { OrderInlineActionsProps } from './types';

export function OrderInlineActions({
  order,
  onStatusUpdate,
  onFulfill,
  isUpdating = false,
  compact = false,
}: OrderInlineActionsProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      const result = await onStatusUpdate(order.id, newStatus as OrderStatus);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Order status updated',
        });
        // Refresh page to show updated data
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update status',
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
      setIsChangingStatus(false);
    }
  };

  const handleFulfill = async () => {
    setIsFulfilling(true);
    try {
      const result = await onFulfill(order.id);

      if (!result.success && result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
      // Success is handled by the parent component (opens dialog or refreshes)
    } catch (error) {
      console.error('[OrderInlineActions] Fulfillment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fulfill order',
        variant: 'destructive',
      });
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleDownloadPackingSlip = () => {
    if (order.airwayBillUrl) {
      window.open(order.airwayBillUrl, '_blank');
    } else {
      toast({
        title: 'Not Available',
        description: 'Packing slip is not yet available.',
        variant: 'destructive',
      });
    }
  };

  const handleTrackShipment = () => {
    if (order.shipment?.trackingNumber) {
      window.open(
        `https://track.easyparcel.my/${order.shipment.trackingNumber}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  // Fulfillment is available if:
  // 1. Payment status is PAID
  // 2. Order doesn't have a shipment yet (not fulfilled)
  const canFulfill = order.paymentStatus === 'PAID' && !order.shipment;

  // Show packing slip if airway bill has been generated
  const hasPackingSlip = order.airwayBillGenerated === true;

  const hasTracking = order.shipment?.trackingNumber;

  // Compact view (for mobile)
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canFulfill && (
            <DropdownMenuItem onClick={handleFulfill} disabled={isFulfilling}>
              {isFulfilling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {!isFulfilling && <Truck className="mr-2 h-4 w-4" />}
              Fulfill Order
            </DropdownMenuItem>
          )}
          {hasPackingSlip && (
            <DropdownMenuItem onClick={handleDownloadPackingSlip}>
              <Printer className="mr-2 h-4 w-4" />
              Download Packing Slip
            </DropdownMenuItem>
          )}
          {hasTracking && (
            <DropdownMenuItem onClick={handleTrackShipment}>
              <Package className="mr-2 h-4 w-4" />
              Track Shipment
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full view (for desktop)
  return (
    <div className="flex items-center gap-1 justify-end">
      {/* Fulfill Order - Only show if paid and not yet fulfilled */}
      {canFulfill && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleFulfill}
          disabled={isFulfilling}
          title="Fulfill order"
        >
          {isFulfilling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Truck className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Fulfill Order - Disabled/Grey if already fulfilled */}
      {!canFulfill && order.paymentStatus === 'PAID' && order.shipment && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
          disabled
          title="Order already fulfilled"
        >
          <Truck className="h-4 w-4" />
        </Button>
      )}

      {/* Download Packing Slip - Only show if AWB generated */}
      {hasPackingSlip && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDownloadPackingSlip}
          title="Download packing slip"
        >
          <Printer className="h-4 w-4" />
        </Button>
      )}

      {/* Track Shipment (if has tracking) */}
      {hasTracking && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleTrackShipment}
          title="Track shipment"
        >
          <Package className="h-4 w-4" />
        </Button>
      )}

      {/* Quick Status Update Dropdown */}
      <Select
        value={order.status}
        onValueChange={handleStatusChange}
        disabled={isChangingStatus}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          {isChangingStatus ? (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          ) : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(ORDER_STATUSES).map(status => (
            <SelectItem
              key={status.value}
              value={status.value}
              className="text-xs"
            >
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
