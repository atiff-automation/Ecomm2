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
    { id: 'overview', label: 'Overview', href: '/admin/payments' },
    {
      id: 'gateways',
      label: 'Gateways',
      href: '/admin/payments/gateways',
    },
  ];

  // Define breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payments', href: '/admin/payments', icon: Smartphone },
  ];

  // Page actions
  const pageActions = (
    <Button variant="outline" onClick={fetchPaymentData}>
      <Activity className="h-4 w-4 mr-2" />
      Refresh
    </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
      </div>

    </AdminPageLayout>
  );
}
