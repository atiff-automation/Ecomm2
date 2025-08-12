/**
 * Enhanced Admin Dashboard - Malaysian E-commerce Platform
 * Interactive dashboard with charts and visualizations using shadcn/ui + Recharts
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
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

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalMembers: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  membershipMetrics: {
    conversionRate: number;
    avgMemberOrderValue: number;
    avgNonMemberOrderValue: number;
  };
}

interface DashboardAnalytics {
  revenueTrend: Array<{ date: string; orders: number; revenue: number }>;
  orderStatusData: Array<{ status: string; count: number; percentage: number }>;
  topProducts: Array<{
    name: string;
    sku: string;
    totalSold: number;
    revenue: number;
  }>;
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
  membershipGrowth: Array<{ date: string; newMembers: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchDashboardAnalytics()]);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Unable to load dashboard
            </h1>
            <p className="text-gray-600 mt-2">Please try refreshing the page</p>
            <Button onClick={fetchDashboardStats} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time insights and analytics for your e-commerce platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchDashboardAnalytics}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/admin/reports">
                  <Eye className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="membership">Membership Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +12.5% from last month
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingOrders > 0 && (
                      <span className="text-yellow-600">
                        {stats.pendingOrders} pending
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Customers
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCustomers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-purple-600">
                      {stats.totalMembers} members
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.membershipMetrics.conversionRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customer to member conversion
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
                    Revenue Trend (30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.revenueTrend ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.revenueTrend}>
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
                        <YAxis tickFormatter={value => formatCurrency(value)} />
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
                  ) : analytics?.orderStatusData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Pie
                          data={analytics.orderStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ status, percentage }) =>
                            `${status} (${percentage}%)`
                          }
                        >
                          {analytics.orderStatusData.map((entry, index) => (
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

            {/* Action Cards & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Urgent Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.pendingOrders > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">
                        {stats.pendingOrders} pending orders
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/admin/orders?status=pending">Review</Link>
                      </Button>
                    </div>
                  )}
                  {stats.lowStockProducts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">
                        {stats.lowStockProducts} low stock items
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/admin/products?filter=low-stock">
                          Restock
                        </Link>
                      </Button>
                    </div>
                  )}
                  {stats.pendingOrders === 0 &&
                    stats.lowStockProducts === 0 && (
                      <div className="text-center py-4 text-green-700">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-sm">All systems running smoothly!</p>
                      </div>
                    )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">
                    Membership Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">
                      Avg Member Order
                    </span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(
                        stats.membershipMetrics.avgMemberOrderValue
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">
                      Avg Non-Member Order
                    </span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(
                        stats.membershipMetrics.avgNonMemberOrderValue
                      )}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    asChild
                  >
                    <Link href="/admin/membership/analytics">
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/admin/products/import">
                      <Package className="h-4 w-4 mr-2" />
                      Import Products
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/admin/orders/export">
                      <FileText className="h-4 w-4 mr-2" />
                      Export Orders
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/admin/notifications">
                      <Activity className="h-4 w-4 mr-2" />
                      Telegram Setup
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant="outline" asChild>
                    <Link href="/admin/orders">View All Orders</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Order #
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.slice(0, 5).map(order => (
                        <tr
                          key={order.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium text-blue-600">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-4">{order.customerName}</td>
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${getStatusColor(order.status)} border`}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString(
                              'en-MY'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stats.recentOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent orders found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue & Orders Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.revenueTrend ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.revenueTrend}>
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
                          tickFormatter={value => formatCurrency(value)}
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
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.topProducts ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.topProducts.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tickFormatter={value =>
                            value.length > 15
                              ? value.substring(0, 15) + '...'
                              : value
                          }
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === 'totalSold' ? 'Units Sold' : 'Revenue',
                          ]}
                        />
                        <Bar dataKey="totalSold" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No product data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.categoryPerformance ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis tickFormatter={value => formatCurrency(value)} />
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

          <TabsContent value="membership" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member vs Non-Member Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Member vs Non-Member Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.membershipComparison ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.membershipComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="customerType" />
                        <YAxis tickFormatter={value => formatCurrency(value)} />
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

              {/* Membership Growth */}
              <Card>
                <CardHeader>
                  <CardTitle>Membership Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : analytics?.membershipGrowth ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.membershipGrowth}>
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
                        <YAxis />
                        <Tooltip
                          labelFormatter={value =>
                            new Date(value).toLocaleDateString('en-MY')
                          }
                          formatter={value => [value, 'New Members']}
                        />
                        <Area
                          type="monotone"
                          dataKey="newMembers"
                          stroke="#F59E0B"
                          fill="#F59E0B"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      No membership growth data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
