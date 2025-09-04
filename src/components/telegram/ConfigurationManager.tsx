'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BotConfigurationForm } from './BotConfigurationForm';
import { ImportExportManager } from './ImportExportManager';
import {
  Bot,
  Settings,
  Upload,
  Download,
  Shield,
  Zap,
  Archive
} from 'lucide-react';

export function ConfigurationManager() {
  const [activeTab, setActiveTab] = useState<'bot-config' | 'channels' | 'import-export' | 'security'>('bot-config');

  const tabs = [
    {
      id: 'bot-config',
      label: 'Bot Configuration',
      icon: Bot,
      description: 'Configure your Telegram bot token and settings'
    },
    {
      id: 'channels',
      label: 'Channel Settings',
      icon: Settings,
      description: 'Configure notification channels and chat IDs'
    },
    {
      id: 'import-export',
      label: 'Backup & Import',
      icon: Archive,
      description: 'Manage configuration backups and imports'
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: Shield,
      description: 'Advanced security and encryption settings'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Bot Configuration Tab */}
        {activeTab === 'bot-config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Bot Configuration</h2>
              <p className="text-gray-600 mb-6">
                Configure your Telegram bot token and basic settings to enable notifications.
              </p>
            </div>
            <BotConfigurationForm />
          </div>
        )}

        {/* Channel Settings Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Channel Settings</h2>
              <p className="text-gray-600 mb-6">
                Configure notification channels, chat IDs, and channel-specific settings.
              </p>
            </div>
            <ChannelConfigurationForm />
          </div>
        )}

        {/* Import/Export Tab */}
        {activeTab === 'import-export' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Management</h2>
              <p className="text-gray-600 mb-6">
                Backup, restore, and manage your Telegram notification configurations.
              </p>
            </div>
            <ImportExportManager />
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
              <p className="text-gray-600 mb-6">
                Advanced security options and encryption settings for your bot configuration.
              </p>
            </div>
            <SecuritySettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}

// Channel Configuration Form Component
function ChannelConfigurationForm() {
  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <Settings className="w-5 h-5 mr-2" />
            Channel Configuration
          </CardTitle>
          <p className="text-green-700 text-sm">
            Configure your notification channels and chat IDs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders Channel */}
            <div className="p-4 bg-white border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Orders Channel
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="-1001234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Orders Notifications"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    id="orders-enabled"
                  />
                  <label htmlFor="orders-enabled" className="text-sm text-gray-700">
                    Enable order notifications
                  </label>
                </div>
              </div>
            </div>

            {/* Inventory Channel */}
            <div className="p-4 bg-white border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Inventory Channel
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="-1001234567891"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Inventory Alerts"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    id="inventory-enabled"
                  />
                  <label htmlFor="inventory-enabled" className="text-sm text-gray-700">
                    Enable inventory alerts
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Chat ID Helper */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to get Chat ID:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Add your bot to the group/channel</li>
              <li>Send a message in the group</li>
              <li>Visit: <code className="bg-blue-100 px-1 rounded">https://api.telegram.org/bot{'{'}YOUR_BOT_TOKEN{'}'}/getUpdates</code></li>
              <li>Look for the "chat" object and copy the "id" value</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Settings Form Component
function SecuritySettingsForm() {
  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-900">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
          <p className="text-amber-700 text-sm">
            Advanced security options for your Telegram bot configuration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Encryption Settings */}
          <div className="p-4 bg-white border border-amber-200 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-3">Encryption Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Token Encryption</div>
                  <div className="text-xs text-gray-600">Bot token is encrypted using AES-256-GCM</div>
                </div>
                <div className="text-green-600 font-medium text-sm">✓ Active</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Configuration Backup Encryption</div>
                  <div className="text-xs text-gray-600">Backup files are encrypted before storage</div>
                </div>
                <div className="text-green-600 font-medium text-sm">✓ Active</div>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="p-4 bg-white border border-amber-200 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-3">Access Control</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Admin Authentication Required</div>
                  <div className="text-xs text-gray-600">Only authenticated admins can modify settings</div>
                </div>
                <div className="text-green-600 font-medium text-sm">✓ Enforced</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Session Validation</div>
                  <div className="text-xs text-gray-600">All requests validate active admin session</div>
                </div>
                <div className="text-green-600 font-medium text-sm">✓ Active</div>
              </div>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="p-4 bg-white border border-amber-200 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-3">Rate Limiting</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Updates
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value="10/hour"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Messages
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value="5/minute"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logging */}
          <div className="p-4 bg-white border border-amber-200 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-3">Audit Logging</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Configuration Changes</span>
                <span className="text-green-600 text-sm">✓ Logged</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication Events</span>
                <span className="text-green-600 text-sm">✓ Logged</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Access Attempts</span>
                <span className="text-green-600 text-sm">✓ Logged</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Security Notice:</strong> All security settings are automatically enforced and cannot be disabled. 
                Your bot tokens and sensitive configuration data are protected with enterprise-grade security measures.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}