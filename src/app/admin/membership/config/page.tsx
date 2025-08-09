/**
 * Admin Membership Configuration - Malaysian E-commerce Platform
 * Manage membership settings and thresholds
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  DollarSign,
  Users,
  Shield,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Award,
  Target,
} from 'lucide-react';

interface MembershipConfig {
  membershipThreshold: number;
  enablePromotionalExclusion: boolean;
  requireQualifyingCategories: boolean;
  membershipBenefitsText: string;
  membershipTermsText: string;
}

interface MemberStats {
  totalMembers: number;
  newMembersThisMonth: number;
  averageOrderValue: number;
  totalSavingsGiven: number;
  conversionRate: number;
}

export default function MembershipConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<MembershipConfig>({
    membershipThreshold: 80,
    enablePromotionalExclusion: true,
    requireQualifyingCategories: true,
    membershipBenefitsText: '',
    membershipTermsText: '',
  });

  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
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
      const [configResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/membership/config'),
        fetch('/api/admin/membership/stats'),
      ]);

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.config);
        setOriginalConfig(configData.config);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMemberStats(statsData.stats);
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
      const response = await fetch('/api/admin/membership/config', {
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

  const breadcrumbItems = [
    {
      label: 'Membership',
      href: '/admin/membership',
      icon: Users as React.ComponentType<{ className?: string }>,
    },
    {
      label: 'Configuration',
      href: '/admin/membership/config',
      icon: Settings as React.ComponentType<{ className?: string }>,
    },
  ];

  return (
    <div>
      <ContextualNavigation items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              Membership Configuration
            </h1>
            <p className="text-gray-600 mt-2">
              Manage membership settings, thresholds, and benefits
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md border ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <p
                className={
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Member Stats Overview */}
        {memberStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberStats.totalMembers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">New This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberStats.newMembersThisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(memberStats.averageOrderValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Savings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(memberStats.totalSavingsGiven)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(memberStats.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Membership Settings</TabsTrigger>
            <TabsTrigger value="content">Content & Messaging</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Membership Threshold
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="threshold">
                    Minimum Qualifying Amount (MYR)
                  </Label>
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
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Customers must spend at least this amount to qualify for
                    membership
                  </p>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <div className="text-blue-800">
                      <p>
                        Current threshold:{' '}
                        <strong>
                          {formatPrice(config.membershipThreshold)}
                        </strong>
                        <br />
                        Changing this will affect future membership
                        qualifications only.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Qualification Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">Exclude Promotional Items</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Promotional items will not count towards membership
                      qualification
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enablePromotionalExclusion}
                    onChange={e =>
                      setConfig({
                        ...config,
                        enablePromotionalExclusion: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      Require Qualifying Products
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Only products marked as qualifying count towards
                      membership
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.requireQualifyingCategories}
                    onChange={e =>
                      setConfig({
                        ...config,
                        requireQualifyingCategories: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-blue-800">
                      <p>
                        <strong>Current Configuration:</strong>
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          • Promotional exclusion:
                          <Badge
                            className={
                              config.enablePromotionalExclusion
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }
                          >
                            {config.enablePromotionalExclusion
                              ? 'Enabled'
                              : 'Disabled'}
                          </Badge>
                        </li>
                        <li className="flex items-center gap-2">
                          • Category requirement:
                          <Badge
                            className={
                              config.requireQualifyingCategories
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }
                          >
                            {config.requireQualifyingCategories
                              ? 'Enabled'
                              : 'Disabled'}
                          </Badge>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Membership Benefits Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="benefits">Benefits Description</Label>
                  <textarea
                    id="benefits"
                    rows={4}
                    value={config.membershipBenefitsText}
                    onChange={e =>
                      setConfig({
                        ...config,
                        membershipBenefitsText: e.target.value,
                      })
                    }
                    placeholder="Describe the benefits members receive..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This text will be displayed to customers explaining
                    membership benefits
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Membership Terms Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <textarea
                    id="terms"
                    rows={4}
                    value={config.membershipTermsText}
                    onChange={e =>
                      setConfig({
                        ...config,
                        membershipTermsText: e.target.value,
                      })
                    }
                    placeholder="Explain how membership activation works..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This text explains the terms and conditions for membership
                    activation
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
