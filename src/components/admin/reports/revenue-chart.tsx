/**
 * Revenue Chart Component
 * Simple chart visualization for revenue trends
 * Note: In production, integrate with recharts or chart.js for better visualization
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  CreditCard,
} from 'lucide-react';
import type { RevenueAnalytics } from '@/lib/types/sales-reports';

interface RevenueChartProps {
  startDate: Date;
  endDate: Date;
}

export function RevenueChart({ startDate, endDate }: RevenueChartProps) {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [startDate, endDate]);

  const fetchRevenueAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `/api/admin/reports/sales/revenue?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch revenue analytics');
      }

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch revenue analytics');
      }
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ms-MY').format(num);
  };

  const getMaxRevenue = () => {
    if (!analytics?.daily.length) {
      return 0;
    }
    return Math.max(...analytics.daily.map(point => point.revenue));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No revenue data found
        </h3>
        <p className="text-sm text-muted-foreground">
          No revenue data available for the selected period.
        </p>
      </div>
    );
  }

  const maxRevenue = getMaxRevenue();
  const totalRevenue = analytics.daily.reduce(
    (sum, point) => sum + point.revenue,
    0
  );
  const totalOrders = analytics.daily.reduce(
    (sum, point) => sum + point.orders,
    0
  );

  return (
    <div className="space-y-6">
      {/* Simple Bar Chart Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Daily Revenue Trend</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Revenue performance over the selected period
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Revenue
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(totalOrders)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Orders
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    totalOrders > 0 ? totalRevenue / totalOrders : 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Order Value
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.daily.length}
                </div>
                <div className="text-xs text-muted-foreground">Active Days</div>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.daily.map((point, index) => (
                <div key={point.date} className="flex items-center space-x-3">
                  <div className="text-xs font-mono text-muted-foreground w-20">
                    {new Date(point.date).toLocaleDateString('en-MY', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    {/* Member Revenue */}
                    <div
                      className="h-full bg-blue-500 absolute left-0 top-0"
                      style={{
                        width: `${maxRevenue > 0 ? (point.memberRevenue / maxRevenue) * 100 : 0}%`,
                      }}
                    />
                    {/* Non-Member Revenue */}
                    <div
                      className="h-full bg-green-500 absolute top-0"
                      style={{
                        left: `${maxRevenue > 0 ? (point.memberRevenue / maxRevenue) * 100 : 0}%`,
                        width: `${maxRevenue > 0 ? (point.nonMemberRevenue / maxRevenue) * 100 : 0}%`,
                      }}
                    />
                    {/* Revenue Text */}
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(point.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground w-16 text-right">
                    {point.orders} orders
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Member Revenue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Non-Member Revenue</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Analysis */}
      {analytics.paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Method Distribution</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Popular payment methods in Malaysia
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.paymentMethods.map((method, index) => (
                <div
                  key={method.method}
                  className="flex items-center space-x-4"
                >
                  <div className="w-20 text-sm font-medium">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{method.method}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(method.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{method.count} transactions</span>
                      <span>{method.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note for Future Enhancement */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Chart Enhancement Available
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                For advanced visualizations, integrate with libraries like
                Recharts or Chart.js. Current implementation provides basic
                trend analysis suitable for business reporting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
