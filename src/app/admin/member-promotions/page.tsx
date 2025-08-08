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
import { Badge } from '@/components/ui/badge';
import { 
  Crown,
  Gift,
  Calendar,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MemberPromotionForm {
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  expiresAt?: string;
  autoApply: boolean;
}

const seasonalPromotions = [
  { key: 'NEW_YEAR', label: 'New Year Special', icon: '🎊' },
  { key: 'VALENTINE', label: 'Valentine\'s Day', icon: '💝' },
  { key: 'RAYA', label: 'Hari Raya', icon: '🌙' },
  { key: 'MERDEKA', label: 'Merdeka Day', icon: '🇲🇾' },
  { key: 'CHRISTMAS', label: 'Christmas', icon: '🎄' },
];

export default function AdminMemberPromotionsPage() {
  const [activeTab, setActiveTab] = useState<'custom' | 'seasonal'>('custom');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [customForm, setCustomForm] = useState<MemberPromotionForm>({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    autoApply: false,
  });

  const handleCustomFormChange = (field: keyof MemberPromotionForm, value: any) => {
    setCustomForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCustomPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/member-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Member promotion created successfully! Code: ${data.code}` });
        setCustomForm({
          name: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          autoApply: false,
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create promotion' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create promotion' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeasonalPromotion = async (season: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/member-promotions?type=seasonal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Seasonal promotion created successfully! Code: ${data.code}` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create seasonal promotion' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create seasonal promotion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Member Promotions</h1>
              <p className="text-gray-600">Create exclusive offers for your valued members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <Card className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
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
          variant={activeTab === 'seasonal' ? 'default' : 'outline'}
          onClick={() => setActiveTab('seasonal')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Seasonal Promotions
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
                      onChange={e => handleCustomFormChange('name', e.target.value)}
                      placeholder="e.g., VIP Member Flash Sale"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={customForm.description}
                      onChange={e => handleCustomFormChange('description', e.target.value)}
                      placeholder="Describe the promotion benefits..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label>Discount Type *</Label>
                    <Select
                      value={customForm.discountType}
                      onValueChange={value => handleCustomFormChange('discountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage Off</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount Off</SelectItem>
                        <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountValue">
                      Discount Value * 
                      {customForm.discountType === 'PERCENTAGE' ? ' (%)' : ' (RM)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step={customForm.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      min="0"
                      max={customForm.discountType === 'PERCENTAGE' ? '100' : undefined}
                      value={customForm.discountValue}
                      onChange={e => handleCustomFormChange('discountValue', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="minimumOrderValue">Minimum Order Value (RM)</Label>
                    <Input
                      id="minimumOrderValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customForm.minimumOrderValue || ''}
                      onChange={e => handleCustomFormChange('minimumOrderValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maximumDiscount">Maximum Discount (RM)</Label>
                    <Input
                      id="maximumDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customForm.maximumDiscount || ''}
                      onChange={e => handleCustomFormChange('maximumDiscount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Optional - for percentage discounts"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiresAt">Expiry Date</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={customForm.expiresAt || ''}
                      onChange={e => handleCustomFormChange('expiresAt', e.target.value || undefined)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoApply"
                      checked={customForm.autoApply}
                      onCheckedChange={checked => handleCustomFormChange('autoApply', checked)}
                    />
                    <Label htmlFor="autoApply">Auto-apply (no code needed)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
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

      {/* Seasonal Promotions */}
      {activeTab === 'seasonal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seasonal Member Promotions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Create pre-configured seasonal promotions for special occasions
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasonalPromotions.map((season) => (
                <Card key={season.key} className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{season.icon}</div>
                    <h3 className="font-semibold mb-2">{season.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a special member promotion for {season.label.toLowerCase()}
                    </p>
                    <Button
                      onClick={() => handleCreateSeasonalPromotion(season.key)}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      Create Promotion
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">About Seasonal Promotions</p>
                  <p>
                    Seasonal promotions come with pre-configured discount values, expiry dates, 
                    and descriptions tailored for Malaysian celebrations and holidays. They are 
                    automatically set as member-only promotions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}