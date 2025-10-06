/**
 * Admin Payments Management Page - Malaysian E-commerce Platform
 * Main payments dashboard with gateway management and transaction overview
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Activity,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
  TabConfig,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';

interface PaymentGateway {
  id: string;
  name: string;
  type: 'toyyibpay';
  status: 'active' | 'inactive' | 'configured' | 'pending';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  configPath: string;
  features: string[];
}

interface PaymentStats {
  totalTransactions: number;
  totalRevenue: number;
  successRate: number;
  failedTransactions: number;
  refundedAmount: number;
  pendingTransactions: number;
  partiallyRefundedAmount: number;
  averageOrderValue: number;
}

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch both stats and gateways in parallel
      const [statsResponse, gatewaysResponse] = await Promise.all([
        fetch('/api/admin/payments/stats?includeMethodBreakdown=false'),
        fetch('/api/admin/payments/gateways?includeStats=false'),
      ]);
      
      // Handle stats response
      if (statsResponse.ok) {
        const { success, data, error } = await statsResponse.json();
        if (success) {
          setStats(data.metrics);
        } else {
          throw new Error(error || 'Failed to fetch payment statistics');
        }
      }
      
      // Handle gateways response
      if (gatewaysResponse.ok) {
        const { success, data, error } = await gatewaysResponse.json();
        if (success && data?.gateways) {
          setGateways(data.gateways);
        } else {
          console.error('Failed to fetch gateways:', error);
          // Use fallback gateway definition
          setGateways([
            {
              id: 'toyyibpay',
              name: 'toyyibPay',
              type: 'toyyibpay',
              status: 'pending',
              description: 'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
              configPath: '/admin/payments/toyyibpay',
              features: ['FPX Online Banking', 'Credit/Debit Cards', 'E-wallets', 'QR Code'],
            },
          ]);
        }
      } else {
        console.error('Gateway API returned error:', gatewaysResponse.status);
        // Use fallback gateway definition
        setGateways([
          {
            id: 'toyyibpay',
            name: 'toyyibPay',
            type: 'toyyibpay',
            status: 'pending',
            description: 'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
            configPath: '/admin/payments/toyyibpay',
            features: ['FPX Online Banking', 'Credit/Debit Cards', 'E-wallets', 'QR Code'],
          },
        ]);
      }
      
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
      // Provide fallback data for errors
      setStats({
        totalTransactions: 0,
        totalRevenue: 0,
        successRate: 0,
        failedTransactions: 0,
        refundedAmount: 0,
        pendingTransactions: 0,
        partiallyRefundedAmount: 0,
        averageOrderValue: 0,
      });
      // Use fallback gateway definition
      setGateways([
        {
          id: 'toyyibpay',
          name: 'toyyibPay',
          type: 'toyyibpay',
          status: 'pending',
          description: 'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
          configPath: '/admin/payments/toyyibpay',
          features: ['FPX Online Banking', 'Credit/Debit Cards', 'E-wallets', 'QR Code'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'configured':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'configured':
        return <Settings className="h-4 w-4" />;
      case 'pending':
      case 'inactive':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Define contextual tabs for Payments section
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Payment Overview', href: '/admin/payments' },
    {
      id: 'gateway-config',
      label: 'Gateway Config',
      href: '/admin/payments/toyyibpay',
    },
  ];

  // Define breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payments', href: '/admin/payments', icon: Smartphone },
  ];

  // Page actions
  const pageActions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={fetchPaymentData}>
        <Activity className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button asChild>
        <Link href="/admin/payments/transactions">
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Transactions
        </Link>
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Payment Management"
      subtitle="Manage payment gateways, transactions, and financial overview"
      actions={pageActions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      loading={loading}
    >
      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.totalRevenue) : '---'}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTransactions.toLocaleString() || '---'}
            </div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats ? `${stats.successRate}%` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">Payment success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.failedTransactions || '---'}
            </div>
            <p className="text-xs text-muted-foreground">Failed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingTransactions || '---'}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats ? formatCurrency(stats.refundedAmount) : '---'}
            </div>
            <p className="text-xs text-muted-foreground">Total refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateways */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure and manage your payment processing options
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gateways.map(gateway => {
              // Handle icon mapping since functions can't be serialized in API responses
              const getIcon = (type: string) => {
                switch (type) {
                  case 'toyyibpay': return Smartphone;
                  default: return Smartphone;
                }
              };
              const IconComponent = getIcon(gateway.type);
              return (
                <div
                  key={gateway.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{gateway.name}</h3>
                        <Badge className={getStatusColor(gateway.status)}>
                          {getStatusIcon(gateway.status)}
                          <span className="ml-1 capitalize">
                            {gateway.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {gateway.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {gateway.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={gateway.configPath}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage recent payment transactions
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/payments/transactions">View Transactions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Refund Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Process customer refund requests
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/payments/refunds">Manage Refunds</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Payment Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed payment performance and trends
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/payments/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
