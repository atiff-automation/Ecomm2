/**
 * toyyibPay Payment Gateway Configuration Page
 * Admin interface for managing toyyibPay credentials and settings
 * Following the same pattern as the shipping configuration page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Save,
  Info,
  Key,
  Eye,
  EyeOff,
  Building,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  AdminPageLayout,
  TabConfig,
  BreadcrumbItem,
} from '@/components/admin/layout';
import { toast } from 'sonner';

interface ToyyibPayCredentialStatus {
  hasCredentials: boolean;
  environment: 'sandbox' | 'production';
  userSecretKeyMasked?: string;
  categoryCode?: string;
  lastUpdated?: string;
  updatedBy?: string;
  isConfigured: boolean;
}

interface CategoryInfo {
  categoryCode?: string;
  categoryName?: string;
  categoryDescription?: string;
}

export default function ToyyibPayConfigPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // State for credentials
  const [credentialStatus, setCredentialStatus] =
    useState<ToyyibPayCredentialStatus>({
      hasCredentials: false,
      environment: 'sandbox',
      isConfigured: false,
    });

  // Form state
  const [formData, setFormData] = useState({
    userSecretKey: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    categoryCode: '',
  });

  // Category management
  const [categories, setCategories] = useState<CategoryInfo>({});
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Authentication check
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/signin');
  }

  // Load initial data
  useEffect(() => {
    loadCredentialStatus();
    loadCurrentCategory();
  }, []);

  const loadCredentialStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment/toyyibpay/credentials');
      const data = await response.json();

      if (data.success) {
        setCredentialStatus(data.status);
        setFormData(prev => ({
          ...prev,
          environment: data.status.environment || 'sandbox',
          categoryCode: data.status.categoryCode || '',
        }));
      } else {
        toast.error('Failed to load credential status');
      }
    } catch (error) {
      console.error('Error loading credential status:', error);
      toast.error('Failed to load credential status');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentCategory = async () => {
    try {
      const response = await fetch('/api/admin/payment/toyyibpay/categories');
      const data = await response.json();

      if (data.success) {
        setCategories({
          categoryCode: data.currentCategory,
        });
      }
    } catch (error) {
      console.error('Error loading category info:', error);
    }
  };

  const handleSaveCredentials = async () => {
    if (!formData.userSecretKey.trim()) {
      toast.error('Please enter your toyyibPay User Secret Key');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/payment/toyyibpay/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSecretKey: formData.userSecretKey,
          environment: formData.environment,
          categoryCode: formData.categoryCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Credentials saved and validated successfully!');
        setCredentialStatus(data.status);
        setFormData(prev => ({ ...prev, userSecretKey: '' })); // Clear the input
        loadCurrentCategory(); // Reload category info
      } else {
        toast.error(data.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchEnvironment = async (
    newEnvironment: 'sandbox' | 'production'
  ) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payment/toyyibpay/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: newEnvironment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Environment switched to ${newEnvironment}`);
        setCredentialStatus(data.status);
        setFormData(prev => ({ ...prev, environment: newEnvironment }));
      } else {
        toast.error(data.error || 'Failed to switch environment');
      }
    } catch (error) {
      console.error('Error switching environment:', error);
      toast.error('Failed to switch environment');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCredentials = async () => {
    if (
      !confirm(
        'Are you sure you want to clear all toyyibPay credentials? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/payment/toyyibpay/credentials', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Credentials cleared successfully');
        setCredentialStatus(data.status);
        setFormData({
          userSecretKey: '',
          environment: 'sandbox',
          categoryCode: '',
        });
      } else {
        toast.error(data.error || 'Failed to clear credentials');
      }
    } catch (error) {
      console.error('Error clearing credentials:', error);
      toast.error('Failed to clear credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      toast.error('Please enter category name and description');
      return;
    }

    try {
      setCreatingCategory(true);
      const response = await fetch('/api/admin/payment/toyyibpay/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName: newCategory.name,
          categoryDescription: newCategory.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Category created: ${data.categoryCode}`);
        setNewCategory({ name: '', description: '' });
        loadCurrentCategory();
      } else {
        toast.error(data.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading toyyibPay configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Define contextual tabs for toyyibPay gateway configuration
  // Note: Using internal Tabs component for content switching, not top navigation tabs
  const tabs: TabConfig[] = [];

  // Extract page actions
  const pageActions = (
    <div className="flex items-center space-x-2">
      <Badge
        variant={credentialStatus.isConfigured ? 'default' : 'destructive'}
      >
        {credentialStatus.isConfigured ? 'Configured' : 'Not Configured'}
      </Badge>
      <Badge variant="outline">
        {credentialStatus.environment === 'sandbox' ? 'Sandbox' : 'Production'}
      </Badge>
    </div>
  );

  // Define breadcrumbs to show hierarchical location
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'toyyibPay', href: '/admin/payments/toyyibpay' },
  ];

  return (
    <AdminPageLayout
      title="toyyibPay Payment Gateway"
      subtitle="Configure and manage toyyibPay payment gateway integration"
      actions={pageActions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      parentSection={{ label: 'Payments', href: '/admin/payments' }}
      showBackButton={true}
      loading={loading}
    >
      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Credentials</span>
              </CardTitle>
              <CardDescription>
                Configure your toyyibPay API credentials. Credentials are
                encrypted and stored securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentialStatus.hasCredentials && (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Current Status:</strong>{' '}
                        {credentialStatus.isConfigured
                          ? 'Configured'
                          : 'Not Configured'}
                      </p>
                      <p>
                        <strong>Environment:</strong>{' '}
                        {credentialStatus.environment}
                      </p>
                      <p>
                        <strong>Secret Key:</strong>{' '}
                        {credentialStatus.userSecretKeyMasked}
                      </p>
                      {credentialStatus.lastUpdated && (
                        <p>
                          <strong>Last Updated:</strong>{' '}
                          {new Date(
                            credentialStatus.lastUpdated
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="userSecretKey">User Secret Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="userSecretKey"
                      type={showSecret ? 'text' : 'password'}
                      value={formData.userSecretKey}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          userSecretKey: e.target.value,
                        }))
                      }
                      placeholder="Enter your toyyibPay User Secret Key"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your secret key from toyyibPay merchant dashboard
                  </p>
                </div>

                <div>
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={value => {
                      if (credentialStatus.hasCredentials) {
                        handleSwitchEnvironment(
                          value as 'sandbox' | 'production'
                        );
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          environment: value as 'sandbox' | 'production',
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">
                        Production (Live)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.environment === 'sandbox'
                      ? 'Use sandbox for testing with fake transactions'
                      : 'Production environment for live payments'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="categoryCode">Category Code</Label>
                  <Input
                    id="categoryCode"
                    value={formData.categoryCode}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        categoryCode: e.target.value,
                      }))
                    }
                    placeholder="Enter toyyibPay category code (e.g., xxxx-xxxx-xxxx)"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Your toyyibPay category code from the merchant dashboard.
                    This is required for creating bills.
                  </p>
                  {credentialStatus.categoryCode && (
                    <p className="text-sm text-green-600 mt-1">
                      ✅ Current: {credentialStatus.categoryCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveCredentials}
                  disabled={saving || !formData.userSecretKey.trim()}
                  className="flex items-center space-x-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {credentialStatus.hasCredentials ? 'Update' : 'Save'}{' '}
                    Credentials
                  </span>
                </Button>

                {credentialStatus.hasCredentials && (
                  <Button
                    variant="destructive"
                    onClick={handleClearCredentials}
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Credentials</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Category Management</span>
              </CardTitle>
              <CardDescription>
                Manage toyyibPay categories for organizing your bills and
                payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!credentialStatus.hasCredentials ? (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Please configure your API credentials first before managing
                    categories.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {categories.categoryCode && (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        <p>
                          <strong>Current Default Category:</strong>{' '}
                          {categories.categoryCode}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Create New Category</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          value={newCategory.name}
                          onChange={e =>
                            setNewCategory(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="e.g., JRM Ecommerce Payments"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryDescription">
                          Category Description
                        </Label>
                        <Textarea
                          id="categoryDescription"
                          value={newCategory.description}
                          onChange={e =>
                            setNewCategory(prev => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Description for this payment category"
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateCategory}
                      disabled={
                        creatingCategory ||
                        !newCategory.name.trim() ||
                        !newCategory.description.trim()
                      }
                      className="flex items-center space-x-2"
                    >
                      {creatingCategory ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>Create Category</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
      </div>
    </AdminPageLayout>
  );
}
