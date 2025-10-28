'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Crown } from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
  BreadcrumbItem,
  BREADCRUMB_CONFIGS,
} from '@/components/admin/layout';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  isMember: boolean;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  isMember: boolean;
  memberSince: string | null;
}

export default function AdminCustomerEdit({
  params,
}: {
  params: { customerId: string };
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    isMember: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${params.customerId}`);
      if (response.ok) {
        const data = await response.json();
        const customerData = data.customer;
        setCustomer(customerData);
        setFormData({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone || '',
          status: customerData.status,
          isMember: customerData.isMember,
        });
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

  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithCSRF(
        `/api/admin/customers/${params.customerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            status: formData.status,
            isMember: formData.isMember,
          }),
        }
      );

      if (response.ok) {
        toast.success('Customer updated successfully');
        router.push(`/admin/customers/${params.customerId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update customer:', errorData);
        const errorMessage = errorData.message || 'Failed to update customer';
        toast.error(errorMessage);
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      const errorMessage = 'An unexpected error occurred';
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
    {
      label: 'Edit',
      href: `/admin/customers/${customer.id}/edit`,
    },
  ];

  // Page actions
  const pageActions = (
    <div className="flex items-center gap-2">
      {customer.isMember && <Crown className="h-5 w-5 text-yellow-500" />}
    </div>
  );

  return (
    <AdminPageLayout
      title="Edit Customer"
      subtitle={`${customer.firstName} ${customer.lastName} • ${customer.id}`}
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      parentSection={{ label: 'Customers', href: '/admin/customers' }}
      showBackButton={true}
      className="max-w-2xl mx-auto"
    >
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                  required
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                  required
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
                placeholder="+60123456789"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Account Status */}
            <div>
              <Label htmlFor="status">Account Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Membership Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Membership Status</Label>
                <p className="text-sm text-muted-foreground">
                  Grant or revoke membership privileges
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isMember}
                  onCheckedChange={checked =>
                    handleInputChange('isMember', checked)
                  }
                />
                <Crown
                  className={`h-5 w-5 ${formData.isMember ? 'text-yellow-500' : 'text-gray-400'}`}
                />
              </div>
            </div>

            {formData.isMember && !customer.isMember && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Granting membership status will apply
                  member pricing and benefits to this customer&apos;s future
                  orders.
                </p>
              </div>
            )}

            {!formData.isMember && customer.isMember && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> Removing membership status will
                  revoke member pricing and benefits. This action cannot be
                  undone automatically.
                </p>
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/admin/customers/${customer.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
