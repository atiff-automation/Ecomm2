'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSection,
  SettingsSwitch,
  SettingsSelect,
  SettingsFormActions,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { notificationPreferencesSchema } from '@/lib/validation/settings';
import type { NotificationPreferencesData } from '@/lib/validation/settings';
import {
  Shield,
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Download,
  Trash2,
} from 'lucide-react';

export default function PrivacySettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<NotificationPreferencesData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailNotifications: {
        orderConfirmation: true,
        orderStatusUpdate: true,
        shippingUpdate: true,
        deliveryUpdate: true,
        paymentConfirmation: true,
        promotionalOffers: false,
        memberBenefits: true,
        newsletter: false,
      },
      smsNotifications: {
        orderConfirmation: false,
        shippingUpdate: false,
        deliveryUpdate: false,
      },
      marketingCommunications: false,
      language: 'en',
    },
  });

  const watchedValues = watch();

  // Load current preferences
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          reset(data.data);
        }
      } else {
        console.error('Failed to load notification preferences');
      }
    } catch (error) {
      console.error('Load preferences error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async (data: NotificationPreferencesData) => {
    if (!session?.user?.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preferences');
      }

      toast.success('Privacy settings updated successfully');
      reset(data); // Reset form dirty state
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update preferences'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/settings/export', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to request data export');
      }

      toast.success(
        'Data export request submitted. You will receive an email when ready.'
      );
    } catch (error) {
      console.error('Export data error:', error);
      toast.error('Failed to request data export');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to request account deletion? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to request account deletion');
      }

      toast.success(
        'Account deletion request submitted. Our team will contact you shortly.'
      );
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to request account deletion');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        Loading privacy settings...
      </div>
    );
  }

  return (
    <SettingsLayout
      title="Privacy Settings"
      subtitle="Manage your privacy preferences and notification settings"
    >
      <form
        onSubmit={handleSubmit(handleSavePreferences)}
        className="space-y-6"
      >
        {/* Email Notifications */}
        <SettingsCard
          title="Email Notifications"
          description="Choose what email notifications you'd like to receive"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Order & Account Notifications</h3>
            </div>

            <div className="space-y-4 ml-8">
              <SettingsSwitch
                label="Order Confirmation"
                description="Receive confirmation emails when you place an order"
                checked={watchedValues.emailNotifications?.orderConfirmation}
                onCheckedChange={checked =>
                  setValue('emailNotifications.orderConfirmation', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Order Status Updates"
                description="Get notified when your order status changes"
                checked={watchedValues.emailNotifications?.orderStatusUpdate}
                onCheckedChange={checked =>
                  setValue('emailNotifications.orderStatusUpdate', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Shipping Updates"
                description="Notifications when your order ships"
                checked={watchedValues.emailNotifications?.shippingUpdate}
                onCheckedChange={checked =>
                  setValue('emailNotifications.shippingUpdate', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Delivery Updates"
                description="Notifications when your order is delivered"
                checked={watchedValues.emailNotifications?.deliveryUpdate}
                onCheckedChange={checked =>
                  setValue('emailNotifications.deliveryUpdate', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Payment Confirmation"
                description="Receive confirmation when payments are processed"
                checked={watchedValues.emailNotifications?.paymentConfirmation}
                onCheckedChange={checked =>
                  setValue('emailNotifications.paymentConfirmation', checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            <div className="flex items-center space-x-3 mt-6 mb-4">
              <Bell className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Marketing & Promotions</h3>
            </div>

            <div className="space-y-4 ml-8">
              <SettingsSwitch
                label="Promotional Offers"
                description="Receive emails about special offers and discounts"
                checked={watchedValues.emailNotifications?.promotionalOffers}
                onCheckedChange={checked =>
                  setValue('emailNotifications.promotionalOffers', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Member Benefits"
                description="Information about your membership benefits and rewards"
                checked={watchedValues.emailNotifications?.memberBenefits}
                onCheckedChange={checked =>
                  setValue('emailNotifications.memberBenefits', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Newsletter"
                description="Monthly newsletter with product updates and company news"
                checked={watchedValues.emailNotifications?.newsletter}
                onCheckedChange={checked =>
                  setValue('emailNotifications.newsletter', checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>
          </div>
        </SettingsCard>

        {/* SMS Notifications */}
        <SettingsCard
          title="SMS Notifications"
          description="Receive important updates via SMS (charges may apply)"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium">SMS Alerts</h3>
            </div>

            <div className="space-y-4 ml-8">
              <SettingsSwitch
                label="Order Confirmation"
                description="SMS confirmation when you place an order"
                checked={watchedValues.smsNotifications?.orderConfirmation}
                onCheckedChange={checked =>
                  setValue('smsNotifications.orderConfirmation', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Shipping Updates"
                description="SMS notifications when your order ships"
                checked={watchedValues.smsNotifications?.shippingUpdate}
                onCheckedChange={checked =>
                  setValue('smsNotifications.shippingUpdate', checked, {
                    shouldDirty: true,
                  })
                }
              />

              <SettingsSwitch
                label="Delivery Updates"
                description="SMS notifications when your order is delivered"
                checked={watchedValues.smsNotifications?.deliveryUpdate}
                onCheckedChange={checked =>
                  setValue('smsNotifications.deliveryUpdate', checked, {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> SMS notifications are sent to the phone
                number in your account. Standard SMS rates from your carrier may
                apply.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* General Preferences */}
        <SettingsCard
          title="General Preferences"
          description="Language and communication preferences"
        >
          <div className="space-y-4">
            <SettingsSelect
              label="Language Preference"
              options={[
                { value: 'en', label: 'English' },
                { value: 'ms', label: 'Bahasa Malaysia' },
              ]}
              value={watchedValues.language}
              onValueChange={value =>
                setValue('language', value as 'en' | 'ms', {
                  shouldDirty: true,
                })
              }
              placeholder="Select language"
              helperText="Choose your preferred language for emails and communications"
            />

            <SettingsSwitch
              label="Marketing Communications"
              description="Allow us to send you marketing communications via email and SMS"
              checked={watchedValues.marketingCommunications}
              onCheckedChange={checked =>
                setValue('marketingCommunications', checked, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        </SettingsCard>

        {/* Save Settings */}
        <SettingsFormActions>
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSubmitting}
            onClick={() => loadNotificationPreferences()}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </SettingsFormActions>
      </form>

      {/* Data Privacy Actions */}
      <SettingsCard
        title="Data Privacy"
        description="Manage your personal data and privacy rights"
      >
        <SettingsSection title="Your Data Rights">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-gray-500">
                    Download a copy of your personal data, including orders,
                    addresses, and preferences
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Request Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center space-x-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">
                    Delete Your Account
                  </h4>
                  <p className="text-sm text-red-700">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Request Deletion
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Privacy Information">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">
                  We Protect Your Privacy
                </h4>
                <p className="text-sm text-gray-600">
                  Your personal information is encrypted and securely stored. We
                  never sell your data to third parties.
                </p>
                <p className="text-sm text-gray-600">
                  For more information, please review our{' '}
                  <a
                    href="/legal/privacy"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a
                    href="/legal/terms"
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>
      </SettingsCard>
    </SettingsLayout>
  );
}
