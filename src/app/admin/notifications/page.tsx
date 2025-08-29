'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Settings,
  CheckCircle,
  AlertTriangle,
  Send,
  Loader2,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface TelegramHealth {
  configured: boolean;
  healthy: boolean;
  lastCheck: string | null;
  queuedMessages: number;
  status: 'not_configured' | 'healthy' | 'unhealthy';
}

interface ChannelStatus {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  enabled: boolean;
  envVar: string;
  lastTest?: string;
}

export default function NotificationsPage() {
  const [health, setHealth] = useState<TelegramHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingChannels, setTestingChannels] = useState<
    Record<string, boolean>
  >({});
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [botConfigured, setBotConfigured] = useState<boolean>(false);

  useEffect(() => {
    loadChannelStatus();
    checkHealth();

    // Check health every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);

    return () => clearInterval(healthInterval);
  }, []);

  const loadChannelStatus = async () => {
    try {
      const response = await fetch('/api/admin/telegram/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
        setBotConfigured(data.botConfigured || false);
      }
    } catch (error) {
      console.error('Error loading channel status:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/admin/telegram/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Error checking health:', error);
    }
  };

  const testChannel = async (channelId: string) => {
    setTestingChannels(prev => ({ ...prev, [channelId]: true }));

    try {
      let endpoint = '/api/admin/telegram/test-order';
      if (channelId === 'inventory') {
        endpoint = '/api/admin/telegram/test-inventory';
      }

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `✅ ${channelId === 'orders' ? 'Order' : 'Inventory'} notification sent!`
        );
        setChannels(prev =>
          prev.map(channel =>
            channel.id === channelId
              ? { ...channel, lastTest: new Date().toLocaleTimeString() }
              : channel
          )
        );
      } else {
        toast.error(`❌ Test failed: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${channelId} channel`);
    } finally {
      setTestingChannels(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const testDailySummary = async () => {
    setTestingChannels(prev => ({ ...prev, 'daily-summary': true }));

    try {
      const response = await fetch('/api/admin/telegram/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString() }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Daily summary sent!`);
      } else {
        toast.error(`❌ Daily summary failed: ${data.message}`);
      }
    } catch (error) {
      toast.error(`Failed to send daily summary`);
    } finally {
      setTestingChannels(prev => ({ ...prev, 'daily-summary': false }));
    }
  };

  const getStatusBadge = (channel: ChannelStatus) => {
    if (!channel.configured) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Setup Required
        </Badge>
      );
    }

    if (channel.enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    return <Badge variant="outline">Configured</Badge>;
  };

  const getConnectionStatus = () => {
    if (!health?.configured) {
      return null;
    }

    if (health.status === 'healthy') {
      return (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Connected
        </div>
      );
    }

    if (health.status === 'unhealthy') {
      return (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          Connection Issues
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-sm text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        Checking...
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              Configure order notifications for your team
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  // Define contextual tabs following ADMIN_LAYOUT_STANDARD.md - System section
  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/admin/notifications',
    },
    {
      id: 'monitoring',
      label: 'System Monitoring',
      href: '/admin/system/monitoring',
    },
    { id: 'logs', label: 'Activity Logs', href: '/admin/system/logs' },
    { id: 'security', label: 'Security', href: '/admin/system/security' },
  ];

  // Extract page actions
  const pageActions = (
    <div className="flex items-center gap-2">
      {getConnectionStatus()}
      {health?.configured && (
        <Button
          onClick={testDailySummary}
          disabled={testingChannels['daily-summary']}
          variant="outline"
          size="sm"
        >
          {testingChannels['daily-summary'] ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Test Daily Summary
        </Button>
      )}
    </div>
  );

  return (
    <AdminPageLayout
      title="Telegram Notifications"
      subtitle="Configure automated notifications for orders and inventory"
      actions={pageActions}
      tabs={tabs}
      loading={loading}
    >
      {/* Bot Status Alert */}
      {!botConfigured && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">
                Telegram Bot Not Configured
              </h3>
              <p className="text-sm text-red-800 mt-1">
                Add{' '}
                <code className="bg-red-100 px-1 rounded">
                  TELEGRAM_BOT_TOKEN
                </code>{' '}
                to your .env file to enable notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {channels.map(channel => {
          const Icon = channel.id === 'orders' ? ShoppingCart : Package;
          const isTestingThis = testingChannels[channel.id];

          return (
            <Card
              key={channel.id}
              className="relative transition-all hover:shadow-md"
            >
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${channel.configured ? 'bg-green-100' : 'bg-gray-100'}`}
                    >
                      <Icon
                        className={`w-6 h-6 ${channel.configured ? 'text-green-600' : 'text-gray-500'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold">
                        {channel.name}
                      </CardTitle>
                      <p className="text-gray-600 mt-1 leading-relaxed">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(channel)}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {channel.configured ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          Channel Active
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Ready to send notifications
                        </p>
                      </div>
                    </div>

                    {channel.lastTest && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <strong>Last test:</strong> {channel.lastTest}
                      </div>
                    )}

                    <Button
                      onClick={() => testChannel(channel.id)}
                      disabled={isTestingThis || !botConfigured}
                      size="lg"
                      className="w-full h-12 text-base"
                    >
                      {isTestingThis ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-3" />
                          Sending test message...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-3" />
                          Send Test Message
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                      <p className="font-medium text-yellow-900 mb-2">
                        Setup Required
                      </p>
                      <p className="text-sm text-yellow-800 mb-3">
                        Add this to your .env file:
                      </p>
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <code className="text-sm font-mono text-yellow-900">
                          {channel.envVar}="your_chat_id"
                        </code>
                      </div>
                      <p className="text-xs text-yellow-700 mt-3">
                        Then restart your development server
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status */}
      {health?.configured && (
        <Card className="bg-gray-50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                <span className="font-medium">Connection Status</span>
                {getConnectionStatus()}
              </div>

              {health.lastCheck && (
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                  <span className="font-medium">Last Health Check</span>
                  <span className="font-mono text-sm text-gray-600">
                    {new Date(health.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                <span className="font-medium">Queued Messages</span>
                <Badge
                  variant={
                    health.queuedMessages > 0 ? 'destructive' : 'secondary'
                  }
                >
                  {health.queuedMessages || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {(channels.some(c => !c.configured) || !botConfigured) && (
        <Card className="border-blue-200 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-4 text-lg">
                Complete Setup Guide:
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      Create Telegram groups
                    </p>
                    <p className="text-blue-800 text-sm mt-1">
                      Set up separate groups for orders and inventory alerts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      Add bot to groups
                    </p>
                    <p className="text-blue-800 text-sm mt-1">
                      Invite your bot and make it an admin in both groups
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">
                      Configure environment
                    </p>
                    <p className="text-blue-800 text-sm mt-1">
                      Add chat IDs to your .env file and restart server
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Summary Automation */}
      {channels.find(c => c.id === 'orders' && c.configured) && (
        <Card className="border-purple-200 mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Daily Summary Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <MessageCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900">
                    Automated Daily Report
                  </h4>
                  <p className="text-purple-800 text-sm mt-1 leading-relaxed">
                    <strong>Schedule:</strong> Every day at 00:00 Malaysian Time
                    (UTC+8)
                    <br />
                    <strong>Includes:</strong> Total orders, revenue, payment
                    status breakdown
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Trigger Points Info */}
      {channels.some(c => c.configured) && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-green-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Active Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {channels.find(c => c.id === 'orders' && c.configured) && (
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <ShoppingCart className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      Order Notifications
                    </h4>
                    <p className="text-green-800 text-sm mt-1 leading-relaxed">
                      <strong>Trigger:</strong> Immediately when a new order is
                      created (after order confirmation)
                      <br />
                      <strong>Includes:</strong> Order number, customer details,
                      total amount, payment method, member status
                    </p>
                  </div>
                </div>
              )}

              {channels.find(c => c.id === 'inventory' && c.configured) && (
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <Package className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-orange-900">
                      Inventory Alerts
                    </h4>
                    <p className="text-orange-800 text-sm mt-1 leading-relaxed">
                      <strong>Trigger:</strong> When product stock falls below
                      minimum threshold
                      <br />
                      <strong>Includes:</strong> Product name, SKU, current
                      stock level, restock reminder
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}
