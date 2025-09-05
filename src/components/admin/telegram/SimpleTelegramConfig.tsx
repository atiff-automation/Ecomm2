/**
 * Simple Admin Telegram Configuration Component - Malaysian E-commerce Platform
 * CENTRALIZED admin telegram configuration UI
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  TestTube2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  EyeOff,
  HelpCircle,
  MessageCircle,
  Package,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminTelegramConfig {
  id?: string;
  ordersChatId: string;
  inventoryChatId?: string;
  ordersEnabled: boolean;
  inventoryEnabled: boolean;
  dailySummaryEnabled: boolean;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
  creator?: { firstName: string; lastName: string; email: string };
  updater?: { firstName: string; lastName: string; email: string };
}

interface SimpleTelegramConfigProps {
  onConfigUpdated?: () => void;
}

export function SimpleTelegramConfig({ onConfigUpdated }: SimpleTelegramConfigProps) {
  const router = useRouter();
  
  // SINGLE SOURCE OF TRUTH: State management
  const [config, setConfig] = useState<AdminTelegramConfig>({
    ordersChatId: '',
    inventoryChatId: '',
    ordersEnabled: true,
    inventoryEnabled: true,
    dailySummaryEnabled: true,
    timezone: 'Asia/Kuala_Lumpur'
  });
  
  const [botToken, setBotToken] = useState('');
  const [showBotToken, setShowBotToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [testResults, setTestResults] = useState<{
    orders?: boolean;
    inventory?: boolean;
  }>({});

  // DRY: Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  /**
   * CENTRALIZED: Load current configuration
   */
  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/telegram/simple-config');
      if (response.ok) {
        const data = await response.json();
        if (data.configured && data.config) {
          setConfig(data.config);
          setIsConfigured(true);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.error('Failed to load current configuration');
    }
  };

  /**
   * NO HARDCODE: Validate form inputs
   */
  const validateForm = (): string | null => {
    if (!botToken.trim()) {
      return 'Bot token is required';
    }
    if (!config.ordersChatId.trim()) {
      return 'Orders chat ID is required';
    }
    if (config.inventoryEnabled && !config.inventoryChatId?.trim()) {
      return 'Inventory chat ID is required when inventory notifications are enabled';
    }
    return null;
  };

  /**
   * DRY: Test configuration before saving
   */
  const testConfiguration = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsTesting(true);
    setTestResults({});

    try {
      const response = await fetch('/api/admin/telegram/simple-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          ordersChatId: config.ordersChatId.trim(),
          inventoryChatId: config.inventoryChatId?.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Configuration test passed!');
        setTestResults({ orders: true, inventory: true });
      } else {
        toast.error(`❌ Configuration test failed: ${result.message}`);
        setTestResults({ orders: false, inventory: false });
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Failed to test configuration');
      setTestResults({ orders: false, inventory: false });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * CENTRALIZED: Save configuration
   */
  const saveConfiguration = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/telegram/simple-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          ordersChatId: config.ordersChatId.trim(),
          inventoryChatId: config.inventoryChatId?.trim(),
          ordersEnabled: config.ordersEnabled,
          inventoryEnabled: config.inventoryEnabled,
          dailySummaryEnabled: config.dailySummaryEnabled,
          timezone: config.timezone
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('🎉 Telegram configuration saved successfully!');
        setConfig(result.config);
        setIsConfigured(true);
        
        // Force service reload to refresh cached config
        try {
          await fetch('/api/admin/telegram/simple-config', { method: 'PATCH' });
        } catch (error) {
          console.warn('Service reload failed:', error);
        }
        
        // Refresh dashboard data
        router.refresh();
        
        if (onConfigUpdated) {
          onConfigUpdated();
        }
      } else {
        toast.error(`Failed to save: ${result.message}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * CENTRALIZED: Clear all telegram configuration
   * NO HARDCODE: Confirmation dialog and proper cleanup
   */
  const clearConfiguration = async () => {
    if (!config?.id) {
      toast.error('No configuration to clear');
      return;
    }

    // User confirmation
    if (!window.confirm('⚠️ Are you sure you want to clear the Telegram configuration?\n\nThis will:\n• Delete bot token and chat IDs\n• Disable all notifications\n• This action cannot be undone!')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/telegram/simple-config?id=${config.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear local state
          setConfig({
            botToken: '',
            ordersChatId: '',
            inventoryChatId: '',
            ordersEnabled: true,
            inventoryEnabled: true,
            dailySummaryEnabled: true,
            timezone: 'Asia/Kuala_Lumpur'
          });
          setBotToken('');
          setIsConfigured(false);
          
          toast.success('🗑️ Telegram configuration cleared successfully!');
          
          // Force service reload to clear cached config
          try {
            await fetch('/api/admin/telegram/simple-config', { method: 'PATCH' });
          } catch (error) {
            console.warn('Service reload failed:', error);
          }
          
          // Refresh dashboard data
          router.refresh();
          
          if (onConfigUpdated) {
            onConfigUpdated();
          }
        } else {
          toast.error(`Failed to clear: ${result.message}`);
        }
      } else {
        toast.error('Failed to clear configuration');
      }
    } catch (error) {
      console.error('Clear failed:', error);
      toast.error('Failed to clear configuration');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * DRY: Test notifications
   */
  const testNotification = async (type: 'orders' | 'inventory') => {
    if (!isConfigured) {
      toast.error('Please save your configuration first');
      return;
    }

    try {
      const endpoint = type === 'orders' ? 'simple-test-order' : 'simple-test-inventory';
      const response = await fetch(`/api/admin/telegram/${endpoint}`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`✅ ${type === 'orders' ? 'Order' : 'Inventory'} test notification sent!`);
      } else {
        toast.error(`❌ Test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error(`Failed to send ${type} test notification`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Admin Telegram Configuration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Centralized telegram notifications for your e-commerce platform
                </p>
              </div>
            </div>
            {isConfigured && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Bot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bot Token Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            Your Telegram bot token for sending notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="botToken">Telegram Bot Token *</Label>
            <div className="relative mt-1">
              <Input
                id="botToken"
                type={showBotToken ? 'text' : 'password'}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowBotToken(!showBotToken)}
              >
                {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get this from @BotFather on Telegram. Keep this secret!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Channels</CardTitle>
          <p className="text-sm text-gray-600">
            Configure your Telegram groups for different notification types
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Orders Channel */}
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Orders Notifications</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ordersChatId">Orders Group Chat ID *</Label>
                <Input
                  id="ordersChatId"
                  value={config.ordersChatId}
                  onChange={(e) => setConfig(prev => ({ ...prev, ordersChatId: e.target.value }))}
                  placeholder="-1001234567890"
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Add your bot to the orders group and get the chat ID
                </p>
              </div>
              {isConfigured && (
                <Button
                  onClick={() => testNotification('orders')}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <TestTube2 className="w-4 h-4 mr-2" />
                  Send Test Order
                </Button>
              )}
            </div>
          </div>

          {/* Inventory Channel */}
          <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-orange-900">Inventory Alerts</h4>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="inventoryChatId">Inventory Group Chat ID</Label>
                <Input
                  id="inventoryChatId"
                  value={config.inventoryChatId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, inventoryChatId: e.target.value }))}
                  placeholder="-1001234567890 (optional)"
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Leave empty to disable inventory alerts, or use same as orders
                </p>
              </div>
              {isConfigured && config.inventoryChatId && (
                <Button
                  onClick={() => testNotification('inventory')}
                  variant="outline"
                  size="sm"
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  <TestTube2 className="w-4 h-4 mr-2" />
                  Send Test Alert
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">How to Find Chat ID</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">1</span>
              <p>Create a Telegram group for your notifications</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">2</span>
              <p>Add your bot to the group and make it an admin</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">3</span>
              <p>Send a message to the group, then visit: <code className="bg-gray-200 px-1 rounded">https://api.telegram.org/bot{'{YOUR_BOT_TOKEN}'}/getUpdates</code></p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">4</span>
              <p>Look for the "chat" object and copy the "id" value (it will be negative for groups)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={testConfiguration}
              variant="outline"
              disabled={isTesting || isLoading}
              className="flex-shrink-0"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube2 className="w-4 h-4 mr-2" />
              )}
              Test Configuration
            </Button>
            
            <Button
              onClick={saveConfiguration}
              disabled={isLoading || isTesting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>

            {isConfigured && (
              <Button
                onClick={clearConfiguration}
                disabled={isLoading || isTesting}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Configuration
              </Button>
            )}

            {isConfigured && (
              <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Configuration saved and active
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}