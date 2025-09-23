'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import ImageUpload, { UploadedImage } from '@/components/ui/image-upload';

interface ChatConfig {
  id?: string;
  webhookUrl: string;
  webhookSecret: string;
  apiKey: string;
  sessionTimeoutMinutes: number; // Keep for backward compatibility
  guestSessionTimeoutMinutes: number;
  authenticatedSessionTimeoutMinutes: number;
  maxMessageLength: number;
  rateLimitMessages: number;
  rateLimitWindowMs: number;
  queueEnabled: boolean;
  queueMaxRetries: number;
  queueRetryDelayMs: number;
  queueBatchSize: number;
  welcomeMessage: string;
  agentName: string;
  botIconUrl?: string;
  isActive: boolean;
  verified: boolean;
  healthStatus: string;
  lastHealthCheck?: string;
}

export default function ChatConfigPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<ChatConfig>({
    webhookUrl: '',
    webhookSecret: '',
    apiKey: '',
    sessionTimeoutMinutes: 30, // Backward compatibility
    guestSessionTimeoutMinutes: 13, // Match database default
    authenticatedSessionTimeoutMinutes: 19, // Match database default
    maxMessageLength: 4000,
    rateLimitMessages: 20,
    rateLimitWindowMs: 60000,
    queueEnabled: true,
    queueMaxRetries: 3,
    queueRetryDelayMs: 5000,
    queueBatchSize: 10,
    welcomeMessage: 'Hi! How can we help you today?',
    agentName: 'Customer Support',
    isActive: true,
    verified: false,
    healthStatus: 'UNKNOWN',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [botIcon, setBotIcon] = useState<UploadedImage[]>([]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/chat/config');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setIsConfigured(true);

        // Set bot icon if it exists
        if (data.config.botIconUrl) {
          setBotIcon([{ url: data.config.botIconUrl }]);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('No configuration found, using defaults');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const configToSave = {
        ...config,
        botIconUrl: botIcon.length > 0 ? botIcon[0].url : null,
      };

      const response = await fetch('/api/admin/chat/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(prev => ({ ...prev, ...data.config }));
        setIsConfigured(true);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save configuration',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/chat/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          webhookSecret: config.webhookSecret,
          apiKey: config.apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setConfig(prev => ({
          ...prev,
          verified: data.verified,
          healthStatus: data.healthStatus,
          lastHealthCheck: data.lastHealthCheck,
        }));
      } else {
        setMessage({ type: 'error', text: data.error || 'Test failed' });
        setConfig(prev => ({
          ...prev,
          verified: false,
          healthStatus: 'UNHEALTHY',
        }));
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during test' });
    } finally {
      setTesting(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    if (status === 'HEALTHY') {
      return 'text-green-600 bg-green-100';
    }
    if (status === 'PENDING_VERIFICATION') {
      return 'text-yellow-600 bg-yellow-100';
    }
    if (status === 'NOT_CONFIGURED') {
      return 'text-gray-600 bg-gray-100';
    }
    return 'text-red-600 bg-red-100';
  };

  const generateWebhookSecret = () => {
    const secret = crypto.randomUUID().replace(/-/g, '');
    setConfig(prev => ({ ...prev, webhookSecret: secret }));
  };

  const generateApiKey = () => {
    const apiKey = crypto.randomUUID().replace(/-/g, '');
    setConfig(prev => ({ ...prev, apiKey: apiKey }));
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleBotIconChange = (images: UploadedImage[]) => {
    setBotIcon(images);
  };

  // Tab configuration for chat navigation - consistent across all chat pages
  const chatTabs: TabConfig[] = [
    {
      id: 'sessions',
      label: 'Sessions',
      href: '/admin/chat',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/chat/config',
    },
    {
      id: 'operations',
      label: 'Operations',
      href: '/admin/chat/operations',
    },
    {
      id: 'archive',
      label: 'Data Management',
      href: '/admin/chat/archive',
    },
  ];

  if (status === 'loading') {
    return (
      <AdminPageLayout
        title="Chat Management"
        subtitle="Monitor and manage customer chat interactions"
        tabs={chatTabs}
        loading={true}
      >
        <div>Loading...</div>
      </AdminPageLayout>
    );
  }

  if (
    !session?.user ||
    !['SUPERADMIN', 'ADMIN'].includes((session.user as any)?.role)
  ) {
    redirect('/admin');
  }

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      loading={loading}
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Chat System Status
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Current webhook configuration and health status
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(config.healthStatus)}`}
              >
                {config.healthStatus}
              </span>
              {config.verified && (
                <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
          {config.lastHealthCheck && (
            <p className="text-sm text-gray-500 mt-2">
              Last health check:{' '}
              {new Date(config.lastHealthCheck).toLocaleString()}
            </p>
          )}
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* n8n Webhook Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                n8n Webhook Integration
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Webhook URL */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="webhookUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Webhook URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="webhookUrl"
                    value={config.webhookUrl}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        webhookUrl: e.target.value,
                      }))
                    }
                    placeholder="https://your-n8n-instance.com/webhook/chat"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your n8n webhook endpoint URL
                  </p>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label
                    htmlFor="webhookSecret"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Webhook Secret <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type={showWebhookSecret ? 'text' : 'password'}
                      id="webhookSecret"
                      value={config.webhookSecret}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          webhookSecret: e.target.value,
                        }))
                      }
                      placeholder="Enter webhook secret"
                      className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      title={showWebhookSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showWebhookSecret ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(config.webhookSecret, 'webhookSecret')
                      }
                      disabled={!config.webhookSecret}
                      className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy webhook secret"
                    >
                      {copiedField === 'webhookSecret' ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generateWebhookSecret}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Secret key for webhook authentication
                  </p>
                </div>

                {/* API Key */}
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      id="apiKey"
                      value={config.apiKey}
                      onChange={e =>
                        setConfig(prev => ({ ...prev, apiKey: e.target.value }))
                      }
                      placeholder="Enter API key"
                      className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.apiKey, 'apiKey')}
                      disabled={!config.apiKey}
                      className="px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy API key"
                    >
                      {copiedField === 'apiKey' ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generateApiKey}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Static API key for n8n webhook access control
                  </p>
                </div>
              </div>
            </div>

            {/* Session & Rate Limiting */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session & Rate Limiting
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="guestSessionTimeout"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Guest Session Timeout (minutes)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Session timeout for guest users (non-authenticated)
                  </p>
                  <input
                    type="number"
                    id="guestSessionTimeout"
                    min="1"
                    max="1440"
                    value={config.guestSessionTimeoutMinutes}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        guestSessionTimeoutMinutes:
                          parseInt(e.target.value, 10) || 13,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="authenticatedSessionTimeout"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Authenticated Session Timeout (minutes)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Session timeout for authenticated users (logged in)
                  </p>
                  <input
                    type="number"
                    id="authenticatedSessionTimeout"
                    min="1"
                    max="1440"
                    value={config.authenticatedSessionTimeoutMinutes}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        authenticatedSessionTimeoutMinutes:
                          parseInt(e.target.value, 10) || 19,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxMessageLength"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Max Message Length
                  </label>
                  <input
                    type="number"
                    id="maxMessageLength"
                    min="100"
                    max="10000"
                    value={config.maxMessageLength}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        maxMessageLength: parseInt(e.target.value, 10) || 4000,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rateLimitMessages"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Rate Limit (messages/minute)
                  </label>
                  <input
                    type="number"
                    id="rateLimitMessages"
                    min="1"
                    max="100"
                    value={config.rateLimitMessages}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        rateLimitMessages: parseInt(e.target.value, 10) || 20,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Queue Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Queue Configuration
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="queueEnabled"
                    checked={config.queueEnabled}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        queueEnabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="queueEnabled"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable message queue processing
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="queueMaxRetries"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Max Retries
                    </label>
                    <input
                      type="number"
                      id="queueMaxRetries"
                      min="1"
                      max="10"
                      value={config.queueMaxRetries}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          queueMaxRetries: parseInt(e.target.value, 10) || 3,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="queueRetryDelay"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Retry Delay (ms)
                    </label>
                    <input
                      type="number"
                      id="queueRetryDelay"
                      min="1000"
                      max="60000"
                      step="1000"
                      value={config.queueRetryDelayMs}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          queueRetryDelayMs:
                            parseInt(e.target.value, 10) || 5000,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="queueBatchSize"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Batch Size
                    </label>
                    <input
                      type="number"
                      id="queueBatchSize"
                      min="1"
                      max="50"
                      value={config.queueBatchSize}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          queueBatchSize: parseInt(e.target.value, 10) || 10,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chat Interface
              </h3>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="welcomeMessage"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Welcome Message
                  </label>
                  <textarea
                    id="welcomeMessage"
                    rows={3}
                    value={config.welcomeMessage}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        welcomeMessage: e.target.value,
                      }))
                    }
                    placeholder="Hi! How can we help you today?"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    First message displayed to users when they open the chat
                    widget (max 500 characters)
                  </p>
                  <p className="text-xs text-gray-400">
                    {config.welcomeMessage.length}/500 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="agentName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Agent Name
                  </label>
                  <input
                    type="text"
                    id="agentName"
                    value={config.agentName}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        agentName: e.target.value,
                      }))
                    }
                    placeholder="Customer Support"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Name displayed in the chat header (max 100 characters)
                  </p>
                  <p className="text-xs text-gray-400">
                    {config.agentName.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Icon
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a custom icon for the chatbot. This will replace the
                    default icon in chat messages.
                  </p>
                  <ImageUpload
                    value={botIcon}
                    onChange={handleBotIconChange}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={2 * 1024 * 1024} // 2MB
                    uploadPath="/api/admin/chat/config/upload-icon"
                    className="max-w-md"
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: Square image, 64x64px or larger. Max size: 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTest}
                disabled={
                  !config.webhookUrl ||
                  !config.webhookSecret ||
                  !config.apiKey ||
                  testing
                }
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !config.webhookUrl ||
                  !config.webhookSecret ||
                  !config.apiKey
                }
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? 'Saving...'
                  : isConfigured
                    ? 'Update Configuration'
                    : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Integration Instructions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              n8n Integration Guide
            </h3>
          </div>
          <div className="p-6">
            <div className="prose max-w-none text-sm">
              <h4 className="text-base font-medium text-gray-900 mb-3">
                Setup Instructions:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Create a new n8n workflow</li>
                <li>Add a Webhook node as the trigger</li>
                <li>Configure the webhook with the URL and secret above</li>
                <li>Add your AI processing logic (OpenAI, Claude, etc.)</li>
                <li>Return a response in the expected format</li>
              </ol>

              <h4 className="text-base font-medium text-gray-900 mt-6 mb-3">
                Webhook Payload Format:
              </h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                {`{
  "sessionId": "session-uuid",
  "messageId": "message-id", 
  "content": "User message",
  "senderType": "user",
  "messageType": "text",
  "metadata": {},
  "timestamp": "2025-01-01T00:00:00Z"
}`}
              </pre>

              <h4 className="text-base font-medium text-gray-900 mt-6 mb-3">
                Expected Response Format:
              </h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                {`{
  "content": "Bot response message",
  "messageType": "text",
  "metadata": {
    "quickReplies": [
      {"text": "Option 1", "value": "option_1"},
      {"text": "Option 2", "value": "option_2"}
    ],
    "richContent": {
      "type": "card",
      "cards": [...]
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
