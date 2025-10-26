'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Badge } from '@/components/ui/badge';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Settings,
  Clock,
  TestTube2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationSettings } from '@/lib/notifications/notification-service';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationSettings>({
    orderUpdates: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    marketing: {
      email: false,
      sms: false,
      push: false,
      frequency: 'WEEKLY',
    },
    stockAlerts: {
      email: false,
      push: true,
      inApp: true,
    },
    memberBenefits: {
      email: true,
      push: true,
      inApp: true,
    },
    newsletter: {
      email: false,
      frequency: 'MONTHLY',
    },
  });

  // TELEGRAM STATE: Configuration management
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    botUsername: '',
    ordersEnabled: false,
    ordersChatId: '',
    inventoryEnabled: false,
    inventoryChatId: '',
    dailySummaryEnabled: false,
    summaryTime: '09:00',
    timezone: 'Asia/Kuala_Lumpur',
    verified: false,
    healthStatus: 'UNKNOWN',
    lastHealthCheck: null,
  });

  // TELEGRAM STATE: Status tracking
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotificationPreferences();
      loadTelegramConfiguration();
      loadTelegramStatus();
    }
  }, [status]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (!session) {
    redirect('/auth/signin');
  }

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/member/notifications');

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      } else {
        toast.error('Failed to load notification preferences');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Error loading notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetchWithCSRF('/api/member/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Notification preferences saved successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error saving notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = (
    section: keyof NotificationSettings,
    field: string,
    value: boolean | string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // TELEGRAM FUNCTIONS: Configuration management
  const loadTelegramConfiguration = async () => {
    try {
      setTelegramLoading(true);
      const response = await fetch('/api/user/telegram');
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to load Telegram configuration:', data.error);
        return;
      }

      if (data.configured && data.config) {
        setTelegramConfig({
          botToken:
            data.config.botToken !== '***masked***'
              ? data.config.botToken
              : telegramConfig.botToken,
          botUsername: data.config.botUsername || '',
          ordersEnabled: data.config.ordersEnabled,
          ordersChatId: data.config.ordersChatId || '',
          inventoryEnabled: data.config.inventoryEnabled,
          inventoryChatId: data.config.inventoryChatId || '',
          dailySummaryEnabled: data.config.dailySummaryEnabled,
          summaryTime: data.config.summaryTime || '09:00',
          timezone: data.config.timezone || 'Asia/Kuala_Lumpur',
          verified: data.config.verified,
          healthStatus: data.config.healthStatus,
          lastHealthCheck: data.config.lastHealthCheck,
        });
      }
    } catch (error) {
      console.error('Error loading Telegram configuration:', error);
    } finally {
      setTelegramLoading(false);
    }
  };

  const loadTelegramStatus = async () => {
    try {
      const response = await fetch('/api/user/telegram/status');
      const data = await response.json();

      if (response.ok) {
        setTelegramStatus(data);
      }
    } catch (error) {
      console.error('Error loading Telegram status:', error);
    }
  };

  const saveTelegramConfiguration = async () => {
    try {
      setTelegramLoading(true);
      const response = await fetchWithCSRF('/api/user/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save Telegram configuration');
      }

      toast.success('Telegram configuration saved successfully!');

      // REFRESH: Reload status after saving
      await loadTelegramStatus();
    } catch (error) {
      console.error('Error saving Telegram configuration:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save Telegram configuration'
      );
    } finally {
      setTelegramLoading(false);
    }
  };

  const testTelegramConnection = async () => {
    setTelegramTesting(true);
    try {
      const response = await fetchWithCSRF('/api/user/telegram/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }

      // REFRESH: Reload status after testing
      await loadTelegramStatus();
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      toast.error('Failed to test Telegram connection');
    } finally {
      setTelegramTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-gray-600">
            Manage how and when you want to be notified
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Order Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Order Updates
            </CardTitle>
            <p className="text-sm text-gray-600">
              Get notified about order confirmations, shipping updates, and
              deliveries
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="order-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Switch
                id="order-email"
                checked={preferences.orderUpdates.email}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('orderUpdates', 'email', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order-sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS
              </Label>
              <Switch
                id="order-sms"
                checked={preferences.orderUpdates.sms}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('orderUpdates', 'sms', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order-push" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <Switch
                id="order-push"
                checked={preferences.orderUpdates.push}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('orderUpdates', 'push', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order-inapp" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                In-App Notifications
              </Label>
              <Switch
                id="order-inapp"
                checked={preferences.orderUpdates.inApp}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('orderUpdates', 'inApp', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing & Promotions</CardTitle>
            <p className="text-sm text-gray-600">
              Receive updates about deals, new arrivals, and special offers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="marketing-email"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Switch
                id="marketing-email"
                checked={preferences.marketing.email}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('marketing', 'email', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="marketing-sms"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </Label>
              <Switch
                id="marketing-sms"
                checked={preferences.marketing.sms}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('marketing', 'sms', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="marketing-push"
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <Switch
                id="marketing-push"
                checked={preferences.marketing.push}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('marketing', 'push', checked)
                }
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="marketing-frequency">Frequency</Label>
              <Select
                value={preferences.marketing.frequency}
                onValueChange={value =>
                  updatePreferences('marketing', 'frequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Stock & Price Alerts</CardTitle>
            <p className="text-sm text-gray-600">
              Get notified when items come back in stock or prices drop
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="stock-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Switch
                id="stock-email"
                checked={preferences.stockAlerts.email}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('stockAlerts', 'email', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stock-push" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <Switch
                id="stock-push"
                checked={preferences.stockAlerts.push}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('stockAlerts', 'push', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stock-inapp" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                In-App Notifications
              </Label>
              <Switch
                id="stock-inapp"
                checked={preferences.stockAlerts.inApp}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('stockAlerts', 'inApp', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Member Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Member Benefits</CardTitle>
            <p className="text-sm text-gray-600">
              Notifications about exclusive member offers and benefits
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="member-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Switch
                id="member-email"
                checked={preferences.memberBenefits.email}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('memberBenefits', 'email', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="member-push" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <Switch
                id="member-push"
                checked={preferences.memberBenefits.push}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('memberBenefits', 'push', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="member-inapp" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                In-App Notifications
              </Label>
              <Switch
                id="member-inapp"
                checked={preferences.memberBenefits.inApp}
                onCheckedChange={(checked: boolean) =>
                  updatePreferences('memberBenefits', 'inApp', checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
          <p className="text-sm text-gray-600">
            Stay updated with our latest news, articles, and company updates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="newsletter-email"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Newsletter
            </Label>
            <Switch
              id="newsletter-email"
              checked={preferences.newsletter.email}
              onCheckedChange={(checked: boolean) =>
                updatePreferences('newsletter', 'email', checked)
              }
            />
          </div>
          <div>
            <Label htmlFor="newsletter-frequency">Frequency</Label>
            <Select
              value={preferences.newsletter.frequency}
              onValueChange={value =>
                updatePreferences('newsletter', 'frequency', value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TELEGRAM NOTIFICATIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Notifications
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure your personal Telegram bot for business notifications
          </p>
          {telegramStatus && (
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={telegramStatus.configured ? 'default' : 'secondary'}
              >
                {telegramStatus.configured ? 'Configured' : 'Not Configured'}
              </Badge>
              <Badge
                variant={
                  telegramStatus.health?.healthy ? 'default' : 'destructive'
                }
              >
                {telegramStatus.health?.healthy ? 'Healthy' : 'Unhealthy'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={testTelegramConnection}
                disabled={telegramTesting || !telegramStatus.configured}
              >
                {telegramTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube2 className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bot Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Bot Configuration</h4>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <PasswordInput
                id="botToken"
                placeholder="Enter your Telegram bot token"
                value={telegramConfig.botToken || ''}
                onChange={e =>
                  setTelegramConfig({
                    ...telegramConfig,
                    botToken: e.target.value,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="botUsername">Bot Username (Optional)</Label>
              <Input
                id="botUsername"
                placeholder="@your_bot_username"
                value={telegramConfig.botUsername || ''}
                onChange={e =>
                  setTelegramConfig({
                    ...telegramConfig,
                    botUsername: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Notification Channels */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Channels</h4>

            {/* Orders Channel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="ordersEnabled"
                  className="text-base font-medium"
                >
                  Order Notifications
                </Label>
                <Switch
                  id="ordersEnabled"
                  checked={telegramConfig.ordersEnabled}
                  onCheckedChange={checked =>
                    setTelegramConfig({
                      ...telegramConfig,
                      ordersEnabled: checked,
                    })
                  }
                />
              </div>
              {telegramConfig.ordersEnabled && (
                <div>
                  <Label htmlFor="ordersChatId">Orders Chat ID</Label>
                  <Input
                    id="ordersChatId"
                    placeholder="Enter chat ID (e.g., -1001234567890)"
                    value={telegramConfig.ordersChatId || ''}
                    onChange={e =>
                      setTelegramConfig({
                        ...telegramConfig,
                        ordersChatId: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat ID where order notifications will be sent
                  </p>
                </div>
              )}
            </div>

            {/* Inventory Channel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="inventoryEnabled"
                  className="text-base font-medium"
                >
                  Inventory Notifications
                </Label>
                <Switch
                  id="inventoryEnabled"
                  checked={telegramConfig.inventoryEnabled}
                  onCheckedChange={checked =>
                    setTelegramConfig({
                      ...telegramConfig,
                      inventoryEnabled: checked,
                    })
                  }
                />
              </div>
              {telegramConfig.inventoryEnabled && (
                <div>
                  <Label htmlFor="inventoryChatId">Inventory Chat ID</Label>
                  <Input
                    id="inventoryChatId"
                    placeholder="Enter chat ID (e.g., -1001234567890)"
                    value={telegramConfig.inventoryChatId || ''}
                    onChange={e =>
                      setTelegramConfig({
                        ...telegramConfig,
                        inventoryChatId: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat ID where low stock alerts will be sent
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Daily Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h4 className="font-medium">Daily Summary</h4>
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="dailySummaryEnabled"
                className="text-base font-medium"
              >
                Enable Daily Summary
              </Label>
              <Switch
                id="dailySummaryEnabled"
                checked={telegramConfig.dailySummaryEnabled}
                onCheckedChange={checked =>
                  setTelegramConfig({
                    ...telegramConfig,
                    dailySummaryEnabled: checked,
                  })
                }
              />
            </div>

            {telegramConfig.dailySummaryEnabled && (
              <>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="summaryTime">Summary Time</Label>
                  <Input
                    id="summaryTime"
                    type="time"
                    value={telegramConfig.summaryTime || '09:00'}
                    onChange={e =>
                      setTelegramConfig({
                        ...telegramConfig,
                        summaryTime: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={telegramConfig.timezone}
                    onValueChange={value =>
                      setTelegramConfig({ ...telegramConfig, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuala_Lumpur">
                        Asia/Kuala_Lumpur
                      </SelectItem>
                      <SelectItem value="Asia/Singapore">
                        Asia/Singapore
                      </SelectItem>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Save Telegram Configuration */}
          <div className="flex justify-end">
            <Button
              onClick={saveTelegramConfiguration}
              disabled={telegramLoading}
            >
              {telegramLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Telegram Config
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Need help setting up?</strong>
              <br />
              1. Create a bot using @BotFather on Telegram
              <br />
              2. Add your bot to the desired chat/channel
              <br />
              3. Get the chat ID using @RawDataBot or similar tools
              <br />
              4. Enter the bot token and chat IDs above
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving...' : 'Save All Preferences'}
        </Button>
      </div>
    </div>
  );
}
