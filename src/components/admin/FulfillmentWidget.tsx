/**
 * Fulfillment Widget Component
 *
 * Admin sidebar widget for order fulfillment with EasyParcel integration.
 * Displays different states: pre-fulfillment, processing, success, failed.
 * Allows admin to override customer's selected courier and schedule pickup.
 *
 * @component FulfillmentWidget
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Truck,
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { getNextBusinessDay } from '@/lib/shipping/utils/date-utils';
import type {
  CourierOption,
  FulfillmentWidgetState,
} from '@/lib/shipping/types';

interface FulfillmentWidgetProps {
  orderId: string;
  orderStatus: string;
  customerSelectedCourier?: {
    serviceId: string;
    courierName: string;
    cost: number;
  };
  shippingAddress: {
    city: string;
    state: string;
    postalCode: string;
  };
  shippingWeight?: number;
  trackingNumber?: string;
  awbNumber?: string;
  courierName?: string;
  onFulfillmentComplete?: () => void;
}

export default function FulfillmentWidget({
  orderId,
  orderStatus,
  customerSelectedCourier,
  shippingAddress,
  shippingWeight,
  trackingNumber,
  awbNumber,
  courierName,
  onFulfillmentComplete,
}: FulfillmentWidgetProps) {
  const [state, setState] = useState<FulfillmentWidgetState>({
    status: 'idle',
    selectedCourier: null,
    pickupDate: getNextBusinessDay(),
    trackingNumber: trackingNumber || undefined,
    awbNumber: awbNumber || undefined,
    labelUrl: undefined,
    error: undefined,
  });

  const [availableCouriers, setAvailableCouriers] = useState<CourierOption[]>(
    []
  );
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize widget state based on order status
  useEffect(() => {
    if (trackingNumber && awbNumber) {
      // Order already fulfilled
      setState(prev => ({
        ...prev,
        status: 'success',
        trackingNumber,
        awbNumber,
      }));
    } else if (orderStatus === 'PAID') {
      // Ready for fulfillment
      setState(prev => ({ ...prev, status: 'idle' }));
      loadAvailableCouriers();
    }
  }, [orderStatus, trackingNumber, awbNumber]);

  // Load available couriers for this destination
  const loadAvailableCouriers = async () => {
    setLoadingCouriers(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/shipping-options`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableCouriers(data.alternatives || []);

        // Pre-select customer's choice if available
        if (customerSelectedCourier) {
          const customerChoice = data.alternatives.find(
            (c: CourierOption) =>
              c.serviceId === customerSelectedCourier.serviceId
          );
          if (customerChoice) {
            setState(prev => ({
              ...prev,
              selectedCourier: customerChoice,
            }));
          }
        }
      }
    } catch (error) {
      console.error('[FulfillmentWidget] Failed to load couriers:', error);
    } finally {
      setLoadingCouriers(false);
    }
  };

  // Handle courier selection change
  const handleCourierChange = (serviceId: string) => {
    const courier = availableCouriers.find(c => c.serviceId === serviceId);
    if (courier) {
      setState(prev => ({ ...prev, selectedCourier: courier }));
    }
  };

  // Handle pickup date change
  const handlePickupDateChange = (date: string) => {
    setState(prev => ({ ...prev, pickupDate: new Date(date) }));
  };

  // Handle shipment booking
  const handleBookShipment = async () => {
    if (!state.selectedCourier) {
      return;
    }

    setState(prev => ({ ...prev, status: 'loading', error: undefined }));
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: state.selectedCourier.serviceId,
          pickupDate: format(state.pickupDate, 'yyyy-MM-dd'),
          overriddenByAdmin:
            state.selectedCourier.serviceId !==
            customerSelectedCourier?.serviceId,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          status: 'success',
          trackingNumber: result.tracking.trackingNumber,
          awbNumber: result.tracking.awbNumber,
          labelUrl: result.tracking.labelUrl,
          scheduledPickupDate:
            result.pickup?.scheduledDate ||
            format(state.pickupDate, 'yyyy-MM-dd'),
          error: undefined,
        }));

        // Auto-download AWB label
        if (result.tracking.labelUrl) {
          window.open(result.tracking.labelUrl, '_blank');
        }

        // Notify parent component
        if (onFulfillmentComplete) {
          onFulfillmentComplete();
        }
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: {
            code: result.error.code || 'UNKNOWN_ERROR',
            message: result.error.message || 'Failed to book shipment',
            suggestedActions: result.error.suggestedActions || [],
            retryable: result.error.retryable !== false,
          },
        }));
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('[FulfillmentWidget] Booking error:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to shipping service. Please try again.',
          suggestedActions: [
            { type: 'RETRY', label: 'Retry Booking' },
            { type: 'CONTACT_SUPPORT', label: 'Contact Support' },
          ],
          retryable: true,
        },
      }));
    }
  };

  // Handle retry
  const handleRetry = () => {
    setState(prev => ({ ...prev, status: 'idle', error: undefined }));
  };

  // Copy tracking number to clipboard
  const handleCopyTracking = () => {
    if (state.trackingNumber) {
      navigator.clipboard.writeText(state.trackingNumber);
      // You could add a toast notification here
    }
  };

  // Render Pre-Fulfillment State (Order Status: PAID)
  if (state.status === 'idle' && orderStatus === 'PAID') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer's Selection */}
          {customerSelectedCourier && (
            <>
              <div>
                <Label className="text-sm font-medium">
                  Customer Selected:
                </Label>
                <p className="text-base font-semibold mt-1">
                  {customerSelectedCourier.courierName} - RM{' '}
                  {customerSelectedCourier.cost.toFixed(2)}
                </p>
              </div>
              <div className="border-t pt-4" />
            </>
          )}

          {/* Courier Override Dropdown */}
          <div>
            <Label htmlFor="courier-select">Change Courier (Optional):</Label>
            {loadingCouriers ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Loading couriers...
                </span>
              </div>
            ) : (
              <>
                <Select
                  value={state.selectedCourier?.serviceId || ''}
                  onValueChange={handleCourierChange}
                >
                  <SelectTrigger id="courier-select" className="mt-1">
                    <SelectValue placeholder="Select courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCouriers.map(courier => (
                      <SelectItem
                        key={courier.serviceId}
                        value={courier.serviceId}
                      >
                        {courier.courierName} - RM {courier.cost.toFixed(2)}
                        {courier.isCustomerSelected && ' (Customer Choice)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableCouriers.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Admin override: You can select a different courier if the
                    customer's choice is no longer available or if you prefer
                    another option.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4" />

          {/* Pickup Date Selector */}
          <div>
            <Label htmlFor="pickup-date">Pickup Date: *</Label>
            <input
              id="pickup-date"
              type="date"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              value={format(state.pickupDate, 'yyyy-MM-dd')}
              onChange={e => handlePickupDateChange(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <p className="text-xs text-gray-600 mt-1">
              Default: Next business day. Can schedule up to 7 days ahead.
            </p>
          </div>

          <div className="border-t pt-4" />

          {/* Shipment Summary */}
          <div>
            <Label className="text-sm font-medium">Shipment Summary:</Label>
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              <li>
                • Destination: {shippingAddress.state},{' '}
                {shippingAddress.postalCode}
              </li>
              {shippingWeight && (
                <li>• Weight: {shippingWeight.toFixed(2)} kg</li>
              )}
              {state.selectedCourier && (
                <li>
                  • Estimated Delivery: {state.selectedCourier.estimatedDays}
                </li>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleBookShipment}
            disabled={!state.selectedCourier}
            className="w-full"
            size="lg"
          >
            <Package className="w-4 h-4 mr-2" />
            Book Shipment with EasyParcel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render Processing State
  if (state.status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="font-semibold text-lg mb-2">Booking Shipment...</p>
            <Progress value={progress} className="h-2 mb-3" />
            <p className="text-sm text-gray-600">
              Creating shipment with EasyParcel...
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Validating details...</span>
            </div>
            <div className="flex items-center gap-2">
              {progress >= 50 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>Creating shipment...</span>
            </div>
            <div className="flex items-center gap-2">
              {progress >= 75 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4" />
              )}
              <span className={progress < 75 ? 'text-gray-400' : ''}>
                Generating AWB...
              </span>
            </div>
            <div className="flex items-center gap-2">
              {progress >= 90 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4" />
              )}
              <span className={progress < 90 ? 'text-gray-400' : ''}>
                Downloading label...
              </span>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Please wait, do not close this page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render Success State
  if (state.status === 'success' && state.trackingNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping & Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-lg text-green-800">
              Shipment Booked Successfully
            </p>
          </div>

          <div className="border-t pt-4" />

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-600">Courier:</Label>
              <p className="font-semibold">
                {courierName || state.selectedCourier?.courierName}
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Tracking Number:</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm flex-1">
                  {state.trackingNumber}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTracking}
                  className="flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {state.awbNumber && (
              <div>
                <Label className="text-sm text-gray-600">AWB Number:</Label>
                <p className="font-mono text-sm">{state.awbNumber}</p>
              </div>
            )}

            {state.scheduledPickupDate && (
              <div>
                <Label className="text-sm text-gray-600">
                  Scheduled Pickup:
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">
                    {format(new Date(state.scheduledPickupDate), 'PPP')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4" />

          <div>
            <Label className="text-sm font-medium">Quick Actions:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {state.labelUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={state.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download AWB
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/admin/orders/${orderId}/tracking`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Tracking
                </a>
              </Button>
            </div>
          </div>

          <div className="border-t pt-4" />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Customer Notified:</p>
                <ul className="mt-1 space-y-0.5">
                  <li>✓ Order confirmation sent</li>
                  <li>✓ Tracking information sent</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render Error State
  if (state.status === 'error' && state.error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Booking Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error.message}</AlertDescription>
          </Alert>

          {state.error.code === 'INSUFFICIENT_BALANCE' &&
            state.error.details && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  Balance Information:
                </p>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>
                    Current Balance: RM{' '}
                    {(state.error.details as any).currentBalance?.toFixed(2)}
                  </p>
                  <p>
                    Required: RM{' '}
                    {(state.error.details as any).required?.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

          <div className="border-t pt-4" />

          <div>
            <Label className="text-sm font-medium mb-2 block">
              What to do:
            </Label>
            <div className="space-y-2">
              {state.error.suggestedActions?.map((action, index) => (
                <Button
                  key={index}
                  variant={action.type === 'RETRY' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (action.type === 'RETRY') {
                      handleRetry();
                    } else if (action.url) {
                      window.open(action.url, '_blank');
                    }
                  }}
                >
                  {action.type === 'RETRY' && (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {action.type === 'TOPUP' && (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4" />

          <div className="text-xs text-gray-600 space-y-1">
            <p>Error Code: {state.error.code}</p>
            <p>Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render Already Fulfilled State
  if (orderStatus !== 'PAID' && trackingNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-800 font-medium">
                This order has already been fulfilled.
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Tracking Number:</Label>
              <p className="font-mono text-sm">{trackingNumber}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Tracking Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fallback
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Shipping & Fulfillment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Fulfillment not available for this order status.
        </p>
      </CardContent>
    </Card>
  );
}
