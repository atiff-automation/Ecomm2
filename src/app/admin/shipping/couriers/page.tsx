/**
 * Unified Courier Management Page
 * Consolidates courier discovery, preferences, and management in one interface
 * Eliminates DRY violations by using React state updates instead of window.location.reload
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { toast } from 'sonner';
import {
  Save,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle,
  Truck,
  Settings,
  Star,
  Activity,
  Info,
  AlertTriangle,
} from 'lucide-react';

import type { CourierPreference } from '@/lib/config/business-shipping-config';

interface AvailableCourier {
  courierId: string;
  courierName: string;
  priority: number;
  enabled: boolean;
  serviceTypes: string[];
  estimatedDeliveryDays: number;
  priceRange?: { min: number; max: number };
  coverage?: { westMalaysia: boolean; eastMalaysia: boolean };
  features?: { insuranceAvailable: boolean; codAvailable: boolean };
  maxWeight?: number;
  notes?: string;
}

export default function CourierManagementPage() {
  const { data: session, status } = useSession();
  const [courierPreferences, setCourierPreferences] = useState<CourierPreference[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<AvailableCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [hasDiscovered, setHasDiscovered] = useState(false);

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    redirect('/auth/signin');
    return null;
  }

  // Load existing courier preferences (fast operation - no API calls)
  const loadCourierPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/shipping/config');
      if (!response.ok) throw new Error('Failed to load configuration');

      const data = await response.json();
      setCourierPreferences(data.courierPreferences || []);
    } catch (error) {
      console.error('Error loading courier preferences:', error);
      toast.error('Failed to load courier preferences');
    }
  }, []);

  // Discover available couriers from API (slower operation - requires API call)
  const discoverAvailableCouriers = async () => {
    setDiscovering(true);
    try {
      const response = await fetch('/api/admin/shipping/couriers?action=available');
      const data = await response.json();

      if (data.success) {
        setAvailableCouriers(data.availableCouriers || []);
        setApiConnected(data.apiConnected || false);
        setHasDiscovered(true);
        toast.success(`Found ${data.availableCouriers?.length || 0} available couriers`);
      } else {
        throw new Error(data.error || 'Failed to discover couriers');
      }
    } catch (error) {
      console.error('Error discovering couriers:', error);
      toast.error('Failed to discover available couriers');
      setApiConnected(false);
    } finally {
      setDiscovering(false);
    }
  };

  // Save courier preferences with React state updates (eliminates window.location.reload)
  const saveCourierPreferences = async (preferences: CourierPreference[]) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/shipping/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      // Update React state instead of reloading page
      setCourierPreferences(preferences);
      toast.success('Courier preferences updated successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save courier preferences');
    } finally {
      setSaving(false);
    }
  };

  // Update courier preference in state
  const updateCourierPreference = (courierId: string, updates: Partial<CourierPreference>) => {
    setCourierPreferences(prev =>
      prev.map(pref =>
        pref.courierId === courierId ? { ...pref, ...updates } : pref
      )
    );
  };

  // Remove courier from preferences
  const removeCourier = (courierId: string) => {
    const updatedPrefs = courierPreferences.filter(pref => pref.courierId !== courierId);
    saveCourierPreferences(updatedPrefs);
  };

  // Add/update couriers from discovery
  const updateFromDiscovered = () => {
    const selectedCouriers = availableCouriers
      .filter(courier => courier.enabled)
      .map((courier, index) => ({
        courierId: courier.courierId,
        courierName: courier.courierName,
        priority: courier.priority < 999 ? courier.priority : index + 1,
        enabled: true,
        serviceTypes: courier.serviceTypes as ('STANDARD' | 'EXPRESS' | 'OVERNIGHT')[],
        maxWeight: courier.maxWeight || 30,
        notes: courier.notes || 'Auto-configured from EasyParcel API',
      }));

    // Merge with existing preferences, keeping user customizations
    const mergedPreferences = [...courierPreferences];

    selectedCouriers.forEach(newPref => {
      const existingIndex = mergedPreferences.findIndex(p => p.courierId === newPref.courierId);
      if (existingIndex >= 0) {
        // Update existing - keep user's priority and enabled state
        mergedPreferences[existingIndex] = {
          ...newPref,
          priority: mergedPreferences[existingIndex].priority,
          enabled: mergedPreferences[existingIndex].enabled,
        };
      } else {
        // Add new
        mergedPreferences.push(newPref);
      }
    });

    saveCourierPreferences(mergedPreferences);
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      await loadCourierPreferences();
      setLoading(false);
    };

    initializePage();
  }, [loadCourierPreferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading courier management...</span>
      </div>
    );
  }

  // Navigation tabs - consistent across shipping pages
  const tabs: TabConfig[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/shipping' },
    { id: 'policies', label: 'Shipping Policies', href: '/admin/shipping/policies' },
    { id: 'couriers', label: 'Courier Management', href: '/admin/shipping/couriers' },
    { id: 'orders', label: 'Order Processing', href: '/admin/shipping/orders' },
    { id: 'system', label: 'System Config', href: '/admin/shipping/system' },
  ];

  return (
    <AdminPageLayout
      title="Courier Management"
      subtitle="Manage courier preferences, priorities, and discover new shipping options"
      tabs={tabs}
      loading={loading}
    >
      <div className="space-y-8">
        {/* Current Active Couriers */}
        {courierPreferences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Active Couriers ({courierPreferences.filter(c => c.enabled).length})
                </div>
                <Badge variant="outline">
                  {courierPreferences.length} total configured
                </Badge>
              </CardTitle>
              <CardDescription>
                Your currently configured courier preferences and priorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courierPreferences
                  .sort((a, b) => a.priority - b.priority)
                  .map((pref) => (
                    <div
                      key={pref.courierId}
                      className={`p-4 border rounded-lg ${
                        pref.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={pref.enabled}
                            onChange={(e) => updateCourierPreference(pref.courierId, { enabled: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                          <div>
                            <h4 className={`font-medium ${pref.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                              {pref.courierName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {pref.serviceTypes?.join(', ') || 'Standard'} • Max: {pref.maxWeight || 30}kg
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`priority-${pref.courierId}`} className="text-sm">
                              Priority:
                            </Label>
                            <Input
                              id={`priority-${pref.courierId}`}
                              type="number"
                              min="1"
                              max="99"
                              value={pref.priority}
                              onChange={(e) => updateCourierPreference(pref.courierId, {
                                priority: parseInt(e.target.value) || 1
                              })}
                              className="w-20 h-8"
                              disabled={!pref.enabled}
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCourier(pref.courierId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t">
                <Button
                  onClick={() => saveCourierPreferences(courierPreferences)}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courier Discovery Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Discover New Couriers
            </CardTitle>
            <CardDescription>
              Connect to EasyParcel API to discover available couriers for your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasDiscovered ? (
                  <>
                    {apiConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      Last Discovery: {apiConnected ? 'Success' : 'Failed'}
                    </span>
                    {availableCouriers.length > 0 && (
                      <Badge variant="outline">
                        {availableCouriers.length} couriers found
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-700">
                      Click "Discover Couriers" to find available options
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={discoverAvailableCouriers}
                  disabled={discovering}
                  variant="outline"
                >
                  {discovering ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Discover Couriers
                    </>
                  )}
                </Button>

                {hasDiscovered && availableCouriers.length > 0 && (
                  <Button
                    onClick={updateFromDiscovered}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Preferences
                  </Button>
                )}
              </div>
            </div>

            {hasDiscovered && availableCouriers.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium">Available Couriers</h3>
                {availableCouriers.map(courier => (
                  <div
                    key={courier.courierId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      courier.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const updated = availableCouriers.map(c =>
                        c.courierId === courier.courierId ? { ...c, enabled: !c.enabled } : c
                      );
                      setAvailableCouriers(updated);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          courier.enabled ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {courier.enabled && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{courier.courierName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">
                              {courier.estimatedDeliveryDays} day{courier.estimatedDeliveryDays !== 1 ? 's' : ''} delivery
                            </span>
                            {courier.serviceTypes.length > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">
                                  {courier.serviceTypes.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {courier.coverage?.westMalaysia && (
                          <Badge variant="secondary" className="text-xs">West MY</Badge>
                        )}
                        {courier.coverage?.eastMalaysia && (
                          <Badge variant="secondary" className="text-xs">East MY</Badge>
                        )}
                        {courier.priority < 999 && (
                          <Badge variant="outline" className="text-xs">
                            Priority {courier.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Initial Setup State */}
        {courierPreferences.length === 0 && !hasDiscovered && (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Courier Preferences Set
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by discovering available couriers from EasyParcel API
              </p>
              <Button
                onClick={discoverAvailableCouriers}
                disabled={discovering}
              >
                {discovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Discover Available Couriers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
}