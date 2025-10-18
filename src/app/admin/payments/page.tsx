/**
 * Admin Payments Management Page - Malaysian E-commerce Platform
 * Single-page payment gateway and transaction management
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
  Smartphone,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface PaymentGateway {
  id: string;
  name: string;
  type: 'toyyibpay';
  status: 'active' | 'inactive' | 'configured' | 'pending';
  description: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
              description:
                'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
              configPath: '/admin/payments/toyyibpay',
              features: [
                'FPX Online Banking',
                'Credit/Debit Cards',
                'E-wallets',
                'QR Code',
              ],
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
            description:
              'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
            configPath: '/admin/payments/toyyibpay',
            features: [
              'FPX Online Banking',
              'Credit/Debit Cards',
              'E-wallets',
              'QR Code',
            ],
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
          description:
            'Malaysian payment gateway supporting FPX, Credit Cards, and e-wallets',
          configPath: '/admin/payments/toyyibpay',
          features: [
            'FPX Online Banking',
            'Credit/Debit Cards',
            'E-wallets',
            'QR Code',
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPaymentData();
    setIsRefreshing(false);
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'configured':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'configured':
        return <Settings className="h-3 w-3" />;
      case 'pending':
      case 'inactive':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          Payment Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage payment gateways and track transaction performance
        </p>
      </div>

      {/* Payment Statistics - Compact */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Overview</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <DollarSign className="w-3 h-3" />
                <span>Revenue</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {stats ? formatCurrency(stats.totalRevenue) : '---'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Activity className="w-3 h-3" />
                <span>Transactions</span>
              </div>
              <div className="text-xl font-bold">
                {stats?.totalTransactions.toLocaleString() || '---'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3" />
                <span>Success Rate</span>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {stats ? `${stats.successRate}%` : '---'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <AlertCircle className="w-3 h-3" />
                <span>Failed</span>
              </div>
              <div className="text-xl font-bold text-red-600">
                {stats?.failedTransactions || '---'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <AlertCircle className="w-3 h-3" />
                <span>Pending</span>
              </div>
              <div className="text-xl font-bold text-yellow-600">
                {stats?.pendingTransactions || '---'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateways */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Payment Gateways
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gateways.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No payment gateways configured
            </div>
          ) : (
            gateways.map(gateway => (
              <Card key={gateway.id} className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold">
                            {gateway.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getStatusColor(gateway.status)}
                          >
                            {getStatusIcon(gateway.status)}
                            <span className="ml-1 capitalize">
                              {gateway.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
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
                      <Button variant="default" size="sm" asChild>
                        <Link href={gateway.configPath}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Future Gateways Placeholder */}
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-gray-600 mb-1">
                More payment gateways coming soon
              </p>
              <p className="text-xs text-gray-500">
                Stripe, PayPal, and other providers will be available in future
                updates
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
