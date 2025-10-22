/**
 * Admin Membership Configuration - Malaysian E-commerce Platform
 * Manage membership settings and thresholds
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import {
  AdminPageLayout,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';

interface MembershipConfig {
  membershipThreshold: number;
  enablePromotionalExclusion: boolean;
  requireQualifyingCategories: boolean;
}

export default function MembershipConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<MembershipConfig>({
    membershipThreshold: 80,
    enablePromotionalExclusion: true,
    requireQualifyingCategories: true,
  });

  const [originalConfig, setOriginalConfig] = useState<MembershipConfig | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin/membership/config');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const configResponse = await fetch('/api/admin/membership/config');

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.config);
        setOriginalConfig(configData.config);
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to load membership configuration',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to load membership configuration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetchWithCSRF('/api/admin/membership/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setOriginalConfig({ ...config });
        setMessage({
          type: 'success',
          text: 'Membership configuration updated successfully',
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.message || 'Failed to update configuration',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to update configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig });
      setMessage(null);
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    BREADCRUMB_CONFIGS.customers.main,
    { label: 'Membership Settings', href: '/admin/membership/config' },
  ];

  const pageActions = (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/customers')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Customers
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={!hasChanges || saving}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Reset
      </Button>
      <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Membership Settings"
      subtitle="Configure membership qualification rules and thresholds"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      parentSection={{ label: 'Customers', href: '/admin/customers' }}
      loading={loading}
    >
      {/* Message Alert */}
      {message && (
        <Alert
          variant={message.type === 'success' ? 'default' : 'destructive'}
          className="mb-6"
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Settings */}
      <div className="space-y-6">
        {/* Membership Qualification Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Membership Qualification Rules
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how customers qualify for automatic membership activation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Threshold Setting */}
            <div className="space-y-2">
              <Label htmlFor="threshold">Minimum Qualifying Amount (MYR)</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                step="0.01"
                value={config.membershipThreshold}
                onChange={e =>
                  setConfig({
                    ...config,
                    membershipThreshold: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Customers must spend at least{' '}
                {formatPrice(config.membershipThreshold)} to qualify
              </p>
            </div>

            <Separator />

            {/* Qualification Rules */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Qualification Rules</h4>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">
                    Exclude Promotional Items
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Promotional items won&apos;t count towards membership
                  </p>
                </div>
                <Switch
                  checked={config.enablePromotionalExclusion}
                  onCheckedChange={checked =>
                    setConfig({
                      ...config,
                      enablePromotionalExclusion: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">
                    Require Qualifying Products
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only products marked as qualifying count towards membership
                  </p>
                </div>
                <Switch
                  checked={config.requireQualifyingCategories}
                  onCheckedChange={checked =>
                    setConfig({
                      ...config,
                      requireQualifyingCategories: checked,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
