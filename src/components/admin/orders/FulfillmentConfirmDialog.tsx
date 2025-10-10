'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { getNextBusinessDay, validatePickupDate } from '@/lib/shipping/utils/date-utils';
import { format } from 'date-fns';

interface FulfillmentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    courierName?: string;
    selectedCourierServiceId: string;
  };
  onConfirm: (pickupDate: string) => Promise<void>;
  isLoading?: boolean;
}

export function FulfillmentConfirmDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: FulfillmentConfirmDialogProps) {
  // State
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize pickup date when dialog opens
  useEffect(() => {
    if (open) {
      const nextBusinessDay = getNextBusinessDay();
      setPickupDate(format(nextBusinessDay, 'yyyy-MM-dd'));
      setDateError(null);
      setError(null);
    }
  }, [open]);

  // Calculate min and max dates for date picker
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  // Validate pickup date on change
  const handleDateChange = (newDate: string) => {
    setPickupDate(newDate);

    const date = new Date(newDate);
    const validation = validatePickupDate(date);

    if (!validation.isValid) {
      setDateError(validation.error || 'Invalid pickup date');
    } else {
      setDateError(null);
    }
  };

  // Handle confirm button
  const handleConfirm = async () => {
    if (dateError) return;

    try {
      setError(null);
      await onConfirm(pickupDate);
      // Dialog will be closed by parent component on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fulfill order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Order Fulfillment</DialogTitle>
          <DialogDescription>
            Review and confirm shipment details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Number</Label>
            <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border">
              {order.orderNumber}
            </p>
          </div>

          {/* Courier Service */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Courier Service</Label>
            <p className="text-sm">{order.courierName || 'Selected at checkout'}</p>
            <p className="text-xs text-gray-500">
              Go to order detail page to change courier
            </p>
          </div>

          {/* Pickup Date Selector */}
          <div className="space-y-2">
            <Label htmlFor="pickup-date" className="text-sm font-medium">
              Pickup Date: <span className="text-red-500">*</span>
            </Label>
            <input
              id="pickup-date"
              type="date"
              className="w-full px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              value={pickupDate}
              onChange={e => handleDateChange(e.target.value)}
              min={minDate}
              max={maxDate}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-600">
              Default: Next business day. Can schedule up to 7 days ahead.
            </p>
            {dateError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {dateError}
              </p>
            )}
          </div>

          {/* Warning Alert */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              This will create a shipment with EasyParcel and cannot be undone.
              Please ensure the pickup date is correct before confirming.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !!dateError || !pickupDate}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Fulfillment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
