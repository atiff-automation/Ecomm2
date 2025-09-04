'use client';

/**
 * User Telegram Notifications Configuration Page
 * MULTI-TENANT: User-scoped Telegram notification management
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  MessageSquare, 
  Clock,
  Globe,
  TestTube2,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// TYPES: User Telegram configuration interface
interface TelegramConfig {
  botToken: string | null;
  botUsername: string | null;
  ordersEnabled: boolean;
  ordersChatId: string | null;
  inventoryEnabled: boolean;
  inventoryChatId: string | null;
  dailySummaryEnabled: boolean;
  summaryTime: string | null;
  timezone: string;
  verified: boolean;
  healthStatus: string;
  lastHealthCheck: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// TYPES: Status response interface
interface StatusResponse {
  configured: boolean;
  status: string;
  message: string;
  health: {
    healthy: boolean;
    lastCheck: string | null;
    queuedMessages: number;
  };
  channels: {
    orders: { enabled: boolean; configured: boolean; chatId: string | null };
    inventory: { enabled: boolean; configured: boolean; chatId: string | null };
  };
  notifications: {
    dailySummary: {
      enabled: boolean;
      time: string | null;
      timezone: string;
    };
  };
  metadata: {
    verified: boolean;
    healthStatus: string;
    lastHealthCheck: string | null;
    lastUpdated: string | null;
  };
}

export default function UserTelegramNotificationsPage() {
  // STATE: Configuration management
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: null,
    botUsername: null,
    ordersEnabled: false,
    ordersChatId: null,
    inventoryEnabled: false,
    inventoryChatId: null,
    dailySummaryEnabled: false,
    summaryTime: null,
    timezone: 'Asia/Kuala_Lumpur',
    verified: false,
    healthStatus: 'UNKNOWN',
    lastHealthCheck: null,
    createdAt: null,
    updatedAt: null
  });
  
  // STATE: Status tracking
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // INITIALIZATION: Load user configuration
  useEffect(() => {
    loadConfiguration();
    loadStatus();
  }, []);

  /**
   * Load user Telegram configuration
   * CENTRALIZED: Single source for configuration loading
   */
  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/user/telegram');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load configuration');
      }

      if (data.configured && data.config) {
        setConfig({
          botToken: data.config.botToken !== '***masked***' ? data.config.botToken : config.botToken,
          botUsername: data.config.botUsername,
          ordersEnabled: data.config.ordersEnabled,
          ordersChatId: data.config.ordersChatId,
          inventoryEnabled: data.config.inventoryEnabled,
          inventoryChatId: data.config.inventoryChatId,
          dailySummaryEnabled: data.config.dailySummaryEnabled,
          summaryTime: data.config.summaryTime,
          timezone: data.config.timezone,
          verified: data.config.verified,
          healthStatus: data.config.healthStatus,
          lastHealthCheck: data.config.lastHealthCheck,
          createdAt: data.config.createdAt,
          updatedAt: data.config.updatedAt
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setError(error instanceof Error ? error.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user Telegram status
   * MONITORING: Real-time status information
   */
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/user/telegram/status');
      const data = await response.json();

      if (response.ok) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  /**
   * Save configuration changes
   * SYSTEMATIC: Centralized configuration saving
   */
  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      toast.success('Telegram configuration saved successfully!');
      
      // REFRESH: Reload status after saving
      await loadStatus();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test Telegram connection
   * VALIDATION: User-scoped connection testing
   */
  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/user/telegram/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      
      // REFRESH: Reload status after testing
      await loadStatus();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test Telegram connection');
    } finally {
      setTesting(false);
    }
  };

  // LOADING STATE: Show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Telegram configuration...</span>
      </div>
    );
  }

  // ERROR STATE: Show error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* PAGE HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Telegram Notifications</h1>
          <p className="text-muted-foreground">
            Configure your personal Telegram notifications for order updates and inventory alerts.
          </p>
        </div>

        {/* STATUS OVERVIEW */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={status.configured ? "default" : "secondary"}>
                    {status.configured ? "Configured" : "Not Configured"}
                  </Badge>
                  <Badge variant={status.health.healthy ? "default" : "destructive"}>
                    {status.health.healthy ? "Healthy" : "Unhealthy"}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testConnection}
                  disabled={testing || !status.configured}
                >
                  {testing ? (
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
              <p className="text-sm text-muted-foreground">{status.message}</p>
            </CardContent>
          </Card>
        )}

        {/* BOT CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Configure your Telegram bot token and basic settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="Enter your Telegram bot token"
                value={config.botToken || ''}
                onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
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
                value={config.botUsername || ''}
                onChange={(e) => setConfig({ ...config, botUsername: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* NOTIFICATION CHANNELS */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Configure which channels receive different types of notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ORDERS CHANNEL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ordersEnabled" className="text-base font-medium">
                  Order Notifications
                </Label>
                <Switch
                  id="ordersEnabled"
                  checked={config.ordersEnabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, ordersEnabled: checked })
                  }
                />
              </div>
              {config.ordersEnabled && (
                <div>
                  <Label htmlFor="ordersChatId">Orders Chat ID</Label>
                  <Input
                    id="ordersChatId"
                    placeholder="Enter chat ID (e.g., -1001234567890)"
                    value={config.ordersChatId || ''}
                    onChange={(e) => setConfig({ ...config, ordersChatId: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat ID where order notifications will be sent
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* INVENTORY CHANNEL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="inventoryEnabled" className="text-base font-medium">
                  Inventory Notifications
                </Label>
                <Switch
                  id="inventoryEnabled"
                  checked={config.inventoryEnabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, inventoryEnabled: checked })
                  }
                />
              </div>
              {config.inventoryEnabled && (
                <div>
                  <Label htmlFor="inventoryChatId">Inventory Chat ID</Label>
                  <Input
                    id="inventoryChatId"
                    placeholder="Enter chat ID (e.g., -1001234567890)"
                    value={config.inventoryChatId || ''}
                    onChange={(e) => setConfig({ ...config, inventoryChatId: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat ID where low stock alerts will be sent
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DAILY SUMMARY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Summary
            </CardTitle>
            <CardDescription>
              Configure automatic daily summary notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dailySummaryEnabled" className="text-base font-medium">
                Enable Daily Summary
              </Label>
              <Switch
                id="dailySummaryEnabled"
                checked={config.dailySummaryEnabled}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, dailySummaryEnabled: checked })
                }
              />
            </div>

            {config.dailySummaryEnabled && (
              <>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="summaryTime">Summary Time</Label>
                  <Input
                    id="summaryTime"
                    type="time"
                    value={config.summaryTime || '09:00'}
                    onChange={(e) => setConfig({ ...config, summaryTime: e.target.value })}
                  />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={config.timezone}
                    onValueChange={(value) => setConfig({ ...config, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        {/* HELP TEXT */}
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
      </div>
    </div>
  );
}