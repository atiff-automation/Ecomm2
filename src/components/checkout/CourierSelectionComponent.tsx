/**
 * Courier Selection Component
 * Real-time shipping rate display with service types
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.1
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck,
  Clock,
  Shield,
  Package,
  AlertTriangle,
  Zap,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    regularPrice: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

interface ShippingRate {
  courierId: string;
  courierName: string;
  serviceName: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  price: number;
  originalPrice: number;
  freeShippingApplied: boolean;
  estimatedDays: number;
  description?: string;
  features: {
    insuranceAvailable: boolean;
    codAvailable: boolean;
    signatureRequiredAvailable: boolean;
  };
  insurancePrice?: number;
  codPrice?: number;
  signaturePrice?: number;
}

interface ShippingCalculationResult {
  rates: ShippingRate[];
  summary: {
    totalWeight: number;
    totalValue: number;
    itemCount: number;
    freeShippingThreshold: number;
    freeShippingEligible: boolean;
    cheapestRate?: number;
    fastestService?: string;
    recommendedCourier?: string;
  };
  businessAddress: {
    name: string;
    city: string;
    state: string;
    zone: 'west' | 'east';
  };
  deliveryAddress: {
    city: string;
    state: string;
    zone: 'west' | 'east';
    serviceableByAllCouriers: boolean;
  };
  validationResults: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

interface CourierSelectionProps {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  orderValue: number;
  onShippingRateSelect: (
    rate: ShippingRate & {
      insurance: boolean;
      cod: boolean;
      signatureRequired: boolean;
      specialInstructions?: string;
    }
  ) => void;
  selectedCourierId?: string;
  className?: string;
}

export default function CourierSelectionComponent({
  cartItems,
  shippingAddress,
  orderValue,
  onShippingRateSelect,
  selectedCourierId,
  className = '',
}: CourierSelectionProps) {
  const [shippingData, setShippingData] =
    useState<ShippingCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Additional service options
  const [insurance, setInsurance] = useState(false);
  const [cod, setCod] = useState(false);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Auto-retry state
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Check if address is complete enough for shipping calculation
  const isAddressComplete = useMemo(() => {
    return !!(
      shippingAddress.firstName &&
      shippingAddress.lastName &&
      shippingAddress.phone &&
      shippingAddress.address &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.postcode &&
      cartItems.length > 0
    );
  }, [shippingAddress, cartItems]);

  // Calculate shipping rates
  const calculateShippingRates = async (retryAttempt = 0) => {
    if (!isAddressComplete) {
      setShippingData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🚚 Calculating shipping rates:', {
        itemCount: cartItems.length,
        orderValue,
        state: shippingAddress.state,
        city: shippingAddress.city,
        retryAttempt,
      });

      // Prepare shipping calculation request
      const calculationItems = cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        weight: Number(item.product.weight) || 0.5, // Ensure number type, default 0.5kg if not specified
        quantity: item.quantity,
        value: Number(item.product.regularPrice), // Ensure number type
        dimensions: item.product.dimensions
          ? {
              length: Number(item.product.dimensions.length) || 10,
              width: Number(item.product.dimensions.width) || 10,
              height: Number(item.product.dimensions.height) || 5,
            }
          : {
              length: 10,
              width: 10,
              height: 5,
            },
      }));

      const deliveryAddress = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address,
        addressLine2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postcode,
        country: shippingAddress.country || 'MY',
      };

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: calculationItems,
          deliveryAddress,
          orderValue,
          options: {
            serviceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
            includeInsurance: true,
            includeCOD: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: ShippingCalculationResult = await response.json();

      console.log('✅ Shipping rates calculated:', {
        rateCount: data.rates.length,
        cheapestRate: data.summary.cheapestRate,
        freeShipping: data.summary.freeShippingEligible,
        warnings: data.validationResults.warnings,
      });

      setShippingData(data);
      setRetryCount(0); // Reset retry count on success

      // Auto-select recommended rate if none selected
      if (!selectedRate && data.rates.length > 0) {
        const recommended =
          data.rates.find(
            rate => rate.courierName === data.summary.recommendedCourier
          ) || data.rates[0];

        setSelectedRate(recommended);
        notifyRateSelection(recommended);
      }
    } catch (error) {
      console.error('❌ Shipping calculation error:', error);

      // Auto-retry on failure (up to maxRetries)
      if (retryAttempt < maxRetries) {
        console.log(
          `🔄 Retrying shipping calculation (${retryAttempt + 1}/${maxRetries})`
        );
        setRetryCount(retryAttempt + 1);
        setTimeout(
          () => {
            calculateShippingRates(retryAttempt + 1);
          },
          2000 * (retryAttempt + 1)
        ); // Exponential backoff
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to calculate shipping rates'
      );
      setShippingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Notify parent component of rate selection
  const notifyRateSelection = (rate: ShippingRate) => {
    const finalPrice = calculateFinalPrice(rate);

    onShippingRateSelect({
      ...rate,
      price: finalPrice,
      insurance,
      cod,
      signatureRequired,
      specialInstructions: specialInstructions.trim() || undefined,
    });
  };

  // Calculate final price with additional services
  const calculateFinalPrice = (rate: ShippingRate): number => {
    let finalPrice = rate.price;

    if (insurance && rate.insurancePrice) {
      finalPrice += rate.insurancePrice;
    }

    if (cod && rate.codPrice) {
      finalPrice += rate.codPrice;
    }

    if (signatureRequired && rate.signaturePrice) {
      finalPrice += rate.signaturePrice;
    }

    return finalPrice;
  };

  // Handle rate selection
  const handleRateSelection = (rate: ShippingRate) => {
    setSelectedRate(rate);
    notifyRateSelection(rate);
  };

  // Handle additional service changes
  const handleServiceChange = (service: string, enabled: boolean) => {
    switch (service) {
      case 'insurance':
        setInsurance(enabled);
        break;
      case 'cod':
        setCod(enabled);
        break;
      case 'signature':
        setSignatureRequired(enabled);
        break;
    }

    // Re-notify with updated pricing
    if (selectedRate) {
      setTimeout(() => notifyRateSelection(selectedRate), 0);
    }
  };

  // Get service type badge color
  const getServiceTypeBadge = (serviceType: string) => {
    switch (serviceType) {
      case 'STANDARD':
        return (
          <Badge variant="secondary" className="text-xs">
            Standard
          </Badge>
        );
      case 'EXPRESS':
        return (
          <Badge variant="default" className="text-xs bg-blue-500">
            Express
          </Badge>
        );
      case 'OVERNIGHT':
        return (
          <Badge variant="default" className="text-xs bg-red-500">
            Overnight
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {serviceType}
          </Badge>
        );
    }
  };

  // Effect to recalculate when address or cart changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateShippingRates();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [shippingAddress, cartItems, orderValue, isAddressComplete]);

  // Show loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Options
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Retry {retryCount}/{maxRetries}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Calculating shipping rates...
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => calculateShippingRates()}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show incomplete address state
  if (!isAddressComplete) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              Please complete your shipping address to view delivery options
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no rates available
  if (!shippingData || shippingData.rates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No shipping options available for your location. Please check your
              address or contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Shipping Options
        </CardTitle>
        {shippingData.summary.freeShippingEligible && (
          <Badge className="w-fit bg-green-500">
            🎉 Free Shipping Applied!
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Zone Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-l-4 border-blue-500 pl-3">
          <MapPin className="w-4 h-4" />
          <span>
            Delivering to {shippingData.deliveryAddress.city},{' '}
            {shippingData.deliveryAddress.state}(
            {shippingData.deliveryAddress.zone === 'west' ? 'West' : 'East'}{' '}
            Malaysia)
          </span>
        </div>

        {/* Validation Warnings */}
        {shippingData.validationResults.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {shippingData.validationResults.warnings.map(
                  (warning, index) => (
                    <li key={index} className="text-sm">
                      {warning}
                    </li>
                  )
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Shipping Rate Selection */}
        <RadioGroup
          value={selectedRate?.courierId || ''}
          onValueChange={value => {
            const rate = shippingData.rates.find(r => r.courierId === value);
            if (rate) {
              handleRateSelection(rate);
            }
          }}
          className="space-y-3"
        >
          {shippingData.rates.map(rate => (
            <div key={rate.courierId} className="space-y-2">
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={rate.courierId} id={rate.courierId} />
                <Label
                  htmlFor={rate.courierId}
                  className="flex-1 cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.courierName}</span>
                      {getServiceTypeBadge(rate.serviceType)}
                      {rate.courierName ===
                        shippingData.summary.recommendedCourier && (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-600 border-green-600"
                        >
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {rate.freeShippingApplied ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `RM ${rate.price.toFixed(2)}`
                        )}
                      </div>
                      {rate.originalPrice !== rate.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          RM {rate.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rate.estimatedDays}{' '}
                      {rate.estimatedDays === 1 ? 'day' : 'days'}
                    </div>
                    <span>{rate.serviceName}</span>
                  </div>
                  {rate.description && (
                    <div className="text-xs text-muted-foreground">
                      {rate.description}
                    </div>
                  )}
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Additional Services */}
        {selectedRate && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Additional Services
            </h4>

            <div className="space-y-3">
              {/* Insurance */}
              {selectedRate.features.insuranceAvailable && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance"
                      checked={insurance}
                      onCheckedChange={checked =>
                        handleServiceChange('insurance', !!checked)
                      }
                    />
                    <Label
                      htmlFor="insurance"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Package Insurance</span>
                    </Label>
                  </div>
                  <span className="text-sm font-medium">
                    +RM {selectedRate.insurancePrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}

              {/* Cash on Delivery */}
              {selectedRate.features.codAvailable && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cod"
                      checked={cod}
                      onCheckedChange={checked =>
                        handleServiceChange('cod', !!checked)
                      }
                    />
                    <Label
                      htmlFor="cod"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Cash on Delivery</span>
                    </Label>
                  </div>
                  <span className="text-sm font-medium">
                    +RM {selectedRate.codPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}

              {/* Signature Required */}
              {selectedRate.features.signatureRequiredAvailable && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signature"
                      checked={signatureRequired}
                      onCheckedChange={checked =>
                        handleServiceChange('signature', !!checked)
                      }
                    />
                    <Label
                      htmlFor="signature"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Signature Required</span>
                    </Label>
                  </div>
                  <span className="text-sm font-medium">
                    +RM {selectedRate.signaturePrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label htmlFor="deliveryInstructions">
                Delivery Instructions (Optional)
              </Label>
              <Textarea
                id="deliveryInstructions"
                placeholder="e.g., Leave at front door, Ring doorbell, etc."
                value={specialInstructions}
                onChange={e => {
                  setSpecialInstructions(e.target.value);
                  if (selectedRate) {
                    setTimeout(() => notifyRateSelection(selectedRate), 0);
                  }
                }}
                className="min-h-[60px]"
              />
            </div>

            {/* Final Price Summary */}
            {(insurance || cod || signatureRequired) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Shipping Cost:</span>
                  <span>RM {calculateFinalPrice(selectedRate).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="flex justify-between">
            <span>
              Total Weight: {shippingData.summary.totalWeight.toFixed(1)}kg
            </span>
            <span>Items: {shippingData.summary.itemCount}</span>
          </div>
          {!shippingData.summary.freeShippingEligible && (
            <div className="mt-1">
              <span>
                Free shipping on orders over RM{' '}
                {shippingData.summary.freeShippingThreshold}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
