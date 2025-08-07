'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Eye,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your e-commerce performance
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
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
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pending orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalMembers} members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Member Conversion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.membershipMetrics.conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Eligible customers becoming members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alerts & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.pendingOrders > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {stats.pendingOrders} pending orders
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/orders?status=pending">View</Link>
                  </Button>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {stats.lowStockProducts} low stock items
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/inventory?filter=low-stock">View</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Member Order
                </span>
                <span className="font-medium">
                  {formatCurrency(stats.membershipMetrics.avgMemberOrderValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Non-Member Order
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    stats.membershipMetrics.avgNonMemberOrderValue
                  )}
                </span>
              </div>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href="/admin/membership/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
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
                <Link href="/admin/reports">
                  <Eye className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Order #</th>
                    <th className="text-left py-2">Customer</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id} className="border-b">
                      <td className="py-3 font-medium">{order.orderNumber}</td>
                      <td className="py-3">{order.customerName}</td>
                      <td className="py-3">{formatCurrency(order.total)}</td>
                      <td className="py-3">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {new Date(order.createdAt).toLocaleDateString('en-MY')}
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/orders/${order.id}`}>View</Link>
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
      </div>
    </div>
  );
}
