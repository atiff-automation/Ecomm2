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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { getNextBusinessDay, validatePickupDate } from '@/lib/shipping/utils/date-utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type {
  FulfillmentConfirmDialogProps,
  CourierOption,
} from './types';

export function FulfillmentConfirmDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: FulfillmentConfirmDialogProps) {
  const { toast } = useToast();

  // State
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Courier selection state
  const [availableCouriers, setAvailableCouriers] = useState<CourierOption[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);

  // Load available couriers when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableCouriers();
      const nextBusinessDay = getNextBusinessDay();
      setPickupDate(format(nextBusinessDay, 'yyyy-MM-dd'));
      setDateError(null);
      setError(null);
    }
  }, [open]);

  // Load courier options from shipping-options API
  const loadAvailableCouriers = async () => {
    setLoadingCouriers(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping-options`);
      const data = await response.json();

      if (data.success && data.options) {
        setAvailableCouriers(data.options);

        // Pre-select customer's choice
        const customerChoice = data.options.find((opt: CourierOption) => opt.isCustomerChoice);
        setSelectedCourier(customerChoice || data.options[0]);
      } else {
        throw new Error(data.message || 'Failed to load courier options');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courier options';
      console.error('Failed to load courier options:', err);

      toast({
        title: 'Error Loading Couriers',
        description: errorMessage,
        variant: 'destructive',
      });

      // Fallback: Use customer's original selection only
      if (order.selectedCourierServiceId && order.courierName) {
        setAvailableCouriers([{
          serviceId: order.selectedCourierServiceId,
          courierName: order.courierName,
          cost: parseFloat(order.shippingCost?.toString() || '0'),
          estimatedDays: 'N/A',
          isCustomerChoice: true,
        }]);
        setSelectedCourier({
          serviceId: order.selectedCourierServiceId,
          courierName: order.courierName,
          cost: parseFloat(order.shippingCost?.toString() || '0'),
          estimatedDays: 'N/A',
          isCustomerChoice: true,
        });
      }
    } finally {
      setLoadingCouriers(false);
    }
  };

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

  // Single-step confirmation
  const handleConfirm = async () => {
    if (dateError || !pickupDate || !selectedCourier) {
      toast({
        title: 'Error',
        description: 'Please select courier and pickup date',
        variant: 'destructive',
      });
      return;
    }

    setError(null);

    try {
      // Calculate override flag dynamically
      const isOverride = selectedCourier.serviceId !== order.selectedCourierServiceId;

      // Call parent's onConfirm without shipmentId (single-step flow)
      await onConfirm(
        pickupDate,
        undefined, // No shipmentId - not using two-step flow
        {
          overriddenByAdmin: isOverride,
          selectedServiceId: selectedCourier.serviceId,
        }
      );
      // Dialog will be closed by parent component on success
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to complete fulfillment';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fulfill Order</DialogTitle>
          <DialogDescription>
            Select courier and pickup date to fulfill order {order.orderNumber}
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

          {/* Customer's Original Selection */}
          {order.courierName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-blue-900">
                Customer Selected:
              </Label>
              <p className="text-blue-800 font-semibold mt-1">
                ✓ {order.courierName} - RM {parseFloat(order.shippingCost?.toString() || '0').toFixed(2)}
              </p>
            </div>
          )}

          {/* Courier Override Dropdown */}
          <div>
            <Label htmlFor="courier-select" className="text-sm font-medium">
              Change Courier (Optional):
            </Label>

            {loadingCouriers ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Loading available couriers...
                </span>
              </div>
            ) : (
              <Select
                value={selectedCourier?.serviceId || ''}
                onValueChange={(serviceId) => {
                  const courier = availableCouriers.find(c => c.serviceId === serviceId);
                  if (courier) setSelectedCourier(courier);
                }}
              >
                <SelectTrigger id="courier-select" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCouriers.map((courier) => (
                    <SelectItem key={courier.serviceId} value={courier.serviceId}>
                      {courier.courierName} - RM {courier.cost.toFixed(2)}
                      {courier.isCustomerChoice && ' (Customer Choice)'}
                      {courier.cost < parseFloat(order.shippingCost?.toString() || '0') && ' 💰 CHEAPER'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Cost Difference Indicator */}
            {selectedCourier && !selectedCourier.isCustomerChoice && (
              <p className="text-xs mt-2">
                {selectedCourier.cost < parseFloat(order.shippingCost?.toString() || '0') ? (
                  <span className="text-green-600 font-medium">
                    💰 Save RM {(parseFloat(order.shippingCost?.toString() || '0') - selectedCourier.cost).toFixed(2)} vs customer selection
                  </span>
                ) : selectedCourier.cost > parseFloat(order.shippingCost?.toString() || '0') ? (
                  <span className="text-orange-600 font-medium">
                    ⚠️ RM {(selectedCourier.cost - parseFloat(order.shippingCost?.toString() || '0')).toFixed(2)} more expensive
                  </span>
                ) : null}
              </p>
            )}
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

          {/* Override Warning */}
          {selectedCourier && selectedCourier.serviceId !== order.selectedCourierServiceId && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                ⚠️ You are overriding the customer's courier selection.
                <br />
                Original: <strong>{order.courierName}</strong> → New: <strong>{selectedCourier.courierName}</strong>
              </p>
            </div>
          )}

          {/* Estimated Cost Display */}
          {selectedCourier && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Estimated Shipping Cost</p>
                  <p className="text-xs text-gray-500 mt-1">Based on current EasyParcel rates</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  RM {selectedCourier.cost.toFixed(2)}
                </p>
              </div>
            </div>
          )}

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
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !!dateError || !pickupDate || !selectedCourier || loadingCouriers}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fulfill Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
