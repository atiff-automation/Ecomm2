/**
 * Admin-Controlled Shipping Component
 * Displays the automatically selected shipping option without customer choice
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 4 - Service Selection
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle,
  MapPin,
  RefreshCw,
  Info,
  Star,
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
      length?: number;
      width?: number;
      height?: number;
    };
  };
}

interface ShippingOption {
  courierName: string;
  serviceName: string;
  price: number;
  estimatedDelivery: string;
  deliveryNote: string;
  insuranceAvailable?: boolean;
  codAvailable?: boolean;
}

interface AdminControlledShippingProps {
  shippingAddress: ShippingAddress;
  cartItems: CartItem[];
  onShippingChange: (option: ShippingOption & { 
    insurance?: boolean; 
    cod?: boolean; 
    codAmount?: number;
    specialInstructions?: string;
  }) => void;
  initialOption?: ShippingOption;
}

export default function AdminControlledShippingComponent({
  shippingAddress,
  cartItems,
  onShippingChange,
  initialOption
}: AdminControlledShippingProps) {
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(initialOption || null);
  const [loading, setLoading] = useState(!initialOption);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Service add-ons
  const [insurance, setInsurance] = useState(false);
  const [cod, setCod] = useState(false);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate cart totals
  const cartWeight = cartItems.reduce((total, item) => {
    return total + (item.product.weight || 0.5) * item.quantity;
  }, 0);

  const cartValue = cartItems.reduce((total, item) => {
    return total + item.product.regularPrice * item.quantity;
  }, 0);

  // Fetch shipping rate automatically
  useEffect(() => {
    if (!initialOption) {
      fetchShippingRate();
    }
  }, [shippingAddress, cartItems]);

  const fetchShippingRate = async () => {
    if (!shippingAddress.postcode || !shippingAddress.state) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: {
            postcode: shippingAddress.postcode,
            state: shippingAddress.state,
            city: shippingAddress.city,
          },
          parcel: {
            weight: Math.max(0.1, cartWeight),
            length: 20,
            width: 15,
            height: 10,
            declared_value: cartValue,
          },
          adminControlled: true, // Flag for admin-controlled selection
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.selectedOption) {
        setShippingOption(data.selectedOption);
        setError(null);
        setRetryCount(0);
      } else {
        throw new Error(data.message || 'No shipping options available');
      }
    } catch (error) {
      console.error('Shipping rate fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load shipping rates');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Update parent component when shipping changes
  useEffect(() => {
    if (shippingOption) {
      onShippingChange({
        ...shippingOption,
        insurance,
        cod,
        codAmount: cod ? codAmount : undefined,
        specialInstructions: specialInstructions.trim() || undefined,
      });
    }
  }, [shippingOption, insurance, cod, codAmount, specialInstructions]);

  const formatPrice = (price: number) => {
    return `RM ${price.toFixed(2)}`;
  };

  const calculateInsurancePrice = (value: number) => {
    // Insurance is typically 1-2% of declared value, minimum RM2
    return Math.max(2, Math.round(value * 0.015 * 100) / 100);
  };

  const getTotalShippingPrice = () => {
    if (!shippingOption) return 0;
    
    let total = shippingOption.price;
    if (insurance) {
      total += calculateInsurancePrice(cartValue);
    }
    return total;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Loading Shipping Options...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Shipping Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {retryCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={fetchShippingRate}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!shippingOption) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please complete your shipping address to view shipping options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Shipping Option */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">
                    {shippingOption.courierName}
                  </h3>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {shippingOption.serviceName}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {shippingOption.estimatedDelivery}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    To {shippingAddress.city}, {shippingAddress.state}
                  </div>
                </div>
                
                <p className="text-sm text-green-700 font-medium">
                  {shippingOption.deliveryNote}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(getTotalShippingPrice())}
                </div>
                {insurance && (
                  <div className="text-xs text-gray-500">
                    Base: {formatPrice(shippingOption.price)}
                    <br />
                    Insurance: {formatPrice(calculateInsurancePrice(cartValue))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This shipping option has been automatically selected based on your location, 
              parcel size, and our shipping policies for the best value and reliability.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Service Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Additional Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Insurance Option */}
          {shippingOption.insuranceAvailable && (
            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <Checkbox
                id="insurance"
                checked={insurance}
                onCheckedChange={(checked) => setInsurance(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="insurance" className="font-medium">
                  Parcel Insurance
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Protect your parcel up to RM{cartValue.toFixed(2)} 
                  ({formatPrice(calculateInsurancePrice(cartValue))})
                </p>
              </div>
            </div>
          )}

          {/* COD Option */}
          {shippingOption.codAvailable && (
            <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              <Checkbox
                id="cod"
                checked={cod}
                onCheckedChange={(checked) => {
                  setCod(!!checked);
                  if (checked) {
                    setCodAmount(cartValue);
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="cod" className="font-medium">
                  Cash on Delivery (COD)
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Pay upon delivery (Order total: {formatPrice(cartValue)})
                </p>
                {cod && (
                  <Alert className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      COD amount will be {formatPrice(cartValue)} (order total). 
                      Payment must be made in cash to the courier upon delivery.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="font-medium">
              Special Delivery Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Please call before delivery, Leave at reception, etc."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {specialInstructions.length}/200 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipping Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Courier:</span>
              <span className="font-medium">{shippingOption.courierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-medium">{shippingOption.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Delivery:</span>
              <span className="font-medium">{shippingOption.estimatedDelivery}</span>
            </div>
            <div className="flex justify-between">
              <span>Parcel Weight:</span>
              <span className="font-medium">{cartWeight.toFixed(1)} kg</span>
            </div>
            {insurance && (
              <div className="flex justify-between text-blue-600">
                <span>Insurance Coverage:</span>
                <span className="font-medium">RM{cartValue.toFixed(2)}</span>
              </div>
            )}
            {cod && (
              <div className="flex justify-between text-orange-600">
                <span>COD Amount:</span>
                <span className="font-medium">{formatPrice(codAmount)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total Shipping:</span>
              <span className="text-green-600">{formatPrice(getTotalShippingPrice())}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}