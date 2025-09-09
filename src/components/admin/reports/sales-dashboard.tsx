/**
 * Sales Dashboard Component
 * Main dashboard for sales reporting with Malaysian e-commerce features
 * Modern minimalist design with shadcn components
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetricCard } from './metric-card';
import { ProductPerformanceTable } from './product-performance-table';
import { CustomerInsightsTable } from './customer-insights-table';
import { RevenueChart } from './revenue-chart';
import { DateRangePicker } from './date-range-picker';
import type { SalesOverview } from '@/lib/types/sales-reports';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function SalesDashboard() {
  const [overview, setOverview] = useState<SalesOverview | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesOverview();
  }, [dateRange]);

  const fetchSalesOverview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });

      const response = await fetch(`/api/admin/reports/sales/overview?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setOverview(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Failed to fetch sales overview:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        format: 'csv',
        reportType: 'overview'
      });

      const response = await fetch(`/api/admin/reports/sales/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${dateRange.startDate.toISOString().split('T')[0]}-to-${dateRange.endDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatDateRange = () => {
    const startStr = dateRange.startDate.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const endStr = dateRange.endDate.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
    return `${startStr} - ${endStr}`;
  };

  const calculateMemberPercentage = () => {
    if (!overview || overview.totalRevenue === 0) return 0;
    return ((overview.memberRevenue / overview.totalRevenue) * 100);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchSalesOverview} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-sm text-muted-foreground">
            Malaysian E-commerce Analytics • {formatDateRange()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : overview && (
          <>
            <MetricCard
              title="Total Revenue"
              value={overview.totalRevenue}
              formatAsCurrency
              description="Completed orders only"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard
              title="Total Orders"
              value={overview.totalOrders}
              description={`Avg: ${new Intl.NumberFormat('ms-MY', {
                style: 'currency',
                currency: 'MYR'
              }).format(overview.averageOrderValue)}`}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <MetricCard
              title="Member Revenue"
              value={overview.memberRevenue}
              formatAsCurrency
              description={`${calculateMemberPercentage().toFixed(1)}% of total`}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title="Tax Collected"
              value={overview.taxCollected}
              formatAsCurrency
              description="GST/SST total"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Member vs Non-Member Analysis */}
      {!loading && overview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member vs Non-Member Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Revenue</span>
                  <Badge variant="secondary">
                    {calculateMemberPercentage().toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('ms-MY', {
                    style: 'currency',
                    currency: 'MYR'
                  }).format(overview.memberRevenue)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Non-Member Revenue</span>
                  <Badge variant="outline">
                    {(100 - calculateMemberPercentage()).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('ms-MY', {
                    style: 'currency',
                    currency: 'MYR'
                  }).format(overview.nonMemberRevenue)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily revenue trends and payment method distribution
              </p>
            </CardHeader>
            <CardContent>
              <RevenueChart 
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Best selling products and profit analysis
              </p>
            </CardHeader>
            <CardContent>
              <ProductPerformanceTable
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customer behavior and geographic distribution
              </p>
            </CardHeader>
            <CardContent>
              <CustomerInsightsTable
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Malaysian Compliance Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              🇲🇾 Malaysian Compliance
            </Badge>
            <span className="text-blue-700">
              GST/SST tax calculations follow Malaysian regulations. 
              Export features ready for accounting software integration.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}