/**
 * Payment Method Selection Component
 * Dynamically fetches and displays available payment methods
 * Integrates with the multi-gateway payment router system
 */

'use client';

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  features: string[];
  processingTime: string;
  available: boolean;
}

interface PaymentMethodsResponse {
  success: boolean;
  methods: PaymentMethod[];
  activeMethods: PaymentMethod[];
  defaultMethod: string | null;
  availability: {
    billplz: {
      available: boolean;
      configured: boolean;
      error?: string;
    };
    toyyibpay: {
      available: boolean;
      configured: boolean;
      error?: string;
    };
  };
  hasAvailableGateways: boolean;
}

interface PaymentMethodSelectionProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  onMethodsLoaded?: (hasAvailableGateways: boolean) => void;
}

export default function PaymentMethodSelection({
  selectedMethod,
  onMethodChange,
  onMethodsLoaded
}: PaymentMethodSelectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeMethods, setActiveMethods] = useState<PaymentMethod[]>([]);
  const [hasAvailableGateways, setHasAvailableGateways] = useState(false);
  const [availability, setAvailability] = useState<PaymentMethodsResponse['availability'] | null>(null);

  // Fetch available payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/payment/methods');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: PaymentMethodsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch payment methods');
        }

        console.log('💳 Payment methods loaded:', {
          total: data.methods.length,
          active: data.activeMethods.length,
          hasGateways: data.hasAvailableGateways,
          default: data.defaultMethod
        });

        setPaymentMethods(data.methods);
        setActiveMethods(data.activeMethods);
        setHasAvailableGateways(data.hasAvailableGateways);
        setAvailability(data.availability);

        // Auto-select default method if available and no method selected
        if (!selectedMethod && data.defaultMethod) {
          onMethodChange(data.defaultMethod);
        }

        // Notify parent about gateway availability
        if (onMethodsLoaded) {
          onMethodsLoaded(data.hasAvailableGateways);
        }

      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError(err instanceof Error ? err.message : 'Failed to load payment methods');
        setHasAvailableGateways(false);
        
        if (onMethodsLoaded) {
          onMethodsLoaded(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [selectedMethod, onMethodChange, onMethodsLoaded]);

  const getMethodIcon = (methodId: string) => {
    switch (methodId.toUpperCase()) {
      case 'TOYYIBPAY':
        return '🇲🇾';
      case 'BILLPLZ':
        return '🏦';
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-orange-600';
  };

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <Clock className="w-4 h-4 text-orange-600" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading payment methods...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Payment System Error:</strong> {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Method
        </CardTitle>
        {!hasAvailableGateways && (
          <Alert className="mt-2 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>No payment gateways available.</strong> Please contact support or try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        {hasAvailableGateways ? (
          <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 transition-colors ${
                  method.available
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.available}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={method.id}
                        className={`flex items-center gap-2 text-base ${
                          !method.available ? 'text-muted-foreground' : ''
                        }`}
                      >
                        <span className="text-lg">{getMethodIcon(method.id)}</span>
                        {method.name}
                        {getStatusIcon(method.available)}
                      </Label>
                      <Badge
                        variant={method.available ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {method.available ? 'Available' : 'Coming Soon'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>

                    {method.available && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {method.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs py-1"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Processing: {method.processingTime}</span>
                        </div>
                      </div>
                    )}

                    {!method.available && availability && (
                      <div className="text-xs text-muted-foreground">
                        {method.id === 'TOYYIBPAY' && availability.toyyibpay.error && (
                          <span>Status: {availability.toyyibpay.error}</span>
                        )}
                        {method.id === 'BILLPLZ' && availability.billplz.error && (
                          <span>Status: {availability.billplz.error}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              No payment methods available at the moment.
            </p>
            <p className="text-xs mt-2">
              Payment gateways are currently being configured. Please try again later.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}