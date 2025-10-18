/**
 * Customer Insights Table Component
 * Displays customer analytics with Malaysian state distribution
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, UserCheck, MapPin, Star } from 'lucide-react';
import type { CustomerInsight } from '@/lib/types/sales-reports';

interface CustomerInsightsTableProps {
  startDate: Date;
  endDate: Date;
}

export function CustomerInsightsTable({
  startDate,
  endDate,
}: CustomerInsightsTableProps) {
  const [insights, setInsights] = useState<CustomerInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerInsights();
  }, [startDate, endDate]);

  const fetchCustomerInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `/api/admin/reports/sales/customers?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer insights');
      }

      const result = await response.json();

      if (result.success) {
        setInsights(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch customer insights');
      }
    } catch (error) {
      console.error('Failed to fetch customer insights:', error);
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No customer data found
        </h3>
        <p className="text-sm text-muted-foreground">
          No customer activity during the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(insights.totalCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(insights.newCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Returning Customers
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(insights.returningCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">
              Made orders in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Member Conversion
            </CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              {formatPercentage(insights.memberConversionRate)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {formatPercentage(insights.memberConversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer to member rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Customer Lifetime Value */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(insights.avgCustomerLifetimeValue)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Average lifetime value per customer based on membership spending
          </p>
        </CardContent>
      </Card>

      {/* Top Malaysian States */}
      {insights.topStates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Top Malaysian States by Revenue</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Geographic distribution of sales across Malaysia
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">
                      Avg Order Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.topStates.map((state, index) => (
                    <TableRow key={state.state}>
                      <TableCell className="font-medium">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{state.stateName}</div>
                          <Badge variant="secondary" className="text-xs">
                            {state.state}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(state.totalOrders)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(state.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          state.totalOrders > 0
                            ? state.totalRevenue / state.totalOrders
                            : 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Insights Summary */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-800 mb-2">
                Growth Insights
              </h4>
              <ul className="space-y-1 text-green-700">
                <li>
                  • {formatNumber(insights.newCustomers)} new customers acquired
                </li>
                <li>
                  • {formatPercentage(insights.memberConversionRate)}{' '}
                  successfully converted to members
                </li>
                <li>
                  • {formatNumber(insights.returningCustomers)} active customers
                  made purchases
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">
                Revenue Performance
              </h4>
              <ul className="space-y-1 text-green-700">
                <li>
                  • {formatCurrency(insights.avgCustomerLifetimeValue)} average
                  lifetime value
                </li>
                <li>
                  • Strong performance in{' '}
                  {insights.topStates[0]?.stateName || 'major states'}
                </li>
                <li>• Membership program driving customer loyalty</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
