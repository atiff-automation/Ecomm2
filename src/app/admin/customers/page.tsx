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
  Eye,
  Edit,
  Mail,
  Phone,
  Crown,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
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

interface MembershipStats {
  memberConversionRate: number;
  retentionRate: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [membershipStats, setMembershipStats] = useState<MembershipStats>({
    memberConversionRate: 0,
    retentionRate: 0,
  });
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

      // Fetch customers and membership stats in parallel
      const [customersResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/customers?${queryParams}`),
        fetch('/api/admin/membership/stats'),
      ]);

      if (customersResponse.ok) {
        const data = await customersResponse.json();
        setCustomers(data.customers);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMembershipStats({
          memberConversionRate: statsData.stats.memberConversionRate,
          retentionRate: statsData.stats.retentionRate,
        });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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

  // Page actions with membership settings access
  const pageActions = (
    <Link href="/admin/membership/config">
      <Button size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Membership Settings
      </Button>
    </Link>
  );

  // Extract filters component
  const filtersComponent = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
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
        <SelectTrigger className="w-full sm:w-48">
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
        <SelectTrigger className="w-full sm:w-48">
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
      title="Customer & Membership Management"
      subtitle="Manage customer accounts, memberships, and program settings"
      actions={pageActions}
      filters={filtersComponent}
      breadcrumbs={breadcrumbs}
      loading={loading}
    >
      {/* Quick Stats - Very Compact Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <Card className="border-l-2 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Customers</p>
            <p className="text-lg font-bold">{pagination.total}</p>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-yellow-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="text-lg font-bold text-yellow-600">
              {customers.filter(c => c.isMember).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-gray-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Avg Orders</p>
            <p className="text-lg font-bold">
              {customers.length > 0
                ? (
                    customers.reduce((sum, c) => sum + c.totalOrders, 0) /
                    customers.length
                  ).toFixed(1)
                : '0'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Conversion</p>
            <p className="text-lg font-bold text-blue-600">
              {formatPercentage(membershipStats.memberConversionRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-purple-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Retention</p>
            <p className="text-lg font-bold text-purple-600">
              {formatPercentage(membershipStats.retentionRate)}
            </p>
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
