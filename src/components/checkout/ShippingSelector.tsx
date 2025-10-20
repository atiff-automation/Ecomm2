/**
 * Shipping Selector Component
 *
 * Customer-facing component for selecting shipping options at checkout.
 * Automatically calculates rates when address is complete.
 *
 * CRITICAL: This component MUST call onShippingSelected callback
 * to pass selected shipping data up to checkout page state.
 *
 * @component ShippingSelector
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, Package, AlertCircle, RefreshCw } from 'lucide-react';
import type { ShippingOption, DeliveryAddress } from '@/lib/shipping/types';

interface ShippingSelectorProps {
  deliveryAddress: DeliveryAddress;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  orderValue: number; // Cart total (after discounts, before tax/shipping) for free shipping calculation
  onShippingSelected: (option: ShippingOption | null, weight?: number) => void;
}

interface ShippingState {
  loading: boolean;
  error: string | null;
  options: ShippingOption[];
  selected: ShippingOption | null;
  strategy: 'cheapest' | 'all' | 'selected';
  totalWeight: number; // Calculated weight from API
}

export default function ShippingSelector({
  deliveryAddress,
  items,
  orderValue,
  onShippingSelected,
}: ShippingSelectorProps) {
  const [state, setState] = useState<ShippingState>({
    loading: false,
    error: null,
    options: [],
    selected: null,
    strategy: 'cheapest',
    totalWeight: 0,
  });

  // Debounced address validation
  const isAddressComplete = useCallback((address: DeliveryAddress): boolean => {
    return !!(
      address.name &&
      address.phone &&
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.postalCode &&
      address.country
    );
  }, []);

  // Calculate shipping rates
  const calculateShipping = useCallback(async () => {
    if (!isAddressComplete(deliveryAddress)) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
          items,
          orderValue,
        }),
      });

      const data = await response.json();

      if (data.success && data.shipping) {
        const { options, strategy, totalWeight } = data.shipping;

        // Auto-select if only one option OR cheapest strategy
        const autoSelect = options.length === 1 || strategy === 'cheapest';
        const selectedOption = autoSelect ? options[0] : null;

        setState({
          loading: false,
          error: null,
          options,
          selected: selectedOption,
          strategy,
          totalWeight: totalWeight || 0,
        });

        // CRITICAL: Notify parent component of selection AND weight
        onShippingSelected(selectedOption, totalWeight);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Failed to calculate shipping',
        }));
        onShippingSelected(null);
      }
    } catch (error) {
      console.error('[ShippingSelector] Calculation error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to calculate shipping. Please try again.',
      }));
      onShippingSelected(null);
    }
  }, [
    deliveryAddress,
    items,
    orderValue,
    isAddressComplete,
    onShippingSelected,
  ]);

  // Auto-calculate when address changes (with debounce)
  // FIXED: Removed calculateShipping from dependencies to prevent recalculation when parent re-renders
  useEffect(() => {
    if (!isAddressComplete(deliveryAddress)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      calculateShipping();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    deliveryAddress.name,
    deliveryAddress.phone,
    deliveryAddress.addressLine1,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.postalCode,
    deliveryAddress.country,
    items,
    orderValue,
  ]); // Only recalculate when actual delivery data changes

  // Handle manual courier selection
  const handleCourierSelect = (serviceId: string) => {
    const selectedOption = state.options.find(
      opt => opt.serviceId === serviceId
    );
    if (selectedOption) {
      setState(prev => ({ ...prev, selected: selectedOption }));
      // CRITICAL: Notify parent of selection change AND weight
      onShippingSelected(selectedOption, state.totalWeight);
    }
  };

  // Retry calculation
  const handleRetry = () => {
    calculateShipping();
  };

  // Loading state
  if (state.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">
              Calculating shipping cost...
            </span>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Please wait while we check available couriers for your address.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Shipping Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-700 font-medium">Please try:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>A different delivery address</li>
              <li>Contacting us for assistance</li>
            </ul>
            <div className="mt-4">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Calculation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No options available
  if (state.options.length === 0) {
    return null; // Don't show anything if address not complete yet
  }

  // Render shipping options based on strategy
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Shipping Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Cheapest and Priority strategies: Single option (auto-selected) */}
        {(state.strategy === 'cheapest' || state.strategy === 'priority') &&
          state.selected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {state.selected.freeShipping ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-green-600">
                          🎉 FREE SHIPPING
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        Via: {state.selected.courierName} (
                        {state.selected.serviceType})
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Delivery: {state.selected.estimatedDays}
                      </p>
                      {state.selected.savedAmount && (
                        <p className="text-sm font-semibold text-green-600">
                          ✓ You saved RM {state.selected.savedAmount.toFixed(2)}{' '}
                          on shipping!
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-lg mb-1">
                        Standard Shipping
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        Via: {state.selected.courierName} (
                        {state.selected.serviceType})
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Delivery: {state.selected.estimatedDays}
                      </p>
                      <p className="text-sm text-gray-500">
                        {state.strategy === 'cheapest'
                          ? '(Cheapest option automatically selected)'
                          : '(Priority courier automatically selected)'}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    RM {state.selected.cost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Show all / selected strategies: Multiple options with radio buttons */}
        {(state.strategy === 'all' || state.strategy === 'selected') && (
          <RadioGroup
            value={state.selected?.serviceId}
            onValueChange={handleCourierSelect}
          >
            <div className="space-y-3">
              {state.options.map(option => (
                <div
                  key={option.serviceId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    state.selected?.serviceId === option.serviceId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleCourierSelect(option.serviceId)}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={option.serviceId}
                      id={option.serviceId}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.serviceId}
                        className="font-semibold text-base cursor-pointer"
                      >
                        {option.courierName}
                        {option.freeShipping && (
                          <span className="ml-2 text-green-600 font-bold">
                            FREE
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Delivery: {option.estimatedDays}
                      </p>
                      {option.freeShipping && option.savedAmount && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Save RM {option.savedAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        RM {option.cost.toFixed(2)}
                      </p>
                      {option.freeShipping && option.originalCost > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          RM {option.originalCost.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
