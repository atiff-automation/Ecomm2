/**
 * Create Discount Code Page - JRM E-commerce Platform
 * Form for creating new discount codes and coupons
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Ticket,
  Save,
  AlertCircle,
  CheckCircle2,
  Crown,
  Percent,
  DollarSign,
  Truck,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface CreateDiscountCodeForm {
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  memberOnly: boolean;
  usageLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isPublic: boolean;
}

export default function CreateDiscountCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<CreateDiscountCodeForm>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minimumOrderValue: undefined,
    maximumDiscount: undefined,
    memberOnly: false,
    usageLimit: undefined,
    startsAt: new Date(),
    expiresAt: undefined,
    isPublic: true,
  });

  const [errors, setErrors] = useState<Partial<CreateDiscountCodeForm>>({});

  // Redirect if not authenticated or not admin/staff
  React.useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin/discount-codes/create');
      return;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleInputChange = (
    field: keyof CreateDiscountCodeForm,
    value: string | number | boolean | Date | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const generateDiscountCode = () => {
    const prefix = formData.memberOnly ? 'MEMBER' : 'PROMO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const validateForm = () => {
    const newErrors: Partial<CreateDiscountCodeForm> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Discount code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Code must be at least 3 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code can only contain uppercase letters and numbers';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (
      formData.discountType === 'PERCENTAGE' &&
      formData.discountValue > 100
    ) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }

    if (formData.minimumOrderValue && formData.minimumOrderValue < 0) {
      newErrors.minimumOrderValue = 'Minimum order value cannot be negative';
    }

    if (formData.maximumDiscount && formData.maximumDiscount <= 0) {
      newErrors.maximumDiscount = 'Maximum discount must be greater than 0';
    }

    if (formData.usageLimit && formData.usageLimit <= 0) {
      newErrors.usageLimit = 'Usage limit must be greater than 0';
    }

    if (
      formData.expiresAt &&
      formData.startsAt &&
      formData.expiresAt <= formData.startsAt
    ) {
      newErrors.expiresAt = 'Expiry date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startsAt: formData.startsAt?.toISOString(),
          expiresAt: formData.expiresAt?.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Discount code "${formData.code}" created successfully!`,
        });

        // Reset form
        setFormData({
          code: '',
          name: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          minimumOrderValue: undefined,
          maximumDiscount: undefined,
          memberOnly: false,
          usageLimit: undefined,
          startsAt: new Date(),
          expiresAt: undefined,
          isPublic: true,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to create discount code',
        });
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create discount code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getDiscountIcon = () => {
    switch (formData.discountType) {
      case 'PERCENTAGE':
        return <Percent className="h-5 w-5" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-5 w-5" />;
      case 'FREE_SHIPPING':
        return <Truck className="h-5 w-5" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Membership', href: '/admin/membership' },
          { label: 'Discount Codes', href: '/admin/discount-codes' },
          { label: 'Create' },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Ticket className="h-8 w-8 text-purple-600" />
              Create Discount Code
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new discount code or coupon for your store
            </p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <Alert
          className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Discount Code Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Discount Code *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={e =>
                            handleInputChange(
                              'code',
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="SUMMER2024"
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            handleInputChange('code', generateDiscountCode())
                          }
                        >
                          Generate
                        </Button>
                      </div>
                      {errors.code && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.code}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e =>
                          handleInputChange('name', e.target.value)
                        }
                        placeholder="Summer Sale 2024"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Get 20% off all summer items"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Discount Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Discount Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountType">Discount Type *</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={value =>
                          handleInputChange(
                            'discountType',
                            value as
                              | 'PERCENTAGE'
                              | 'FIXED_AMOUNT'
                              | 'FREE_SHIPPING'
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Percentage Off
                            </div>
                          </SelectItem>
                          <SelectItem value="FIXED_AMOUNT">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Fixed Amount Off
                            </div>
                          </SelectItem>
                          <SelectItem value="FREE_SHIPPING">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Free Shipping
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.discountType !== 'FREE_SHIPPING' && (
                      <div>
                        <Label htmlFor="discountValue">
                          Discount Value *{' '}
                          {formData.discountType === 'PERCENTAGE'
                            ? '(%)'
                            : '(RM)'}
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          step="0.01"
                          min="0"
                          max={
                            formData.discountType === 'PERCENTAGE'
                              ? '100'
                              : undefined
                          }
                          value={formData.discountValue}
                          onChange={e =>
                            handleInputChange(
                              'discountValue',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder={
                            formData.discountType === 'PERCENTAGE'
                              ? '20'
                              : '50.00'
                          }
                        />
                        {errors.discountValue && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.discountValue}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minimumOrderValue">
                        Minimum Order Value (RM)
                      </Label>
                      <Input
                        id="minimumOrderValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minimumOrderValue || ''}
                        onChange={e =>
                          handleInputChange(
                            'minimumOrderValue',
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="100.00 (optional)"
                      />
                      {errors.minimumOrderValue && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.minimumOrderValue}
                        </p>
                      )}
                    </div>

                    {formData.discountType === 'PERCENTAGE' && (
                      <div>
                        <Label htmlFor="maximumDiscount">
                          Maximum Discount (RM)
                        </Label>
                        <Input
                          id="maximumDiscount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.maximumDiscount || ''}
                          onChange={e =>
                            handleInputChange(
                              'maximumDiscount',
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          placeholder="200.00 (optional)"
                        />
                        {errors.maximumDiscount && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.maximumDiscount}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage & Dates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Usage & Validity</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usageLimit">Usage Limit</Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        min="1"
                        value={formData.usageLimit || ''}
                        onChange={e =>
                          handleInputChange(
                            'usageLimit',
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined
                          )
                        }
                        placeholder="Unlimited"
                      />
                      {errors.usageLimit && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.usageLimit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <DatePicker
                        date={formData.startsAt}
                        onDateChange={date =>
                          handleInputChange('startsAt', date)
                        }
                        placeholder="Select start date"
                      />
                    </div>

                    <div>
                      <Label>Expiry Date</Label>
                      <DatePicker
                        date={formData.expiresAt}
                        onDateChange={date =>
                          handleInputChange('expiresAt', date)
                        }
                        placeholder="No expiry (optional)"
                      />
                      {errors.expiresAt && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.expiresAt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="memberOnly"
                        checked={formData.memberOnly}
                        onCheckedChange={checked =>
                          handleInputChange('memberOnly', checked)
                        }
                      />
                      <Label
                        htmlFor="memberOnly"
                        className="flex items-center gap-2"
                      >
                        <Crown className="h-4 w-4 text-purple-600" />
                        Member-only discount
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={checked =>
                          handleInputChange('isPublic', checked)
                        }
                      />
                      <Label htmlFor="isPublic">
                        Public discount code (customers can search and find this
                        code)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button type="submit" disabled={loading} className="min-w-32">
                    {loading ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Discount Code
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getDiscountIcon()}
                  <span className="font-mono font-bold text-lg">
                    {formData.code || 'CODE'}
                  </span>
                  {formData.memberOnly && (
                    <Crown className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <h3 className="font-semibold">
                  {formData.name || 'Discount Name'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.description || 'Discount description'}
                </p>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Discount:</strong>{' '}
                      {formData.discountType === 'FREE_SHIPPING'
                        ? 'Free Shipping'
                        : formData.discountType === 'PERCENTAGE'
                          ? `${formData.discountValue}% off`
                          : `RM${formData.discountValue} off`}
                    </p>
                    {formData.minimumOrderValue && (
                      <p>
                        <strong>Min. order:</strong> RM
                        {formData.minimumOrderValue}
                      </p>
                    )}
                    {formData.maximumDiscount && (
                      <p>
                        <strong>Max. discount:</strong> RM
                        {formData.maximumDiscount}
                      </p>
                    )}
                    {formData.usageLimit && (
                      <p>
                        <strong>Usage limit:</strong> {formData.usageLimit} uses
                      </p>
                    )}
                    {formData.expiresAt && (
                      <p>
                        <strong>Expires:</strong>{' '}
                        {formData.expiresAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
