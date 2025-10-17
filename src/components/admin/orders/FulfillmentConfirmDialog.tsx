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
import { Loader2, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { getNextBusinessDay, validatePickupDate } from '@/lib/shipping/utils/date-utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type {
  FulfillmentConfirmDialogProps,
  FulfillmentStep,
  ShipmentQuoteData,
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
  const [currentStep, setCurrentStep] = useState<FulfillmentStep>('COURIER_PICKUP' as FulfillmentStep);
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<ShipmentQuoteData | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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
      setCurrentStep('COURIER_PICKUP');
      setQuoteData(null);
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

  // Step 1: Get shipping quote with selected courier
  const handleGetQuote = async () => {
    if (dateError || !pickupDate || !selectedCourier) return;

    setIsGettingQuote(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/fulfill/quote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: selectedCourier.serviceId, // Use selected courier!
            pickupDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to get shipping quote');
      }

      // Store quote data and move to Step 2
      setQuoteData(data.quote);
      setCurrentStep('PRICE_CONFIRMATION');
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get shipping quote';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGettingQuote(false);
    }
  };

  // Step 2: Confirm and pay with override flag
  const handleConfirmPayment = async () => {
    if (!quoteData || !selectedCourier) return;

    setIsPaying(true);
    setError(null);

    try {
      // Calculate override flag dynamically
      const isOverride = selectedCourier.serviceId !== order.selectedCourierServiceId;

      // Call parent's onConfirm with shipmentId and override options
      await onConfirm(pickupDate, quoteData.shipmentId, {
        overriddenByAdmin: isOverride,
        selectedServiceId: selectedCourier.serviceId,
      });
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
    } finally {
      setIsPaying(false);
    }
  };

  // Handle dialog close with confirmation if on Step 2
  const handleClose = () => {
    if (currentStep === 'PRICE_CONFIRMATION' && !isPaying) {
      const confirmed = window.confirm(
        '⚠️ Shipping order has been created but not paid.\n\nAre you sure you want to cancel? This will leave an unpaid order in EasyParcel.'
      );
      if (!confirmed) return;
    }
    onOpenChange(false);
  };

  // Render Step 1: Courier & Pickup Selection
  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Select Courier & Pickup Date</DialogTitle>
        <DialogDescription>
          Choose the courier and schedule the pickup date for this shipment
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
            disabled={isGettingQuote}
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

        {/* Info Message */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            ℹ️ Prices shown are current EasyParcel rates. Final price will be confirmed in the next step.
          </p>
        </div>

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
          disabled={isGettingQuote}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleGetQuote}
          disabled={isGettingQuote || !!dateError || !pickupDate || !selectedCourier}
        >
          {isGettingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Next: Get Quote
        </Button>
      </DialogFooter>
    </>
  );

  // Render Step 2: Price Confirmation with Override Indicators
  const renderStep2 = () => {
    const isOverride = selectedCourier?.serviceId !== order.selectedCourierServiceId;
    const savedAmount = parseFloat(order.shippingCost?.toString() || '0') - (quoteData?.price || 0);

    return (
      <>
        <DialogHeader>
          <DialogTitle>Confirm Shipment Details</DialogTitle>
          <DialogDescription>
            Review the shipping quote and confirm payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success message */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              ✅ Shipping quote retrieved successfully
            </AlertDescription>
          </Alert>

          {/* Shipping Cost Display with Savings Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shipping Cost:</span>
              <span className="text-2xl font-bold text-gray-900">
                RM {quoteData?.price?.toFixed(2)}
              </span>
            </div>

            {/* Savings Indicator */}
            {savedAmount > 0 && (
              <p className="text-sm text-green-600 font-medium mt-2">
                💰 You saved RM {savedAmount.toFixed(2)} vs customer selection
              </p>
            )}
            {savedAmount < 0 && (
              <p className="text-sm text-orange-600 font-medium mt-2">
                ⚠️ Business absorbing RM {Math.abs(savedAmount).toFixed(2)} extra cost
              </p>
            )}
          </div>

          {/* Shipment Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Courier:</span>
              <span className="font-medium">
                {quoteData?.courierName}
                {isOverride && (
                  <span className="ml-2 text-orange-600 text-xs">
                    ⚠️ Admin Override
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Type:</span>
              <span className="font-medium capitalize">{quoteData?.serviceType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pickup Date:</span>
              <span className="font-medium">
                {format(new Date(pickupDate), 'MMM dd, yyyy')}
              </span>
            </div>
            {quoteData?.estimatedDelivery && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Delivery:</span>
                <span className="font-medium">{quoteData.estimatedDelivery}</span>
              </div>
            )}
          </div>

          {/* Override Warning */}
          {isOverride && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                ⚠️ You are overriding the customer's courier selection.
                <br />
                Original: <strong>{order.courierName}</strong>
              </p>
            </div>
          )}

          {/* Payment Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Confirming will process payment with EasyParcel and cannot be undone.
            </p>
          </div>

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
            onClick={() => setCurrentStep('COURIER_PICKUP')}
            disabled={isPaying}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isPaying}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Pay RM {quoteData?.price.toFixed(2)}
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {currentStep === 'COURIER_PICKUP' && renderStep1()}
        {currentStep === 'PRICE_CONFIRMATION' && renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
