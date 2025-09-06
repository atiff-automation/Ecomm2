'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Settings,
  MapPin,
  CreditCard,
  Globe,
  Heart,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SettingsLayout } from '@/components/settings';

/**
 * Customer Preferences Page - Phase 2 Customer Settings
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 * 
 * Features from @SETTINGS_IMPLEMENTATION_GUIDE.md:
 * - Default shipping/billing addresses
 * - Preferred payment methods  
 * - Language preference (English/Malay)
 * - Wishlist privacy settings
 */

const preferencesSchema = z.object({
  defaultShippingAddressId: z.string().optional(),
  defaultBillingAddressId: z.string().optional(),
  preferredPaymentMethod: z.enum(['CREDIT_CARD', 'ONLINE_BANKING', 'EWALLET', 'BANK_TRANSFER']).optional(),
  language: z.enum(['en', 'ms']),
  currency: z.enum(['MYR']),
  timezone: z.string(),
  wishlistPrivacy: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS']),
  showRecentlyViewed: z.boolean(),
  enablePushNotifications: z.boolean(),
  autoApplyBestDiscount: z.boolean(),
  savePaymentMethods: z.boolean(),
  rememberShippingPreference: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface Address {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface UserPreferences extends PreferencesFormData {
  addresses: Address[];
}

export default function PreferencesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: 'en',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      wishlistPrivacy: 'PRIVATE',
      showRecentlyViewed: true,
      enablePushNotifications: true,
      autoApplyBestDiscount: true,
      savePaymentMethods: false,
      rememberShippingPreference: true,
    },
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchPreferences();
    }
  }, [session]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      
      const [preferencesRes, addressesRes] = await Promise.all([
        fetch('/api/settings/preferences'),
        fetch('/api/settings/addresses'),
      ]);

      if (preferencesRes.ok) {
        const preferencesData = await preferencesRes.json();
        if (preferencesData.success) {
          form.reset(preferencesData.data);
        }
      }

      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        if (addressesData.success) {
          setAddresses(addressesData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsLayout title="Preferences" subtitle="Customize your shopping experience">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
  const billingAddresses = addresses.filter(addr => addr.type === 'billing');

  return (
    <SettingsLayout title="Preferences" subtitle="Customize your shopping experience and account settings">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Default Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>Default Addresses</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set your preferred shipping and billing addresses
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Shipping Address */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="defaultShippingAddressId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Shipping Address</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shipping address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No default address</SelectItem>
                            {shippingAddresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                <div className="text-left">
                                  <div className="font-medium">
                                    {address.firstName} {address.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {address.addressLine1}, {address.city}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This address will be pre-selected during checkout
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Default Billing Address */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="defaultBillingAddressId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Billing Address</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select billing address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No default address</SelectItem>
                            {billingAddresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                <div className="text-left">
                                  <div className="font-medium">
                                    {address.firstName} {address.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {address.addressLine1}, {address.city}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This address will be used for invoicing and payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {addresses.length === 0 && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    You haven't added any addresses yet. Go to{' '}
                    <a href="/settings/account/addresses" className="font-medium text-primary hover:underline">
                      Address Management
                    </a>{' '}
                    to add your first address.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Payment & Shopping Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle>Payment & Shopping</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure your payment and shopping preferences
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="preferredPaymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No preference</SelectItem>
                          <SelectItem value="CREDIT_CARD">Credit/Debit Card</SelectItem>
                          <SelectItem value="ONLINE_BANKING">Online Banking (FPX)</SelectItem>
                          <SelectItem value="EWALLET">E-Wallet (GrabPay, Touch 'n Go)</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This payment method will be highlighted during checkout
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MYR">Malaysian Ringgit (RM)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        All prices will be displayed in this currency
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Shopping Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="autoApplyBestDiscount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Apply Best Discount</FormLabel>
                          <FormDescription>
                            Automatically apply the best available discount at checkout
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="savePaymentMethods"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Save Payment Methods</FormLabel>
                          <FormDescription>
                            Securely save payment methods for faster checkout
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberShippingPreference"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Remember Shipping Preference</FormLabel>
                          <FormDescription>
                            Remember your preferred shipping method and options
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language & Regional Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>Language & Region</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set your language and regional preferences
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Interface language for the website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Kuala_Lumpur">Malaysia (UTC+8)</SelectItem>
                          <SelectItem value="Asia/Singapore">Singapore (UTC+8)</SelectItem>
                          <SelectItem value="Asia/Bangkok">Thailand (UTC+7)</SelectItem>
                          <SelectItem value="Asia/Jakarta">Indonesia (UTC+7)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Used for order times and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Display Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle>Privacy & Display</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Control your privacy settings and what others can see
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="wishlistPrivacy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wishlist Privacy</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public - Anyone can view</SelectItem>
                          <SelectItem value="FRIENDS">Friends Only - Registered friends can view</SelectItem>
                          <SelectItem value="PRIVATE">Private - Only you can view</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control who can see your wishlist items
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Display Preferences</h4>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="showRecentlyViewed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Recently Viewed Products</FormLabel>
                          <FormDescription>
                            Display recently viewed products on your homepage
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enablePushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Browser Push Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications about orders, promotions, and updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div>
              {saveSuccess && (
                <Alert className="w-auto inline-flex items-center border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 ml-2">
                    Preferences saved successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsLayout>
  );
}