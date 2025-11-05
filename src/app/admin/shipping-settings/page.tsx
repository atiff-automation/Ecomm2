/**
 * Shipping Settings Admin Page
 *
 * Admin interface for configuring EasyParcel shipping integration.
 * Follows WooCommerce plugin simplicity principles.
 *
 * NOTE: Pickup address is sourced from BusinessProfile.shippingAddress (single source of truth).
 * Address fields are read-only here - edit in Business Profile settings.
 *
 * @page /admin/shipping-settings
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  useShippingInit,
  useShippingBalance,
  useAvailableCouriers,
} from '@/lib/hooks/use-shipping-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Settings,
  MapPin,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  COURIER_SELECTION_STRATEGIES,
  MALAYSIAN_STATES,
} from '@/lib/shipping/constants';
import {
  ShippingSettingsValidationSchema,
  type ShippingSettingsFormData,
} from '@/lib/shipping/validation';
import Link from 'next/link';

// Use centralized validation schema
const shippingSettingsSchema = ShippingSettingsValidationSchema;

type FormData = ShippingSettingsFormData;

interface PickupAddress {
  businessName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PickupAddressValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type ConnectionStatus = 'connected' | 'disconnected' | 'not-configured';

interface Courier {
  courierId: string;
  name: string;
  serviceDetail: string; // 'pickup', 'dropoff', or 'dropoff or pickup'
  hasDropoff: boolean;
}

export default function ShippingSettingsPage() {
  const { data: session } = useSession();

  // Phase 3 & 4: React Query integration with combined init endpoint
  const {
    data: initData,
    error: initError,
    isLoading: isLoadingInit,
    refetch: refetchInit,
  } = useShippingInit();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceTimestamp, setBalanceTimestamp] = useState<string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('not-configured');
  const [pickupAddress, setPickupAddress] = useState<PickupAddress | null>(
    null
  );
  const [pickupValidation, setPickupValidation] =
    useState<PickupAddressValidation>({
      isValid: false,
      errors: [],
      warnings: [],
    });
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);
  const [isLoadingCouriers, setIsLoadingCouriers] = useState(false);
  // Phase 1: Track previous API config for conditional balance refetch
  const [previousApiConfig, setPreviousApiConfig] = useState<{
    apiKey: string;
    environment: 'sandbox' | 'production';
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      environment: 'sandbox',
      courierSelectionMode: COURIER_SELECTION_STRATEGIES.CHEAPEST,
      freeShippingEnabled: true,
      freeShippingThreshold: 150,
      freeShippingEligibleStates: [], // NEW: Empty by default (no states selected)
      autoUpdateOrderStatus: true,
      whatsappNotificationsEnabled: false,
    },
  });

  const watchedValues = watch();

  // Watch free shipping state for conditional UI rendering
  const freeShippingEnabled = watch('freeShippingEnabled');
  const freeShippingEligibleStates = watch('freeShippingEligibleStates') || [];

  // Helper: Select all states for free shipping
  const handleSelectAllStates = useCallback(() => {
    const allStateCodes = Object.keys(MALAYSIAN_STATES);
    setValue('freeShippingEligibleStates', allStateCodes, { shouldDirty: true });
  }, [setValue]);

  // Helper: Clear all state selections (disables free shipping)
  const handleClearAllStates = useCallback(() => {
    setValue('freeShippingEligibleStates', [], { shouldDirty: true });
  }, [setValue]);

  // Helper: Toggle individual state selection
  const handleToggleState = useCallback(
    (stateCode: string) => {
      const currentStates = freeShippingEligibleStates;
      const isCurrentlySelected = currentStates.includes(stateCode);

      const newStates = isCurrentlySelected
        ? currentStates.filter((s: string) => s !== stateCode) // Remove
        : [...currentStates, stateCode]; // Add

      setValue('freeShippingEligibleStates', newStates, { shouldDirty: true });
    },
    [freeShippingEligibleStates, setValue]
  );

  // Phase 3 & 4: React Query effect - Sync init data to component state
  useEffect(() => {
    if (initData?.success && initData.data) {
      const {
        settings,
        pickupAddress: pickup,
        pickupValidation: validation,
        balance: bal,
        balanceTimestamp: balTs,
        balanceError,
        configured,
      } = initData.data;

      // Handle settings
      if (settings) {
        reset(settings);

        // Phase 1: Store API config for conditional refetch
        setPreviousApiConfig({
          apiKey: settings.apiKey,
          environment: settings.environment,
        });
      }

      // Handle pickup address
      if (pickup) {
        setPickupAddress(pickup);
      }

      // Handle pickup validation
      if (validation) {
        setPickupValidation(validation);
      }

      // Handle balance (conditional - may be undefined)
      if (bal) {
        setBalance(bal.amount);
        setBalanceTimestamp(balTs || null);
        setConnectionStatus('connected');
      } else if (balanceError) {
        console.error('[Init] Balance error:', balanceError);
        setConnectionStatus('disconnected');
      } else if (!configured) {
        setConnectionStatus('not-configured');
      } else {
        setConnectionStatus('disconnected');
      }
    } else if (initError) {
      console.error('Failed to load initial data:', initError);
      toast.error('Failed to load shipping settings');
      setConnectionStatus('disconnected');
    }
  }, [initData, initError, reset]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/admin/shipping/balance');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.balance) {
          setBalance(data.balance.amount);
          setBalanceTimestamp(data.timestamp);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await fetchBalance();
      toast.success('Balance refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string | null): string => {
    if (!timestamp) {
      return '';
    }

    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    }
    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    }
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const fetchCouriers = async () => {
    setIsLoadingCouriers(true);
    try {
      const response = await fetch('/api/admin/shipping/couriers');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.couriers) {
          setAvailableCouriers(data.couriers);
        } else {
          toast.error(data.message || 'Failed to load couriers');
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to load couriers');
      }
    } catch (error) {
      console.error('Failed to fetch couriers:', error);
      toast.error('Failed to load courier list');
    } finally {
      setIsLoadingCouriers(false);
    }
  };

  // Load couriers when "Selected Couriers" or "Priority Courier" mode is chosen and settings are configured
  useEffect(() => {
    if (
      (watchedValues.courierSelectionMode ===
        COURIER_SELECTION_STRATEGIES.SELECTED ||
        watchedValues.courierSelectionMode ===
          COURIER_SELECTION_STRATEGIES.PRIORITY) &&
      connectionStatus === 'connected' &&
      availableCouriers.length === 0
    ) {
      fetchCouriers();
    }
  }, [watchedValues.courierSelectionMode, connectionStatus]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Clear unused courier selection data based on selected strategy
      const cleanedData = { ...data };

      if (cleanedData.courierSelectionMode === 'selected') {
        // SELECTED mode: keep selectedCouriers, remove priorityCouriers
        delete cleanedData.priorityCouriers;
      } else if (cleanedData.courierSelectionMode === 'priority') {
        // PRIORITY mode: keep priorityCouriers, remove selectedCouriers
        delete cleanedData.selectedCouriers;
      } else {
        // CHEAPEST or SHOW_ALL: remove both
        delete cleanedData.selectedCouriers;
        delete cleanedData.priorityCouriers;
      }

      const response = await fetchWithCSRF('/api/admin/shipping/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Shipping settings saved successfully');
        // Reset form with cleaned data (without unused fields)
        reset(cleanedData);

        // Phase 1 Optimization: Only refetch balance if API credentials changed
        const apiConfigChanged =
          previousApiConfig?.apiKey !== cleanedData.apiKey ||
          previousApiConfig?.environment !== cleanedData.environment;

        if (apiConfigChanged) {
          console.log(
            '[Optimization] API config changed, refreshing balance...'
          );
          await fetchBalance();

          // Update stored config
          setPreviousApiConfig({
            apiKey: cleanedData.apiKey,
            environment: cleanedData.environment,
          });
        } else {
          console.log(
            '[Optimization] API config unchanged, skipping balance refresh'
          );
        }
      } else {
        // Show detailed validation errors if pickup address invalid
        if (result.error === 'INVALID_PICKUP_ADDRESS' && result.details) {
          const errorMessages = result.details.errors.join('\n');
          toast.error(`Pickup Address Validation Failed:\n${errorMessages}`, {
            duration: 8000,
          });
        } else {
          toast.error(result.message || 'Failed to save settings');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetchWithCSRF('/api/admin/shipping/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: watchedValues.apiKey,
          environment: watchedValues.environment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Connection successful!');
      } else {
        toast.error('❌ Connection failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteSettings = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete all shipping settings?\n\nThis will:\n• Remove API configuration\n• Clear courier selection settings\n• Delete free shipping configuration\n• Require reconfiguration to use shipping features\n\nThis action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetchWithCSRF('/api/admin/shipping/settings', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Shipping settings deleted successfully');

        // Reset ALL form fields to empty/unchecked values
        reset({
          apiKey: '',
          environment: 'sandbox',
          courierSelectionMode: COURIER_SELECTION_STRATEGIES.CHEAPEST,
          selectedCouriers: undefined,
          freeShippingEnabled: false,
          freeShippingThreshold: undefined,
          freeShippingEligibleStates: [], // NEW: Reset to empty array
          autoUpdateOrderStatus: false,
          whatsappNotificationsEnabled: false,
        });

        // Clear all state
        setBalance(null);
        setPreviousApiConfig(null); // Phase 1: Clear stored config
        setConnectionStatus('not-configured');

        // Phase 3: Use React Query refetch
        await refetchInit();
      } else {
        if (response.status === 403) {
          toast.error('Admin access required to delete shipping settings');
        } else {
          toast.error(result.message || 'Failed to delete settings');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete settings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Phase 3: Use React Query loading state
  if (isLoadingInit) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          EasyParcel Shipping Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your EasyParcel integration for automated shipping
        </p>
      </div>

      {/* Pickup Address Status Alert */}
      {!pickupValidation.isValid && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pickup Address Required</AlertTitle>
          <AlertDescription>
            Please configure your shipping address in{' '}
            <Link
              href="/admin/settings/business-profile"
              className="underline font-semibold hover:text-red-800"
            >
              Business Profile Settings
            </Link>{' '}
            before setting up EasyParcel integration.
            <div className="mt-2 space-y-1">
              {pickupValidation.errors.map((error, index) => (
                <div key={index} className="text-sm">
                  • {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Connection Status & Account Balance */}
      {connectionStatus !== 'not-configured' && (
        <Card
          className={`p-6 mb-6 ${
            connectionStatus === 'connected'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold">
              {connectionStatus === 'connected'
                ? 'Account Balance'
                : 'API Connection'}
            </h2>
            {connectionStatus === 'connected' ? (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Connected to API
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                Disconnected
              </Badge>
            )}
          </div>

          {connectionStatus === 'connected' && balance !== null ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">Current Balance:</span>
                <span className="text-3xl font-bold text-blue-600">
                  RM {balance.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshingBalance}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                  />
                  Refresh Balance
                </Button>

                <Button type="button" variant="outline" size="sm" asChild>
                  <a
                    href="https://easyparcel.com/my/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Top Up Account
                  </a>
                </Button>
              </div>

              {balance < 50 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Your balance is running low. Top up to avoid fulfillment
                  failures.
                </p>
              )}

              {balanceTimestamp && (
                <p className="text-xs text-gray-500">
                  Last updated: {getRelativeTime(balanceTimestamp)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-red-700 font-medium">
                Failed to connect to EasyParcel API
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please check your API key and environment settings, then test
                the connection below.
              </p>
            </div>
          )}
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* API Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            API Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key *</Label>
              <PasswordInput
                id="apiKey"
                {...register('apiKey')}
                placeholder="Enter your EasyParcel API key"
              />
              {errors.apiKey && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.apiKey.message}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Get your API key from EasyParcel dashboard
              </p>
            </div>

            <div>
              <Label htmlFor="environment">Environment *</Label>
              <Select
                value={watchedValues.environment}
                onValueChange={value =>
                  setValue('environment', value as 'sandbox' | 'production', {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </Card>

        {/* Pickup Address (Read-Only from BusinessProfile) */}
        <Card className="p-6 bg-gray-50 border-gray-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Pickup Address (Sender Information)
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Read-only - managed in Business Profile
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-300"
            >
              From Business Profile
            </Badge>
          </div>

          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              This address is sourced from your{' '}
              <Link
                href="/admin/settings/business-profile"
                className="underline font-semibold hover:text-blue-700 inline-flex items-center gap-1"
              >
                Business Profile settings
                <ExternalLink className="h-3 w-3" />
              </Link>
              . Changes made there will automatically apply here.
            </AlertDescription>
          </Alert>

          {pickupAddress ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Business Name</Label>
                  <Input
                    disabled
                    value={pickupAddress.businessName}
                    className="bg-gray-100 border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Phone Number</Label>
                  <Input
                    disabled
                    value={pickupAddress.phone}
                    className="bg-gray-100 border-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700">Address Line 1</Label>
                <Input
                  disabled
                  value={pickupAddress.addressLine1}
                  className="bg-gray-100 border-gray-300"
                />
              </div>

              {pickupAddress.addressLine2 && (
                <div>
                  <Label className="text-gray-700">Address Line 2</Label>
                  <Input
                    disabled
                    value={pickupAddress.addressLine2}
                    className="bg-gray-100 border-gray-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700">City</Label>
                  <Input
                    disabled
                    value={pickupAddress.city}
                    className="bg-gray-100 border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">State</Label>
                  <Input
                    disabled
                    value={
                      pickupAddress.state
                        ? MALAYSIAN_STATES[
                            pickupAddress.state.toLowerCase() as keyof typeof MALAYSIAN_STATES
                          ] || pickupAddress.state
                        : ''
                    }
                    className="bg-gray-100 border-gray-300"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Postal Code</Label>
                  <Input
                    disabled
                    value={pickupAddress.postalCode}
                    className="bg-gray-100 border-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700">Country</Label>
                <Input
                  disabled
                  value={
                    pickupAddress.country === 'MY'
                      ? 'Malaysia (MY)'
                      : pickupAddress.country
                  }
                  className="bg-gray-100 border-gray-300"
                />
              </div>

              {/* Validation Status */}
              {pickupValidation.isValid ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Pickup address is valid and ready for use
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Pickup address has validation errors (see above)
                  </span>
                </div>
              )}

              {/* Warnings */}
              {pickupValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                  <p className="font-medium text-yellow-800 mb-2">
                    Recommendations:
                  </p>
                  {pickupValidation.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      • {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">
                No shipping address configured
              </p>
              <p className="text-sm mt-2">
                Please set up your shipping address in{' '}
                <Link
                  href="/admin/settings/business-profile"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  Business Profile settings
                </Link>
              </p>
            </div>
          )}
        </Card>

        {/* Courier Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Courier Selection Strategy
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courierSelectionMode">
                How should customers see shipping options? *
              </Label>
              <Select
                value={watchedValues.courierSelectionMode}
                onValueChange={value =>
                  setValue('courierSelectionMode', value, { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={COURIER_SELECTION_STRATEGIES.CHEAPEST}>
                    Cheapest Courier (Recommended)
                  </SelectItem>
                  <SelectItem value={COURIER_SELECTION_STRATEGIES.SHOW_ALL}>
                    Show All Couriers
                  </SelectItem>
                  <SelectItem value={COURIER_SELECTION_STRATEGIES.SELECTED}>
                    Selected Couriers
                  </SelectItem>
                  <SelectItem value={COURIER_SELECTION_STRATEGIES.PRIORITY}>
                    Priority Courier
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                Cheapest: Auto-select lowest price • Show All: Customer chooses
                • Selected: Show all from your list • Priority: Show highest
                priority available only
              </p>
            </div>

            {/* Conditional: Priority Courier - 3 Dropdowns */}
            {watchedValues.courierSelectionMode ===
              COURIER_SELECTION_STRATEGIES.PRIORITY && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Select up to 3 couriers in order of preference. Customers
                    will see the highest priority courier available for their
                    area.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-sm">
                    <strong>Note:</strong> Service types (Pickup/Drop-off) are
                    determined per destination. Each courier may offer pickup,
                    drop-off, or both options. Customers will see the available
                    service type during checkout based on their delivery
                    address.
                  </AlertDescription>
                </Alert>

                {connectionStatus !== 'connected' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure and save API settings first to load available
                      couriers
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === 'connected' &&
                  availableCouriers.length === 0 && (
                    <div className="flex items-center justify-center py-4 border rounded-lg bg-gray-50">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchCouriers}
                        disabled={isLoadingCouriers}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isLoadingCouriers ? 'animate-spin' : ''}`}
                        />
                        Load Courier List
                      </Button>
                    </div>
                  )}

                {isLoadingCouriers && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">
                      Loading couriers...
                    </span>
                  </div>
                )}

                {!isLoadingCouriers && availableCouriers.length > 0 && (
                  <div className="space-y-4">
                    {/* 1st Priority (Required) */}
                    <div>
                      <Label
                        htmlFor="priority-first"
                        className="text-sm font-medium"
                      >
                        1st Priority (Required) *
                      </Label>
                      <Select
                        value={watchedValues.priorityCouriers?.first || ''}
                        onValueChange={value => {
                          setValue(
                            'priorityCouriers',
                            {
                              ...watchedValues.priorityCouriers,
                              first: value,
                            },
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="priority-first">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers.map(courier => (
                            <SelectItem
                              key={courier.courierId}
                              value={courier.courierId}
                            >
                              {courier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.priorityCouriers?.first && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.priorityCouriers.first.message}
                        </p>
                      )}
                    </div>

                    {/* 2nd Priority (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor="priority-second"
                          className="text-sm font-medium"
                        >
                          2nd Priority (Optional)
                        </Label>
                        {watchedValues.priorityCouriers?.second && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValue(
                                'priorityCouriers',
                                {
                                  ...watchedValues.priorityCouriers,
                                  second: undefined,
                                },
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select
                        value={watchedValues.priorityCouriers?.second || ''}
                        onValueChange={value => {
                          setValue(
                            'priorityCouriers',
                            {
                              ...watchedValues.priorityCouriers,
                              second: value,
                            },
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="priority-second">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers
                            .filter(
                              c =>
                                c.courierId !==
                                watchedValues.priorityCouriers?.first
                            )
                            .map(courier => (
                              <SelectItem
                                key={courier.courierId}
                                value={courier.courierId}
                              >
                                {courier.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 3rd Priority (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor="priority-third"
                          className="text-sm font-medium"
                        >
                          3rd Priority (Optional)
                        </Label>
                        {watchedValues.priorityCouriers?.third && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValue(
                                'priorityCouriers',
                                {
                                  ...watchedValues.priorityCouriers,
                                  third: undefined,
                                },
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select
                        value={watchedValues.priorityCouriers?.third || ''}
                        onValueChange={value => {
                          setValue(
                            'priorityCouriers',
                            {
                              ...watchedValues.priorityCouriers,
                              third: value,
                            },
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="priority-third">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers
                            .filter(
                              c =>
                                c.courierId !==
                                  watchedValues.priorityCouriers?.first &&
                                c.courierId !==
                                  watchedValues.priorityCouriers?.second
                            )
                            .map(courier => (
                              <SelectItem
                                key={courier.courierId}
                                value={courier.courierId}
                              >
                                {courier.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        If none of your ranked couriers are available for the
                        delivery address, checkout will be blocked (same as no
                        courier available).
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {errors.priorityCouriers &&
                  'message' in errors.priorityCouriers && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.priorityCouriers.message}
                    </p>
                  )}
              </div>
            )}

            {/* Conditional: Selected Couriers - 3 Dropdowns (shows all to customer) */}
            {watchedValues.courierSelectionMode ===
              COURIER_SELECTION_STRATEGIES.SELECTED && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Select up to 3 couriers in order of preference. Customers
                    will see ALL selected couriers that are available for their
                    area.
                  </AlertDescription>
                </Alert>

                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-sm">
                    <strong>Note:</strong> Service types (Pickup/Drop-off) are
                    service-specific, not courier-specific. Each courier may
                    offer multiple service types depending on the destination.
                    Customers will see available service options (pickup,
                    drop-off, or both) during checkout based on their delivery
                    address.
                  </AlertDescription>
                </Alert>

                {connectionStatus !== 'connected' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure and save API settings first to load available
                      couriers
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === 'connected' &&
                  availableCouriers.length === 0 && (
                    <div className="flex items-center justify-center py-4 border rounded-lg bg-gray-50">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchCouriers}
                        disabled={isLoadingCouriers}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isLoadingCouriers ? 'animate-spin' : ''}`}
                        />
                        Load Couriers
                      </Button>
                    </div>
                  )}

                {isLoadingCouriers && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">
                      Loading couriers...
                    </span>
                  </div>
                )}

                {!isLoadingCouriers && availableCouriers.length > 0 && (
                  <>
                    {/* 1st Selection (Required) */}
                    <div>
                      <Label
                        htmlFor="selected-first"
                        className="text-sm font-medium"
                      >
                        1st Selection (Required) *
                      </Label>
                      <Select
                        value={watchedValues.selectedCouriers?.[0] || ''}
                        onValueChange={value => {
                          const newSelected = [
                            ...(watchedValues.selectedCouriers || []),
                          ];
                          newSelected[0] = value;
                          setValue(
                            'selectedCouriers',
                            newSelected.filter(Boolean),
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="selected-first">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers.map(courier => (
                            <SelectItem
                              key={courier.courierId}
                              value={courier.courierId}
                            >
                              {courier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2nd Selection (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor="selected-second"
                          className="text-sm font-medium"
                        >
                          2nd Selection (Optional)
                        </Label>
                        {watchedValues.selectedCouriers?.[1] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSelected = [
                                ...(watchedValues.selectedCouriers || []),
                              ];
                              newSelected[1] = '';
                              setValue(
                                'selectedCouriers',
                                newSelected.filter(Boolean),
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select
                        value={watchedValues.selectedCouriers?.[1] || ''}
                        onValueChange={value => {
                          const newSelected = [
                            ...(watchedValues.selectedCouriers || []),
                          ];
                          newSelected[1] = value;
                          setValue(
                            'selectedCouriers',
                            newSelected.filter(Boolean),
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="selected-second">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers
                            .filter(
                              c =>
                                c.courierId !==
                                watchedValues.selectedCouriers?.[0]
                            )
                            .map(courier => (
                              <SelectItem
                                key={courier.courierId}
                                value={courier.courierId}
                              >
                                {courier.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 3rd Selection (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor="selected-third"
                          className="text-sm font-medium"
                        >
                          3rd Selection (Optional)
                        </Label>
                        {watchedValues.selectedCouriers?.[2] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSelected = [
                                ...(watchedValues.selectedCouriers || []),
                              ];
                              newSelected[2] = '';
                              setValue(
                                'selectedCouriers',
                                newSelected.filter(Boolean),
                                { shouldDirty: true, shouldValidate: true }
                              );
                            }}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <Select
                        value={watchedValues.selectedCouriers?.[2] || ''}
                        onValueChange={value => {
                          const newSelected = [
                            ...(watchedValues.selectedCouriers || []),
                          ];
                          newSelected[2] = value;
                          setValue(
                            'selectedCouriers',
                            newSelected.filter(Boolean),
                            { shouldDirty: true, shouldValidate: true }
                          );
                        }}
                      >
                        <SelectTrigger id="selected-third">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers
                            .filter(
                              c =>
                                c.courierId !==
                                  watchedValues.selectedCouriers?.[0] &&
                                c.courierId !==
                                  watchedValues.selectedCouriers?.[1]
                            )
                            .map(courier => (
                              <SelectItem
                                key={courier.courierId}
                                value={courier.courierId}
                              >
                                {courier.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {errors.selectedCouriers && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.selectedCouriers.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Free Shipping */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="freeShippingEnabled"
                checked={watchedValues.freeShippingEnabled}
                onCheckedChange={checked =>
                  setValue('freeShippingEnabled', checked as boolean, {
                    shouldDirty: true,
                  })
                }
              />
              <Label htmlFor="freeShippingEnabled">
                Enable free shipping threshold
              </Label>
            </div>

            {watchedValues.freeShippingEnabled && (
              <div>
                <Label htmlFor="freeShippingThreshold">
                  Minimum order amount (RM)
                </Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="0.01"
                  {...register('freeShippingThreshold', {
                    valueAsNumber: true,
                  })}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Orders above this amount get free shipping
                </p>
              </div>
            )}

            {/* State-Based Eligibility Configuration */}
            {watchedValues.freeShippingEnabled && (
              <div className="space-y-4 border-t pt-6 mt-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="text-base font-semibold">
                      Eligible States for Free Shipping
                    </Label>
                    <p className="text-sm text-gray-600">
                      Select which states qualify for free shipping. At least one state must be selected.
                      If no states are selected, free shipping will be effectively disabled.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStates}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllStates}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* State Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {Object.entries(MALAYSIAN_STATES)
                    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB)) // Sort alphabetically
                    .map(([code, name]) => {
                      const isChecked = freeShippingEligibleStates.includes(code);
                      return (
                        <div
                          key={code}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`state-${code}`}
                            checked={isChecked}
                            onCheckedChange={() => handleToggleState(code)}
                          />
                          <Label
                            htmlFor={`state-${code}`}
                            className="text-sm font-normal cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {name}
                          </Label>
                        </div>
                      );
                    })}
                </div>

                {/* Validation Error Display */}
                {errors.freeShippingEligibleStates && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errors.freeShippingEligibleStates.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Summary Information */}
                <div className="flex items-center gap-3 pt-2">
                  <Badge variant="secondary" className="text-sm">
                    {freeShippingEligibleStates.length} of {Object.keys(MALAYSIAN_STATES).length} states selected
                  </Badge>
                  {freeShippingEligibleStates.length === 0 && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Warning: Free shipping will be disabled (no states selected)
                      </span>
                    </div>
                  )}
                  {freeShippingEligibleStates.length > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Free shipping available for selected states
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Automation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Automation Settings</h2>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoUpdateOrderStatus"
              checked={watchedValues.autoUpdateOrderStatus}
              onCheckedChange={checked =>
                setValue('autoUpdateOrderStatus', checked as boolean, {
                  shouldDirty: true,
                })
              }
            />
            <Label htmlFor="autoUpdateOrderStatus">
              Automatically update order status based on tracking
            </Label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            When enabled, order status will change based on courier tracking
            updates
          </p>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="whatsappNotificationsEnabled"
              checked={watchedValues.whatsappNotificationsEnabled}
              onCheckedChange={checked =>
                setValue('whatsappNotificationsEnabled', checked as boolean, {
                  shouldDirty: true,
                })
              }
            />
            <Label htmlFor="whatsappNotificationsEnabled">
              Enable WhatsApp Notifications
            </Label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Customers receive tracking updates via WhatsApp (+RM 0.20 per order)
          </p>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !pickupValidation.isValid}
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
            {isDirty && (
              <Button type="button" variant="outline" onClick={() => reset()}>
                Reset
              </Button>
            )}
          </div>

          {/* Delete Button - Only show if settings exist and user is Admin/SuperAdmin */}
          {connectionStatus !== 'not-configured' &&
            (session?.user?.role === 'ADMIN' ||
              session?.user?.role === 'SUPERADMIN') && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSettings}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Clear Configuration'}
              </Button>
            )}
        </div>

        {/* Save button disabled message */}
        {!pickupValidation.isValid && (
          <p className="text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Configure pickup address in Business Profile to enable saving
          </p>
        )}
      </form>
    </div>
  );
}
