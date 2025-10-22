'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  BarChart3,
  Bell,
  Clock,
  DollarSign,
  Layout,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { SettingsLayout } from '@/components/settings';

/**
 * Admin Preferences Page - Phase 3 Admin Settings
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 *
 * Features from @SETTINGS_IMPLEMENTATION_GUIDE.md:
 * - Dashboard layout preferences
 * - Default filters and views
 * - Notification preferences
 * - System preferences (timezone, currency)
 */

const adminPreferencesSchema = z.object({
  // Dashboard Layout
  dashboardLayout: z.enum(['COMPACT', 'DETAILED', 'CARDS']),
  showWelcomeMessage: z.boolean(),
  showQuickStats: z.boolean(),
  showRecentActivity: z.boolean(),

  // Default Views and Filters
  defaultOrdersView: z.enum(['ALL', 'PENDING', 'PROCESSING', 'SHIPPED']),
  defaultProductsView: z.enum(['GRID', 'LIST']),
  itemsPerPage: z.number().min(10).max(100),
  enableAutoRefresh: z.boolean(),
  autoRefreshInterval: z.number().min(30).max(300), // seconds

  // Notifications
  emailNotifications: z.object({
    newOrders: z.boolean(),
    lowStock: z.boolean(),
    paymentIssues: z.boolean(),
    systemAlerts: z.boolean(),
    dailySummary: z.boolean(),
  }),

  desktopNotifications: z.boolean(),
  notificationSounds: z.boolean(),

  // System Preferences
  timezone: z.string(),
  currency: z.enum(['MYR']),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  language: z.enum(['en', 'ms']),

  // Advanced Settings
  enableDeveloperMode: z.boolean(),
  showSystemLogs: z.boolean(),
  enableApiLogging: z.boolean(),
});

type AdminPreferencesFormData = z.infer<typeof adminPreferencesSchema>;

export default function AdminPreferencesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<AdminPreferencesFormData>({
    resolver: zodResolver(adminPreferencesSchema),
    defaultValues: {
      // Dashboard Layout Defaults
      dashboardLayout: 'DETAILED',
      showWelcomeMessage: true,
      showQuickStats: true,
      showRecentActivity: true,

      // Default Views Defaults
      defaultOrdersView: 'ALL',
      defaultProductsView: 'GRID',
      itemsPerPage: 25,
      enableAutoRefresh: false,
      autoRefreshInterval: 60,

      // Notifications Defaults
      emailNotifications: {
        newOrders: true,
        lowStock: true,
        paymentIssues: true,
        systemAlerts: true,
        dailySummary: false,
      },
      desktopNotifications: true,
      notificationSounds: false,

      // System Preferences Defaults
      timezone: 'Asia/Kuala_Lumpur',
      currency: 'MYR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'en',

      // Advanced Settings Defaults
      enableDeveloperMode: false,
      showSystemLogs: false,
      enableApiLogging: false,
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
      const response = await fetch('/api/admin/settings/preferences');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          form.reset(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching admin preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AdminPreferencesFormData) => {
    try {
      setSaving(true);
      const response = await fetchWithCSRF('/api/admin/settings/preferences', {
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
      console.error('Error saving admin preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsLayout
        title="Admin Preferences"
        subtitle="Configure your admin dashboard preferences"
      >
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

  return (
    <SettingsLayout
      title="Admin Preferences"
      subtitle="Configure your admin dashboard and system preferences"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dashboard Layout */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Layout className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>Dashboard Layout</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize how your admin dashboard appears
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dashboardLayout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dashboard Style</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COMPACT">
                            Compact - Dense information
                          </SelectItem>
                          <SelectItem value="DETAILED">
                            Detailed - Full information cards
                          </SelectItem>
                          <SelectItem value="CARDS">
                            Cards - Visual card layout
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the overall layout style for your dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Dashboard Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="showWelcomeMessage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Welcome Message
                          </FormLabel>
                          <FormDescription>
                            Show personalized welcome message on dashboard
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showQuickStats"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Quick Statistics
                          </FormLabel>
                          <FormDescription>
                            Display summary statistics cards at the top
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showRecentActivity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Recent Activity
                          </FormLabel>
                          <FormDescription>
                            Show recent orders and system activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Views and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Filter className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle>Default Views & Filters</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set your preferred default views for different sections
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="defaultOrdersView"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Orders View</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALL">All Orders</SelectItem>
                          <SelectItem value="PENDING">
                            Pending Orders
                          </SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultProductsView"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Products View</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GRID">Grid View</SelectItem>
                          <SelectItem value="LIST">List View</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemsPerPage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Items per Page</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="10">10 items</SelectItem>
                          <SelectItem value="25">25 items</SelectItem>
                          <SelectItem value="50">50 items</SelectItem>
                          <SelectItem value="100">100 items</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enableAutoRefresh"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Auto Refresh
                        </FormLabel>
                        <FormDescription>
                          Automatically refresh data on dashboard
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('enableAutoRefresh') && (
                <FormField
                  control={form.control}
                  name="autoRefreshInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto Refresh Interval</FormLabel>
                      <Select
                        onValueChange={value => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full md:w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                          <SelectItem value="300">5 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often to refresh dashboard data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-yellow-600" />
                <div>
                  <CardTitle>Notification Preferences</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure how and when you receive notifications
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Email Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emailNotifications.newOrders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            New Orders
                          </FormLabel>
                          <FormDescription>
                            Get notified when new orders are placed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications.lowStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Low Stock Alerts
                          </FormLabel>
                          <FormDescription>
                            Get notified when products are running low
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications.paymentIssues"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Payment Issues
                          </FormLabel>
                          <FormDescription>
                            Get notified about payment failures or issues
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications.systemAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            System Alerts
                          </FormLabel>
                          <FormDescription>
                            Get notified about system issues or maintenance
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications.dailySummary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Daily Summary
                          </FormLabel>
                          <FormDescription>
                            Receive daily business summary reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="desktopNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Browser Notifications
                        </FormLabel>
                        <FormDescription>
                          Show browser notifications for important events
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificationSounds"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Notification Sounds
                        </FormLabel>
                        <FormDescription>
                          Play sounds for notifications and alerts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>System Preferences</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure system settings and regional preferences
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Kuala_Lumpur">
                            Malaysia (UTC+8)
                          </SelectItem>
                          <SelectItem value="Asia/Singapore">
                            Singapore (UTC+8)
                          </SelectItem>
                          <SelectItem value="Asia/Bangkok">
                            Thailand (UTC+7)
                          </SelectItem>
                          <SelectItem value="Asia/Jakarta">
                            Indonesia (UTC+7)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MYR">
                            Malaysian Ringgit (RM)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-red-600" />
                <div>
                  <CardTitle>Advanced Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Advanced options for power users and developers
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enableDeveloperMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Developer Mode
                        </FormLabel>
                        <FormDescription>
                          Enable advanced debugging and development features
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showSystemLogs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Show System Logs
                        </FormLabel>
                        <FormDescription>
                          Display system logs and error messages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableApiLogging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          API Request Logging
                        </FormLabel>
                        <FormDescription>
                          Log all API requests for debugging purposes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
                    Admin preferences saved successfully!
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
