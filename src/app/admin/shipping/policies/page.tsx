/**
 * Shipping Policies Management Page
 * Centralized location for all shipping business rules and policies
 * Follows @CLAUDE.md systematic approach with single source of truth
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Settings,
  DollarSign,
  Package,
  Shield,
  Clock,
} from 'lucide-react';

import type { BusinessProfile } from '@/lib/config/business-shipping-config';

export default function ShippingPoliciesPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shipping/config');
      if (!response.ok) throw new Error('Failed to load configuration');

      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error loading policies:', error);
      toast.error('Failed to load shipping policies');
    } finally {
      setLoading(false);
    }
  };

  const savePolicies = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/shipping/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save policies');
      }

      toast.success('Shipping policies updated successfully');
      await loadPolicies(); // Refresh to ensure consistency
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  const updatePolicies = (updates: Partial<BusinessProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const updateShippingPolicies = (policyUpdates: Partial<BusinessProfile['shippingPolicies']>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      shippingPolicies: { ...profile.shippingPolicies, ...policyUpdates }
    });
  };

  const updateServiceSettings = (serviceUpdates: Partial<BusinessProfile['serviceSettings']>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      serviceSettings: { ...profile.serviceSettings, ...serviceUpdates }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading shipping policies...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load shipping policies</p>
        <Button onClick={loadPolicies}>Retry</Button>
      </div>
    );
  }

  // Navigation tabs - same structure across all shipping pages
  const tabs: TabConfig[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/shipping' },
    { id: 'policies', label: 'Shipping Policies', href: '/admin/shipping/policies' },
    { id: 'couriers', label: 'Courier Management', href: '/admin/shipping/couriers' },
    { id: 'orders', label: 'Order Processing', href: '/admin/shipping/orders' },
    { id: 'system', label: 'System Config', href: '/admin/shipping/system' },
  ];

  return (
    <AdminPageLayout
      title="Shipping Policies"
      subtitle="Configure business rules, pricing thresholds, and service options"
      tabs={tabs}
      loading={loading}
    >
      <div className="space-y-8">
        {/* Core Business Rules */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Rules
              </CardTitle>
              <CardDescription>
                Control free shipping thresholds and pricing policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (RM)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  value={profile.shippingPolicies?.freeShippingThreshold || 0}
                  onChange={e => updateShippingPolicies({
                    freeShippingThreshold: Number(e.target.value)
                  })}
                  min="0"
                  step="0.01"
                  className="text-lg"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Orders above this amount qualify for free shipping
                </p>
              </div>

              <div>
                <Label htmlFor="processingDays">Processing Time (Days)</Label>
                <Input
                  id="processingDays"
                  type="number"
                  value={profile.shippingPolicies?.processingDays || 1}
                  onChange={e => updateShippingPolicies({
                    processingDays: Number(e.target.value)
                  })}
                  min="0"
                  max="7"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Business days required to process orders before shipping
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Limits
              </CardTitle>
              <CardDescription>
                Set maximum weight and size restrictions for shipments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxWeight">Maximum Weight (kg)</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  value={profile.shippingPolicies?.maxWeight || 30}
                  onChange={e => updateShippingPolicies({
                    maxWeight: Number(e.target.value)
                  })}
                  min="0"
                  max="70"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="maxLength">Length (cm)</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={profile.shippingPolicies?.maxDimensions?.length || 100}
                    onChange={e => updateShippingPolicies({
                      maxDimensions: {
                        ...profile.shippingPolicies?.maxDimensions!,
                        length: Number(e.target.value),
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxWidth">Width (cm)</Label>
                  <Input
                    id="maxWidth"
                    type="number"
                    value={profile.shippingPolicies?.maxDimensions?.width || 100}
                    onChange={e => updateShippingPolicies({
                      maxDimensions: {
                        ...profile.shippingPolicies?.maxDimensions!,
                        width: Number(e.target.value),
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxHeight">Height (cm)</Label>
                  <Input
                    id="maxHeight"
                    type="number"
                    value={profile.shippingPolicies?.maxDimensions?.height || 100}
                    onChange={e => updateShippingPolicies({
                      maxDimensions: {
                        ...profile.shippingPolicies?.maxDimensions!,
                        height: Number(e.target.value),
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Services */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Insurance Settings
              </CardTitle>
              <CardDescription>
                Configure insurance requirements and coverage limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="insuranceRequired"
                  checked={profile.serviceSettings?.insuranceRequired || false}
                  onCheckedChange={checked => updateServiceSettings({
                    insuranceRequired: checked
                  })}
                />
                <Label htmlFor="insuranceRequired">
                  Require insurance for all shipments
                </Label>
              </div>

              <div>
                <Label htmlFor="maxInsuranceValue">Maximum Insurance Value (RM)</Label>
                <Input
                  id="maxInsuranceValue"
                  type="number"
                  value={profile.serviceSettings?.maxInsuranceValue || 5000}
                  onChange={e => updateServiceSettings({
                    maxInsuranceValue: Number(e.target.value)
                  })}
                  min="0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash on Delivery (COD)
              </CardTitle>
              <CardDescription>
                Manage COD availability and transaction limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="codEnabled"
                  checked={profile.serviceSettings?.codEnabled || false}
                  onCheckedChange={checked => updateServiceSettings({
                    codEnabled: checked
                  })}
                />
                <Label htmlFor="codEnabled">Enable COD service</Label>
              </div>

              <div>
                <Label htmlFor="maxCodAmount">Maximum COD Amount (RM)</Label>
                <Input
                  id="maxCodAmount"
                  type="number"
                  value={profile.serviceSettings?.maxCodAmount || 1000}
                  onChange={e => updateServiceSettings({
                    maxCodAmount: Number(e.target.value)
                  })}
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="signatureRequired"
                  checked={profile.serviceSettings?.signatureRequired || false}
                  onCheckedChange={checked => updateServiceSettings({
                    signatureRequired: checked
                  })}
                />
                <Label htmlFor="signatureRequired">Require signature on delivery</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={savePolicies}
            disabled={saving}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Shipping Policies'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}