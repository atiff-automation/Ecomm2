'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Search,
  Download,
  Eye,
  Edit,
  Mail,
  Phone,
  Crown,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
  TabConfig,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isMember: boolean;
  memberSince: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  status: string;
  createdAt: string;
}

interface CustomerFilters {
  membership?: string;
  status?: string;
  search?: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value && value !== '')
        ),
      });

      const response = await fetch(`/api/admin/customers?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value && value !== '')
        ),
      });

      const response = await fetch(
        `/api/admin/customers/export?${queryParams}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export customers:', error);
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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define contextual tabs following ADMIN_LAYOUT_STANDARD.md for Customers
  const tabs: TabConfig[] = [
    { id: 'directory', label: 'Directory', href: '/admin/customers' },
    { id: 'membership', label: 'Membership', href: '/admin/membership' },
    { id: 'referrals', label: 'Referrals', href: '/admin/member-promotions' },
  ];

  // Extract page actions
  const pageActions = (
    <Button onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      Export Customers
    </Button>
  );

  // Extract filters component
  const filtersComponent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search customers..."
          value={filters.search || ''}
          onChange={e =>
            setFilters(prev => ({ ...prev, search: e.target.value }))
          }
          className="pl-10"
        />
      </div>
      <Select
        value={filters.membership || ''}
        onValueChange={value =>
          setFilters(prev => ({
            ...prev,
            membership: value === 'all' ? '' : value,
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Membership Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          <SelectItem value="members">Members Only</SelectItem>
          <SelectItem value="non-members">Non-Members</SelectItem>
        </SelectContent>
      </Select>
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
          <SelectValue placeholder="Account Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // Define breadcrumbs to show location
  const breadcrumbs: BreadcrumbItem[] = [BREADCRUMB_CONFIGS.customers.main];

  return (
    <AdminPageLayout
      title="Customer Management"
      subtitle="Manage customer accounts and membership status"
      actions={pageActions}
      tabs={tabs}
      filters={filtersComponent}
      breadcrumbs={breadcrumbs}
      loading={loading}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {customers.filter(c => c.isMember).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? (
                    customers.reduce((sum, c) => sum + c.totalOrders, 0) /
                    customers.length
                  ).toFixed(1)
                : '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Crown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({pagination.total})</CardTitle>
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
                      <th className="text-left py-3">Customer</th>
                      <th className="text-left py-3">Contact</th>
                      <th className="text-left py-3">Membership</th>
                      <th className="text-left py-3">Orders</th>
                      <th className="text-left py-3">Total Spent</th>
                      <th className="text-left py-3">Last Order</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr
                        key={customer.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {customer.firstName} {customer.lastName}
                                {customer.isMember && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Joined{' '}
                                {new Date(
                                  customer.createdAt
                                ).toLocaleDateString('en-MY')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          {customer.isMember ? (
                            <div>
                              <Badge className="bg-yellow-100 text-yellow-800 mb-1">
                                Member
                              </Badge>
                              {customer.memberSince && (
                                <div className="text-xs text-gray-500">
                                  Since{' '}
                                  {new Date(
                                    customer.memberSince
                                  ).toLocaleDateString('en-MY')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">Regular</Badge>
                          )}
                        </td>
                        <td className="py-3 font-medium">
                          {customer.totalOrders}
                        </td>
                        <td className="py-3 font-medium">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="py-3">
                          {customer.lastOrderAt ? (
                            <div className="text-sm">
                              {new Date(
                                customer.lastOrderAt
                              ).toLocaleDateString('en-MY')}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No orders
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/customers/${customer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={`/admin/customers/${customer.id}/edit`}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {customers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found matching your criteria
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
                    of {pagination.total} customers
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
    </AdminPageLayout>
  );
}
