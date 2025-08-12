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
  Activity,
  Loader2,
  PieChart,
} from 'lucide-react';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface AnalyticsData {
  revenueTrend: Array<{ date: string; orders: number; revenue: number }>;
  orderStatusData: Array<{ status: string; count: number; percentage: number }>;
  membershipComparison: Array<{
    customerType: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    orders: number;
    unitsSold: number;
    revenue: number;
  }>;
  hourlyOrderData: Array<{ hour: number; orders: number; revenue: number }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    Promise.all([fetchReportData(), fetchAnalyticsData()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reports/analytics?period=${dateRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
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

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `RM${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RM${(amount / 1000).toFixed(1)}K`;
    }
    return `RM${amount.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Chart colors
  const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
  ];

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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Key Performance Metrics
              </h2>
              <Button
                onClick={() => handleExportReport('overview')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Overview
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-600">
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.revenueTrend ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={value =>
                            new Date(value).toLocaleDateString('en-MY', {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />
                        <YAxis 
                          tickFormatter={value => formatCurrencyCompact(value)}
                          width={60}
                        />
                        <Tooltip
                          labelFormatter={value =>
                            new Date(value).toLocaleDateString('en-MY')
                          }
                          formatter={(value: number, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Revenue' : 'Orders',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Order Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.orderStatusData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Pie
                          data={analyticsData.orderStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ status, percentage }) =>
                            `${status} (${percentage}%)`
                          }
                        >
                          {analyticsData.orderStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Analytics
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

            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(reportData?.salesReport.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatPercentage(
                        reportData?.salesReport.revenueGrowth || 0
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData?.salesReport.totalOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-blue-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatPercentage(
                        reportData?.salesReport.ordersGrowth || 0
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Order Value
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      reportData?.salesReport.averageOrderValue || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue per order
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Customers
                  </CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData?.customerReport.activeCustomers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">This period</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData?.salesReport.dailySales ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={reportData.salesReport.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={value =>
                            new Date(value).toLocaleDateString('en-MY', {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />
                        <YAxis
                          yAxisId="revenue"
                          orientation="left"
                          tickFormatter={value => formatCurrencyCompact(value)}
                          width={60}
                        />
                        <YAxis yAxisId="orders" orientation="right" />
                        <Tooltip
                          labelFormatter={value =>
                            new Date(value).toLocaleDateString('en-MY')
                          }
                          formatter={(value: number, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Revenue' : 'Orders',
                          ]}
                        />
                        <Line
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3B82F6"
                          strokeWidth={3}
                        />
                        <Line
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          stroke="#10B981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No sales data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
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
              <Card className="border-l-4 border-l-yellow-600">
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
                      {formatPercentage(
                        reportData.membershipReport.memberGrowth
                      )}
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
                    {reportData.membershipReport.memberConversionRate.toFixed(
                      1
                    )}
                    %
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
                    {formatCurrency(
                      reportData.membershipReport.nonMemberRevenue
                    )}{' '}
                    non-member
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Membership Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member vs Non-Member Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Member vs Non-Member Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.membershipComparison ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.membershipComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="customerType" />
                        <YAxis 
                          tickFormatter={value => formatCurrencyCompact(value)}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'revenue' || name === 'avgOrderValue'
                              ? formatCurrency(Number(value))
                              : value,
                            name === 'revenue'
                              ? 'Revenue'
                              : name === 'avgOrderValue'
                                ? 'Avg Order Value'
                                : 'Orders',
                          ]}
                        />
                        <Bar dataKey="revenue" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No membership comparison data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.categoryPerformance ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={analyticsData.categoryPerformance.slice(0, 6)}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis 
                          tickFormatter={value => formatCurrencyCompact(value)}
                          width={60}
                        />
                        <Tooltip
                          formatter={value => formatCurrency(Number(value))}
                        />
                        <Bar dataKey="revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No category data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Performance
              </h2>
              <Button
                onClick={() => handleExportReport('inventory')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Products
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

            {/* Product Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Top Products Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData?.productReport.topSellingProducts ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={reportData.productReport.topSellingProducts.slice(
                          0,
                          5
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tickFormatter={value =>
                            value.length > 12
                              ? value.substring(0, 12) + '...'
                              : value
                          }
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === 'sold' ? 'Units Sold' : 'Revenue',
                          ]}
                        />
                        <Bar dataKey="sold" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No product data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {reportData?.productReport.totalProducts || 0}
                        </div>
                        <div className="text-sm text-green-700">
                          Total Products
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {reportData?.productReport.lowStockProducts || 0}
                        </div>
                        <div className="text-sm text-yellow-700">Low Stock</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {reportData?.productReport.outOfStockProducts || 0}
                        </div>
                        <div className="text-sm text-red-700">Out of Stock</div>
                      </div>
                    </div>

                    {reportData?.productReport.topSellingProducts && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Revenue Leaders
                        </h4>
                        {reportData.productReport.topSellingProducts
                          .slice(0, 3)
                          .map((product, index) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-sm">
                                  {product.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {formatCurrency(product.revenue)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {product.sold} sold
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operational Analytics
              </h2>
              <Button
                onClick={() => handleExportReport('operations')}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Operations
              </Button>
            </div>

            {/* Operations Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Order Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Peak Hours Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.hourlyOrderData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.hourlyOrderData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={value => `${value}:00`}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={value =>
                            `${value}:00 - ${value + 1}:00`
                          }
                        />
                        <Bar dataKey="orders" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No hourly data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analyticsData?.paymentMethodDistribution ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Pie
                          data={analyticsData.paymentMethodDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ method, percentage }) =>
                            `${method} (${percentage}%)`
                          }
                        >
                          {analyticsData.paymentMethodDistribution.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No payment method data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
