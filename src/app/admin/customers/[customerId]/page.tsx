'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Crown,
  Calendar,
  ShoppingBag,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

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
  addresses: Address[];
  orders: Order[];
}

interface Address {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function AdminCustomerView({
  params,
}: {
  params: { customerId: string };
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${params.customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      } else {
        console.error('Customer not found');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  }, [params.customerId, router]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${customer?.firstName} ${customer?.lastName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetchWithCSRF(`/api/admin/customers/${params.customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Customer deleted successfully');
        router.push('/admin/customers');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete customer:', errorData);
        toast.error(errorData.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
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

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            Customer not found
          </h2>
          <p className="text-gray-600 mt-2">
            The customer you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/admin/customers">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Define breadcrumbs to show hierarchical location
  const breadcrumbs: BreadcrumbItem[] = [
    BREADCRUMB_CONFIGS.customers.main,
    {
      label: `${customer.firstName} ${customer.lastName}`,
      href: `/admin/customers/${customer.id}`,
    },
  ];

  // Page actions
  const pageActions = (
    <div className="flex items-center gap-2">
      <Link href={`/admin/customers/${customer.id}/edit`}>
        <Button size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Customer
        </Button>
      </Link>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
      <Badge className={getStatusColor(customer.status)}>
        {customer.status}
      </Badge>
    </div>
  );

  return (
    <AdminPageLayout
      title={`${customer.firstName} ${customer.lastName}`}
      subtitle={`Customer ID: ${customer.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      parentSection={{ label: 'Customers', href: '/admin/customers' }}
      className="max-w-4xl mx-auto"
    >
      {/* Member Badge */}
      {customer.isMember && (
        <div className="mb-6 flex items-center gap-2 text-yellow-600">
          <Crown className="h-5 w-5" />
          <span className="font-medium">VIP Member</span>
          {customer.memberSince && (
            <span className="text-sm text-gray-600">
              since {new Date(customer.memberSince).toLocaleDateString('en-MY')}
            </span>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(customer.totalSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customer.memberSince
                ? new Date(customer.memberSince).toLocaleDateString('en-MY')
                : 'Not a member'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>

            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Joined</p>
                <p className="font-medium">
                  {new Date(customer.createdAt).toLocaleDateString('en-MY')}
                </p>
              </div>
            </div>

            {customer.lastOrderAt && (
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Order</p>
                  <p className="font-medium">
                    {new Date(customer.lastOrderAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map(address => (
                  <div key={address.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        {address.isDefault && (
                          <Badge variant="outline" className="mb-2">
                            Default
                          </Badge>
                        )}
                        <p className="font-medium">{address.addressLine1}</p>
                        {address.addressLine2 && (
                          <p className="text-gray-600">
                            {address.addressLine2}
                          </p>
                        )}
                        <p className="text-gray-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No addresses on file</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders && customer.orders.length > 0 ? (
            <div className="space-y-4">
              {customer.orders.slice(0, 10).map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getOrderStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No orders found</p>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
