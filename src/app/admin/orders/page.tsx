'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Download,
  Eye,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
}

interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export default function AdminOrders() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    status: searchParams.get('status') || '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      const response = await fetch(`/api/admin/orders?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
        }),
      });

      if (response.ok) {
        fetchOrders();
        setSelectedOrders([]);
      }
    } catch (error) {
      console.error('Failed to update orders:', error);
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      const response = await fetch(`/api/admin/orders/export?${queryParams}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export orders:', error);
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
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation
        items={[
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Fulfillment', href: '/admin/orders/fulfillment' },
          { label: 'Export', href: '/admin/orders/export' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Orders' }]} className="mb-6" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage and track customer orders</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Input
                  placeholder="Search orders..."
                  value={filters.search || ''}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
              <Select
                value={filters.status || ''}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.paymentStatus || ''}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    paymentStatus: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                }
                placeholder="From Date"
              />
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                }
                placeholder="To Date"
              />
            </div>
            <div className="flex justify-between mt-4">
              <Button onClick={fetchOrders} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedOrders.length} order(s) selected
                </span>
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESSING">
                      Mark as Processing
                    </SelectItem>
                    <SelectItem value="SHIPPED">Mark as Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Mark as Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Mark as Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 w-12">
                          <Checkbox
                            checked={
                              selectedOrders.length === orders.length &&
                              orders.length > 0
                            }
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedOrders(orders.map(o => o.id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-3">Order #</th>
                        <th className="text-left py-3">Customer</th>
                        <th className="text-left py-3">Items</th>
                        <th className="text-left py-3">Total</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-left py-3">Payment</th>
                        <th className="text-left py-3">Date</th>
                        <th className="text-left py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr
                          key={order.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3">
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setSelectedOrders(prev => [
                                    ...prev,
                                    order.id,
                                  ]);
                                } else {
                                  setSelectedOrders(prev =>
                                    prev.filter(id => id !== order.id)
                                  );
                                }
                              }}
                            />
                          </td>
                          <td className="py-3 font-mono text-sm">
                            {order.orderNumber}
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="font-medium">
                                {order.customerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.customerEmail}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span>{order.itemCount}</span>
                            </div>
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="py-3">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              className={getPaymentStatusColor(
                                order.paymentStatus
                              )}
                            >
                              {order.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.createdAt).toLocaleDateString(
                                'en-MY'
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found matching your criteria
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} orders
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
