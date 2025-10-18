'use client';

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import {
  getNextBusinessDay,
  validatePickupDate,
} from '@/lib/shipping/utils/date-utils';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { breakpoints } from '@/lib/design-tokens';
import {
  MAX_PICKUP_DAYS_AHEAD,
  SHEET_HEIGHT_MOBILE,
  DIALOG_MAX_WIDTH,
  UNAVAILABLE_TEXT,
  ERROR_MESSAGES,
} from '@/lib/constants/fulfillment';
import type { FulfillmentConfirmDialogProps, CourierOption } from './types';

export function ResponsiveFulfillmentDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: FulfillmentConfirmDialogProps) {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.mobile})`);

  // State
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Courier selection state
  const [availableCouriers, setAvailableCouriers] = useState<CourierOption[]>(
    []
  );
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(
    null
  );

  // Load available couriers when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableCouriers();
      const nextBusinessDay = getNextBusinessDay();
      setPickupDate(format(nextBusinessDay, 'yyyy-MM-dd'));
      setDateError(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load courier options from shipping-options API
  const loadAvailableCouriers = async () => {
    setLoadingCouriers(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/shipping-options`
      );
      const data = await response.json();

      if (data.success && data.options) {
        setAvailableCouriers(data.options);

        // Pre-select customer's choice
        const customerChoice = data.options.find(
          (opt: CourierOption) => opt.isCustomerChoice
        );
        setSelectedCourier(customerChoice || data.options[0]);
      } else {
        throw new Error(data.message || ERROR_MESSAGES.LOAD_COURIERS);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.LOAD_COURIERS;
      console.error('Failed to load courier options:', err);

      toast.error(errorMessage);

      // Fallback: Use customer's original selection only
      if (order.selectedCourierServiceId && order.courierName) {
        setAvailableCouriers([
          {
            serviceId: order.selectedCourierServiceId,
            courierName: order.courierName,
            cost: parseFloat(order.shippingCost?.toString() || '0'),
            estimatedDays: UNAVAILABLE_TEXT,
            isCustomerChoice: true,
          },
        ]);
        setSelectedCourier({
          serviceId: order.selectedCourierServiceId,
          courierName: order.courierName,
          cost: parseFloat(order.shippingCost?.toString() || '0'),
          estimatedDays: UNAVAILABLE_TEXT,
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
    addDays(new Date(), MAX_PICKUP_DAYS_AHEAD),
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
      toast.error(ERROR_MESSAGES.SELECT_REQUIRED);
      return;
    }

    setError(null);

    try {
      // Calculate override flag dynamically
      const isOverride =
        selectedCourier.serviceId !== order.selectedCourierServiceId;

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
        err instanceof Error ? err.message : ERROR_MESSAGES.FULFILLMENT_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false);
  };

  // Shared content component
  const FulfillmentContent = () => (
    <div className="space-y-4">
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
            ✓ {order.courierName} - RM{' '}
            {parseFloat(order.shippingCost?.toString() || '0').toFixed(2)}
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
            onValueChange={serviceId => {
              const courier = availableCouriers.find(
                c => c.serviceId === serviceId
              );
              if (courier) {
                setSelectedCourier(courier);
              }
            }}
          >
            <SelectTrigger id="courier-select" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCouriers.map(courier => (
                <SelectItem key={courier.serviceId} value={courier.serviceId}>
                  <span className="flex items-center gap-2">
                    {courier.courierName} (
                    {courier.serviceType || UNAVAILABLE_TEXT}) - RM{' '}
                    {courier.cost.toFixed(2)}
                    {courier.isCustomerChoice && (
                      <span className="text-green-600 font-bold">
                        ✓ Customer Choice
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Cost Difference Indicator */}
        {selectedCourier && !selectedCourier.isCustomerChoice && (
          <p className="text-xs mt-2">
            {selectedCourier.cost <
            parseFloat(order.shippingCost?.toString() || '0') ? (
              <span className="text-green-600 font-medium">
                Save RM{' '}
                {(
                  parseFloat(order.shippingCost?.toString() || '0') -
                  selectedCourier.cost
                ).toFixed(2)}{' '}
                vs customer selection
              </span>
            ) : selectedCourier.cost >
              parseFloat(order.shippingCost?.toString() || '0') ? (
              <span className="text-orange-600 font-medium">
                ⚠️ RM{' '}
                {(
                  selectedCourier.cost -
                  parseFloat(order.shippingCost?.toString() || '0')
                ).toFixed(2)}{' '}
                more expensive
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
      {selectedCourier &&
        selectedCourier.serviceId !== order.selectedCourierServiceId && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              ⚠️ You are overriding the customer&apos;s courier selection.
              <br />
              Original: <strong>{order.courierName}</strong> → New:{' '}
              <strong>{selectedCourier.courierName}</strong>
            </p>
          </div>
        )}

      {/* Estimated Cost Display */}
      {selectedCourier && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Estimated Shipping Cost</p>
              <p className="text-xs text-gray-500 mt-1">
                Based on current EasyParcel rates
              </p>
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

      {/* Payment Warning */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 text-sm">
          This will deduct from your EasyParcel balance and cannot be reverted.
        </AlertDescription>
      </Alert>
    </div>
  );

  // Shared footer component
  const FulfillmentFooter = () => (
    <>
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
        disabled={
          isLoading ||
          !!dateError ||
          !pickupDate ||
          !selectedCourier ||
          loadingCouriers
        }
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Fulfill & Pay
      </Button>
    </>
  );

  // Mobile view - Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className={`${SHEET_HEIGHT_MOBILE} flex flex-col p-0`}
        >
          {/* Sticky Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle>Fulfill Order</SheetTitle>
            <SheetDescription>
              Select courier and pickup date to fulfill order{' '}
              {order.orderNumber}
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FulfillmentContent />
          </div>

          {/* Sticky Footer */}
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 gap-2">
            <FulfillmentFooter />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view - Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={DIALOG_MAX_WIDTH}>
        <DialogHeader>
          <DialogTitle>Fulfill Order</DialogTitle>
          <DialogDescription>
            Select courier and pickup date to fulfill order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FulfillmentContent />
        </div>

        <DialogFooter>
          <FulfillmentFooter />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
