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
import { Loader2, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { getNextBusinessDay, validatePickupDate } from '@/lib/shipping/utils/date-utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { FulfillmentConfirmDialogProps, FulfillmentStep, ShipmentQuoteData } from './types';

export function FulfillmentConfirmDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false,
}: FulfillmentConfirmDialogProps) {
  const { toast } = useToast();

  // State
  const [currentStep, setCurrentStep] = useState<FulfillmentStep>('PICKUP_DATE' as FulfillmentStep);
  const [pickupDate, setPickupDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<ShipmentQuoteData | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Initialize pickup date when dialog opens
  useEffect(() => {
    if (open) {
      const nextBusinessDay = getNextBusinessDay();
      setPickupDate(format(nextBusinessDay, 'yyyy-MM-dd'));
      setDateError(null);
      setError(null);
      setCurrentStep('PICKUP_DATE');
      setQuoteData(null);
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

  // Step 1: Get shipping quote
  const handleGetQuote = async () => {
    if (dateError || !pickupDate) return;

    setIsGettingQuote(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/fulfill/quote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: order.selectedCourierServiceId,
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

  // Step 2: Confirm and pay
  const handleConfirmPayment = async () => {
    if (!quoteData) return;

    setIsPaying(true);
    setError(null);

    try {
      // Call parent's onConfirm with shipmentId
      await onConfirm(pickupDate, quoteData.shipmentId);
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

  // Render Step 1: Pickup Date Selection
  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Get Shipping Quote</DialogTitle>
        <DialogDescription>
          Review order details and select pickup date to get shipping cost
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
          <p className="text-sm font-semibold">
            {order.courierName || 'Selected at checkout'}
          </p>
          {order.courierServiceDetail && (
            <p className="text-sm text-gray-700 capitalize">
              <span className="font-medium">Service Type:</span>{' '}
              {order.courierServiceDetail}
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

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            You'll see the exact shipping cost before confirming payment.
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
          disabled={isGettingQuote || !!dateError || !pickupDate}
        >
          {isGettingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Shipping Quote
        </Button>
      </DialogFooter>
    </>
  );

  // Render Step 2: Price Confirmation
  const renderStep2 = () => (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Shipping Payment</DialogTitle>
        <DialogDescription>
          Review shipping cost and confirm to complete fulfillment
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Success message */}
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            Shipping quote retrieved successfully
          </AlertDescription>
        </Alert>

        {/* Order Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Order Number</Label>
          <p className="font-mono text-sm">{order.orderNumber}</p>
        </div>

        {/* Shipping Cost Display - Prominent */}
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Shipping Cost
              </span>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              RM {quoteData?.price.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            This amount will be deducted from your EasyParcel balance
            immediately.
          </p>
        </div>

        {/* Shipment Details */}
        <div className="space-y-3 bg-gray-50 p-3 rounded border">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Courier</p>
              <p className="font-medium">{quoteData?.courierName}</p>
            </div>
            <div>
              <p className="text-gray-500">Service Type</p>
              <p className="font-medium capitalize">{quoteData?.serviceType}</p>
            </div>
            <div>
              <p className="text-gray-500">Pickup Date</p>
              <p className="font-medium">
                {format(new Date(pickupDate), 'MMM dd, yyyy')}
              </p>
            </div>
            {quoteData?.estimatedDelivery && (
              <div>
                <p className="text-gray-500">Est. Delivery</p>
                <p className="font-medium">{quoteData.estimatedDelivery}</p>
              </div>
            )}
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Confirming will process payment and create the shipment. This action
            cannot be undone.
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
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isPaying}
        >
          Cancel
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {currentStep === 'PICKUP_DATE' && renderStep1()}
        {currentStep === 'PRICE_CONFIRMATION' && renderStep2()}
      </DialogContent>
    </Dialog>
  );
}
