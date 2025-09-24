/**
 * Shipping Management Dashboard
 * Clean overview with flat navigation to specialized pages
 * Follows @CLAUDE.md systematic approach and SHIPPING_UX_IMPROVEMENT_PLAN.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { toast } from 'sonner';
import {
  Truck,
  Package,
  Settings,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  BarChart3,
} from 'lucide-react';

import type { BusinessProfile } from '@/lib/config/business-shipping-config';

interface ShippingStats {
  totalOrders: number;
  pendingShipments: number;
  totalRevenue: number;
  activeCouriers: number;
}

interface BalanceInfo {
  current: number;
  currency: string;
  status: 'sufficient' | 'low' | 'critical';
  cacheInfo: {
    cached: boolean;
    age: number;
  };
}

interface APIConnectionStatus {
  connected: boolean;
  lastChecked: string;
  responseTime?: number;
}

interface DashboardData {
  profile?: BusinessProfile;
  statistics: ShippingStats;
  apiStatus: APIConnectionStatus;
  balance?: BalanceInfo;
  balanceError?: { error: string; requiresConfiguration?: boolean };
  configured: boolean;
}

export default function ShippingDashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    statistics: { totalOrders: 0, pendingShipments: 0, totalRevenue: 0, activeCouriers: 0 },
    apiStatus: { connected: false, lastChecked: new Date().toISOString() },
    configured: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load configuration and stats
      const [configResponse, statsResponse, balanceResponse] = await Promise.all([
        fetch('/api/admin/shipping/config'),
        fetch('/api/admin/shipping/stats'),
        fetch('/api/admin/shipping/balance').catch(err => {
          // Handle network errors but still pass the error for proper handling
          console.error('Balance API network error:', err);
          return new Response(JSON.stringify({ error: 'Network error', requiresConfiguration: true }), { status: 500 });
        })
      ]);

      const configData = configResponse.ok ? await configResponse.json() : null;
      const statsData = statsResponse.ok ? await statsResponse.json() : null;

      // CRITICAL FIX: Properly handle balance API response including error states
      let balanceData = null;
      let balanceError = null;
      if (balanceResponse.ok) {
        balanceData = await balanceResponse.json();
      } else {
        // Parse error response to understand why balance failed
        try {
          balanceError = await balanceResponse.json();
        } catch {
          balanceError = { error: 'Failed to fetch balance', requiresConfiguration: true };
        }
      }

      // CRITICAL FIX: Determine API status based on balance API validation result
      // If balance API returns success, credentials are valid
      // If balance API has requiresConfiguration error, credentials are invalid/missing
      const hasValidCredentials = !!(balanceData?.success && !balanceError?.requiresConfiguration);

      setDashboardData({
        profile: configData?.profile,
        statistics: statsData?.statistics || {
          totalOrders: 0,
          pendingShipments: 0,
          totalRevenue: 0,
          activeCouriers: 0,
        },
        apiStatus: {
          connected: hasValidCredentials,
          lastChecked: new Date().toISOString(),
          responseTime: 120,
        },
        balance: balanceData?.balance,
        balanceError: balanceError,
        configured: hasValidCredentials,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load shipping dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/shipping/balance?refresh=true');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(prev => ({
          ...prev,
          balance: data.balance,
          balanceError: undefined, // Clear any previous errors
          apiStatus: {
            ...prev.apiStatus,
            connected: true, // If balance API succeeds, connection is valid
          }
        }));
        toast.success('Balance refreshed');
      } else {
        // CRITICAL FIX: Handle balance refresh errors including invalid credentials
        const errorData = await response.json();
        setDashboardData(prev => ({
          ...prev,
          balance: undefined,
          balanceError: errorData,
          apiStatus: {
            ...prev.apiStatus,
            connected: false, // Any balance API failure means no valid connection
          }
        }));
        toast.error(errorData.message || 'Failed to refresh balance');
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  // Flat navigation tabs - no nested structure
  const tabs: TabConfig[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/shipping' },
    { id: 'policies', label: 'Shipping Policies', href: '/admin/shipping/policies' },
    { id: 'couriers', label: 'Courier Management', href: '/admin/shipping/couriers' },
    { id: 'orders', label: 'Order Processing', href: '/admin/shipping/orders' },
    { id: 'system', label: 'System Config', href: '/admin/shipping/system' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading shipping dashboard...</span>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title="Shipping Management"
      subtitle="Overview and quick access to shipping operations"
      tabs={tabs}
      loading={loading}
    >
      <div className="space-y-8">
        {/* Critical Alerts */}
        {dashboardData.balance && dashboardData.balance.status !== 'sufficient' && (
          <Alert
            className={
              dashboardData.balance.status === 'critical'
                ? 'border-red-500 bg-red-50'
                : 'border-yellow-500 bg-yellow-50'
            }
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                dashboardData.balance.status === 'critical' ? 'text-red-500' : 'text-yellow-500'
              }`}
            />
            <AlertDescription>
              <strong>
                {dashboardData.balance.status === 'critical' ? 'Critical:' : 'Warning:'}
              </strong>{' '}
              EasyParcel balance is {dashboardData.balance.status} (RM{' '}
              {dashboardData.balance.current}).
              {dashboardData.balance.status === 'critical' &&
                ' You may not be able to create shipping labels.'}{' '}
              <a
                href="https://connect.easyparcel.my/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Top up now
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">All-time shipping orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.pendingShipments}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Couriers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.statistics.activeCouriers}</div>
              <p className="text-xs text-muted-foreground">Configured and enabled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {dashboardData.apiStatus.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {dashboardData.apiStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">EasyParcel API</p>
            </CardContent>
          </Card>
        </div>

        {/* EasyParcel Balance - Always show, with error states */}
        {(dashboardData.balance || dashboardData.balanceError) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                EasyParcel Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* CRITICAL FIX: Show different states based on balance vs error */}
              {dashboardData.balance ? (
                // Show balance when available
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold">
                      <span
                        className={`${
                          dashboardData.balance.status === 'critical'
                            ? 'text-red-600'
                            : dashboardData.balance.status === 'low'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {dashboardData.balance.currency} {dashboardData.balance.current.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Badge
                        variant={
                          dashboardData.balance.status === 'critical'
                            ? 'destructive'
                            : dashboardData.balance.status === 'low'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {dashboardData.balance.status.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {dashboardData.balance.cacheInfo.cached
                          ? `Cached ${dashboardData.balance.cacheInfo.age}s ago`
                          : 'Live data'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={refreshBalance} disabled={refreshing} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              ) : dashboardData.balanceError ? (
                // Show error state when balance is not available
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-gray-400">
                      <span>No Data</span>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="border-red-300 text-red-600">
                        {dashboardData.balanceError.requiresConfiguration ? 'NOT CONFIGURED' : 'ERROR'}
                      </Badge>
                      <p className="text-sm text-red-600">
                        {dashboardData.balanceError.requiresConfiguration
                          ? 'Configure API credentials in System Config'
                          : dashboardData.balanceError.error}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dashboardData.balanceError.requiresConfiguration && (
                      <Button asChild variant="default" size="sm">
                        <Link href="/admin/shipping/system">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Link>
                      </Button>
                    )}
                    <Button onClick={refreshBalance} disabled={refreshing} variant="outline" size="sm">
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                // Fallback loading state
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading balance...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Primary Tasks */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Shipping Policies
              </CardTitle>
              <CardDescription>
                Configure rates, thresholds, and business rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/shipping/policies">
                <Button className="w-full">
                  Manage Policies
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                Courier Management
              </CardTitle>
              <CardDescription>
                Discover, configure, and prioritize shipping options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/shipping/couriers">
                <Button className="w-full">
                  Manage Couriers
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Order Processing
              </CardTitle>
              <CardDescription>
                Bulk operations, tracking, and fulfillment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/shipping/orders">
                <Button className="w-full">
                  Process Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                System Configuration
              </CardTitle>
              <CardDescription>
                API credentials, health monitoring, and technical settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/shipping/system">
                <Button variant="outline" className="w-full">
                  System Settings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Shipping performance and business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full">
                  View Reports
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Status */}
        {!dashboardData.configured && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Setup Required
              </CardTitle>
              <CardDescription>
                Complete your shipping configuration to start processing orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  To get started with shipping, configure your business profile and shipping policies.
                </p>
                <div className="flex gap-3">
                  <Link href="/admin/shipping/policies">
                    <Button size="sm">Configure Policies</Button>
                  </Link>
                  <Link href="/admin/shipping/couriers">
                    <Button variant="outline" size="sm">Set Up Couriers</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
}