'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  FileText,
  Crown,
} from 'lucide-react';
import ContextualNavigation from '@/components/admin/ContextualNavigation';

interface ReportData {
  salesReport: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    dailySales: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  };
  membershipReport: {
    totalMembers: number;
    newMembersThisMonth: number;
    memberConversionRate: number;
    memberRevenue: number;
    nonMemberRevenue: number;
    memberGrowth: number;
  };
  productReport: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topSellingProducts: Array<{
      id: string;
      name: string;
      sold: number;
      revenue: number;
    }>;
  };
  customerReport: {
    totalCustomers: number;
    activeCustomers: number;
    repeatCustomers: number;
    customerGrowth: number;
  };
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?period=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      const response = await fetch(
        `/api/admin/reports/export?type=${type}&period=${dateRange}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Unable to load reports
            </h1>
            <p className="text-gray-600 mt-2">Please try refreshing the page</p>
            <Button onClick={fetchReportData} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation
        items={[
          { label: 'Analytics', href: '/admin/reports' },
          { label: 'Sales Reports', href: '/admin/reports/sales' },
          { label: 'Member Analytics', href: '/admin/reports/membership' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reports & Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Business insights and performance metrics
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleExportReport('overview')}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>

        {/* Sales Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Overview
            </h2>
            <Button
              onClick={() => handleExportReport('sales')}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Sales
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.salesReport.totalRevenue)}
                </div>
                <div className="flex items-center text-xs">
                  {reportData.salesReport.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      reportData.salesReport.revenueGrowth >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatPercentage(reportData.salesReport.revenueGrowth)}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    vs previous period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.salesReport.totalOrders}
                </div>
                <div className="flex items-center text-xs">
                  {reportData.salesReport.ordersGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      reportData.salesReport.ordersGrowth >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatPercentage(reportData.salesReport.ordersGrowth)}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    vs previous period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Order Value
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.salesReport.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue per order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.customerReport.activeCustomers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Customers with orders this period
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Membership Analytics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Membership Analytics
            </h2>
            <Button
              onClick={() => handleExportReport('membership')}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Membership
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.membershipReport.totalMembers}
                </div>
                <div className="flex items-center text-xs">
                  {reportData.membershipReport.memberGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      reportData.membershipReport.memberGrowth >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatPercentage(reportData.membershipReport.memberGrowth)}
                  </span>
                  <span className="text-muted-foreground ml-1">growth</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.membershipReport.newMembersThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.membershipReport.memberConversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Eligible customers becoming members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Member Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.membershipReport.memberRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs{' '}
                  {formatCurrency(reportData.membershipReport.nonMemberRevenue)}{' '}
                  non-member
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product & Inventory */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product & Inventory
            </h2>
            <Button
              onClick={() => handleExportReport('inventory')}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Inventory
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Inventory Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Products</span>
                  <span className="font-medium">
                    {reportData.productReport.totalProducts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-600">Low Stock</span>
                  <Badge variant="outline" className="text-yellow-600">
                    {reportData.productReport.lowStockProducts}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Out of Stock</span>
                  <Badge variant="outline" className="text-red-600">
                    {reportData.productReport.outOfStockProducts}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.productReport.topSellingProducts.map(
                    (product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(product.revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.sold} sold
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Report Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => handleExportReport('daily-sales')}
                variant="outline"
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Daily Sales
              </Button>
              <Button
                onClick={() => handleExportReport('customer-list')}
                variant="outline"
                className="justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Customer List
              </Button>
              <Button
                onClick={() => handleExportReport('product-performance')}
                variant="outline"
                className="justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                Product Performance
              </Button>
              <Button
                onClick={() => handleExportReport('tax-report')}
                variant="outline"
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tax Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
