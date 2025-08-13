/**
 * Admin Member Promotions Management - JRM E-commerce Platform
 * Create and manage member-exclusive promotions and seasonal offers
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import {
  Crown,
  Gift,
  Calendar,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface MemberPromotionForm {
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  startsAt?: Date;
  expiresAt?: Date;
  autoApply: boolean;
}

const quickTemplates = [
  {
    key: 'welcome',
    label: 'Welcome Bonus',
    icon: '👋',
    description: '15% off for new members',
    discountType: 'PERCENTAGE' as const,
    discountValue: 15,
    minimumOrderValue: 50,
  },
  {
    key: 'birthday',
    label: 'Birthday Special',
    icon: '🎂',
    description: '25% off birthday month',
    discountType: 'PERCENTAGE' as const,
    discountValue: 25,
    maximumDiscount: 100,
  },
  {
    key: 'loyalty',
    label: 'Loyalty Reward',
    icon: '⭐',
    description: 'RM50 off for VIP members',
    discountType: 'FIXED_AMOUNT' as const,
    discountValue: 50,
    minimumOrderValue: 200,
  },
  {
    key: 'flash',
    label: 'Flash Sale',
    icon: '⚡',
    description: '30% off limited time',
    discountType: 'PERCENTAGE' as const,
    discountValue: 30,
    maximumDiscount: 150,
  },
];

export default function AdminMemberPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'custom' | 'templates'>('custom');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [customForm, setCustomForm] = useState<MemberPromotionForm>({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    autoApply: false,
  });

  const handleCustomFormChange = (
    field: keyof MemberPromotionForm,
    value: string | number | boolean | Date | undefined
  ) => {
    setCustomForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCustomPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formDataToSubmit = {
        ...customForm,
        startsAt: customForm.startsAt?.toISOString(),
        expiresAt: customForm.expiresAt?.toISOString(),
      };

      const response = await fetch('/api/admin/member-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToSubmit),
      });

      const data = await response.json();

      if (response.ok) {
        const successText = customForm.autoApply
          ? `Member promotion created successfully! The discount will auto-apply for qualifying members.`
          : `Member promotion created successfully! Coupon Code: ${data.code}`;

        setMessage({
          type: 'success',
          text: successText,
        });
        setCustomForm({
          name: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          autoApply: false,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to create promotion',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to create promotion',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateKey: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const template = quickTemplates.find(t => t.key === templateKey);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create discount code using template data
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `${template.key.toUpperCase()}${Date.now().toString(36).toUpperCase()}`,
          name: template.label,
          description: template.description,
          discountType: template.discountType,
          discountValue: template.discountValue,
          minimumOrderValue: template.minimumOrderValue || undefined,
          maximumDiscount: template.maximumDiscount || undefined,
          memberOnly: true, // Templates are for member promotions
          isPublic: false,
          startsAt: new Date().toISOString(),
          // Set expiry to 30 days from now by default
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `${template.label} discount code created successfully! Code: ${data.code.code}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to create discount code from template',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to create discount code from template',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Membership', href: '/admin/membership' },
          { label: 'Member Promotions' },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Member Promotions</h1>
              <p className="text-gray-600">
                Create exclusive offers for your valued members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <Card
          className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }
              >
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'custom' ? 'default' : 'outline'}
          onClick={() => setActiveTab('custom')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Custom Promotion
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'default' : 'outline'}
          onClick={() => setActiveTab('templates')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Quick Templates
        </Button>
      </div>

      {/* Custom Promotion Form */}
      {activeTab === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Create Custom Member Promotion
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Design a personalized promotion exclusively for your members
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCustomPromotion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Promotion Name *</Label>
                    <Input
                      id="name"
                      value={customForm.name}
                      onChange={e =>
                        handleCustomFormChange('name', e.target.value)
                      }
                      placeholder="e.g., VIP Member Flash Sale"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={customForm.description}
                      onChange={e =>
                        handleCustomFormChange('description', e.target.value)
                      }
                      placeholder="Describe the promotion benefits..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Discount Type *</Label>
                    <Select
                      value={customForm.discountType}
                      onValueChange={value =>
                        handleCustomFormChange('discountType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">
                          Percentage Off
                        </SelectItem>
                        <SelectItem value="FIXED_AMOUNT">
                          Fixed Amount Off
                        </SelectItem>
                        <SelectItem value="FREE_SHIPPING">
                          Free Shipping
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountValue">
                      Discount Value *{' '}
                      {customForm.discountType === 'PERCENTAGE'
                        ? ' (%)'
                        : ' (RM)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step={
                        customForm.discountType === 'PERCENTAGE' ? '1' : '0.01'
                      }
                      min="0"
                      max={
                        customForm.discountType === 'PERCENTAGE'
                          ? '100'
                          : undefined
                      }
                      value={customForm.discountValue}
                      onChange={e =>
                        handleCustomFormChange(
                          'discountValue',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="minimumOrderValue">
                      Minimum Order Value (RM)
                    </Label>
                    <Input
                      id="minimumOrderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customForm.minimumOrderValue || ''}
                      onChange={e =>
                        handleCustomFormChange(
                          'minimumOrderValue',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maximumDiscount">
                      Maximum Discount (RM)
                    </Label>
                    <Input
                      id="maximumDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customForm.maximumDiscount || ''}
                      onChange={e =>
                        handleCustomFormChange(
                          'maximumDiscount',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="Optional - for percentage discounts"
                    />
                  </div>

                  <div>
                    <Label>Promotion Period</Label>
                    <CustomDateRangePicker
                      startDate={customForm.startsAt}
                      endDate={customForm.expiresAt}
                      onStartDateChange={date =>
                        handleCustomFormChange('startsAt', date)
                      }
                      onEndDateChange={date =>
                        handleCustomFormChange('expiresAt', date)
                      }
                      placeholder="Select promotion period"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoApply"
                        checked={customForm.autoApply}
                        onCheckedChange={checked =>
                          handleCustomFormChange('autoApply', checked)
                        }
                      />
                      <Label htmlFor="autoApply">
                        Auto-apply discount at checkout
                      </Label>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2 font-medium">How it works:</p>
                      {customForm.autoApply ? (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="flex items-center gap-2 text-blue-800">
                            <CheckCircle className="h-4 w-4" />
                            <strong>Auto-apply mode:</strong> Discount applies
                            automatically to qualifying members at checkout
                          </p>
                          <p className="text-blue-700 mt-1">
                            • No coupon code needed
                            <br />
                            • Private promotion (not shareable)
                            <br />• System applies discount based on member
                            status
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="flex items-center gap-2 text-amber-800">
                            <Gift className="h-4 w-4" />
                            <strong>Coupon code mode:</strong> System will
                            generate a unique coupon code
                          </p>
                          <p className="text-amber-700 mt-1">
                            • Members must enter the code at checkout
                            <br />
                            • Code can be shared among members
                            <br />• Example: MEMBERVIP1ABC2XYZ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    'Creating...'
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Member Promotion
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Quick Templates */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Discount Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Create member-exclusive discount codes using pre-configured
              templates
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickTemplates.map(template => (
                <Card
                  key={template.key}
                  className="border-2 hover:border-purple-300 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{template.icon}</div>
                        <div>
                          <h3 className="font-semibold">{template.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">
                          {template.discountType === 'PERCENTAGE'
                            ? `${template.discountValue}% off`
                            : `RM${template.discountValue} off`}
                        </span>
                      </div>
                      {template.minimumOrderValue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Min. order:</span>
                          <span className="font-medium">
                            RM{template.minimumOrderValue}
                          </span>
                        </div>
                      )}
                      {template.maximumDiscount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Max. discount:</span>
                          <span className="font-medium">
                            RM{template.maximumDiscount}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Member only:</span>
                        <span className="font-medium text-purple-600">
                          <Crown className="h-3 w-3 inline mr-1" />
                          Yes
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleCreateFromTemplate(template.key)}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Discount Code
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">How Templates Work</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Each template creates a unique discount code with 30-day
                      expiry
                    </li>
                    <li>
                      Codes are automatically set as member-only and private
                    </li>
                    <li>
                      Template values can be customized after creation if needed
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Gift className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Managing Discount Codes</p>
                    <p>
                      All created discount codes are managed in the
                      comprehensive discount codes system. You can view usage,
                      modify settings, and track performance there.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/admin/discount-codes', '_blank')}
                  className="ml-4"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Manage All Codes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
