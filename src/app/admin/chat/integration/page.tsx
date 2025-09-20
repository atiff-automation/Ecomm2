'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Play,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface ChatConfig {
  id?: string;
  webhookUrl: string;
  webhookSecret: string;
  apiKey: string;
  sessionTimeoutMinutes: number;
  maxMessageLength: number;
  rateLimitMessages: number;
  rateLimitWindowMs: number;
  queueEnabled: boolean;
  queueMaxRetries: number;
  queueRetryDelayMs: number;
  queueBatchSize: number;
  websocketEnabled: boolean;
  websocketPort: number;
  isActive: boolean;
  verified: boolean;
  healthStatus: string;
  lastHealthCheck?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ChatIntegrationPage() {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<{
    instructions: string;
    curlExample: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    webhookUrl: '',
    webhookSecret: '',
    apiKey: '',
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  // Auto-validate webhook URL when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateWebhookUrl(formData.webhookUrl);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.webhookUrl]);

  // Generate setup instructions when form is complete
  useEffect(() => {
    const generateInstructions = async () => {
      if (!formData.webhookUrl || !formData.webhookSecret || !formData.apiKey) {
        setSetupInstructions(null);
        return;
      }

      try {
        const response = await fetch('/api/admin/chat/utils', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_setup_instructions',
            webhookUrl: formData.webhookUrl,
            webhookSecret: formData.webhookSecret,
            apiKey: formData.apiKey,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setSetupInstructions(data.setup);
        }
      } catch (error) {
        console.error('Failed to generate setup instructions:', error);
      }
    };

    generateInstructions();
  }, [formData.webhookUrl, formData.webhookSecret, formData.apiKey]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chat/config');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
          setFormData({
            webhookUrl: data.config.webhookUrl || '',
            webhookSecret: data.config.webhookSecret || '',
            apiKey: data.config.apiKey || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!formData.webhookUrl || !formData.webhookSecret || !formData.apiKey) {
      setTestResult({
        success: false,
        message: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setSaving(true);
      setTestResult(null);

      const response = await fetch('/api/admin/chat/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
        });
        await loadConfiguration(); // Reload to get updated config
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to save configuration',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error while saving configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) {
      setTestResult({
        success: false,
        message: 'Please save configuration first',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/admin/chat/config', {
        method: 'PATCH',
      });

      const data = await response.json();

      setTestResult({
        success: data.success && data.verified,
        message: data.message || 'Test completed',
      });

      // Reload configuration to get updated health status
      await loadConfiguration();
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error during connection test',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateWebhookSecret = async () => {
    try {
      setGenerating('secret');
      const response = await fetch('/api/admin/chat/utils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_secret' }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, webhookSecret: data.secret }));
      }
    } catch (error) {
      console.error('Failed to generate webhook secret:', error);
    } finally {
      setGenerating(null);
    }
  };

  const generateApiKey = async () => {
    try {
      setGenerating('apiKey');
      const response = await fetch('/api/admin/chat/utils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_api_key' }),
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, apiKey: data.apiKey }));
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setGenerating(null);
    }
  };

  const validateWebhookUrl = async (url: string) => {
    if (!url) {
      setUrlValidation(null);
      return;
    }

    try {
      const response = await fetch('/api/admin/chat/utils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_url', webhookUrl: url }),
      });

      const data = await response.json();
      if (data.success) {
        setUrlValidation(data.validation);
      }
    } catch (error) {
      console.error('Failed to validate URL:', error);
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
          <h1 className="text-3xl font-bold">n8n Chat Integration</h1>
          <p className="text-gray-600 mt-1">
            Configure seamless integration with n8n Cloud for automated chat
            workflows
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-2">
            <Badge variant={config.isActive ? 'default' : 'secondary'}>
              {config.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={config.verified ? 'default' : 'destructive'}>
              {config.verified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Quick Setup</TabsTrigger>
          <TabsTrigger value="testing">Connection Test</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                n8n Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure your n8n Cloud webhook endpoints and security
                credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">n8n Webhook URL *</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-n8n-instance.app.n8n.cloud/webhook/chat"
                  value={formData.webhookUrl}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      webhookUrl: e.target.value,
                    }))
                  }
                  className={
                    urlValidation?.isValid === false
                      ? 'border-red-500'
                      : urlValidation?.isValid === true
                        ? 'border-green-500'
                        : ''
                  }
                />
                <p className="text-xs text-gray-500">
                  The webhook URL from your n8n workflow (Webhook trigger node)
                </p>

                {urlValidation && (
                  <div className="space-y-1">
                    {urlValidation.errors.length > 0 && (
                      <div className="text-xs text-red-600 space-y-1">
                        {urlValidation.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    )}
                    {urlValidation.warnings.length > 0 && (
                      <div className="text-xs text-yellow-600 space-y-1">
                        {urlValidation.warnings.map((warning, index) => (
                          <div key={index}>⚠ {warning}</div>
                        ))}
                      </div>
                    )}
                    {urlValidation.isValid &&
                      urlValidation.errors.length === 0 && (
                        <div className="text-xs text-green-600">
                          ✓ URL format is valid
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret *</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    placeholder="Enter or generate a secure secret"
                    value={formData.webhookSecret}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        webhookSecret: e.target.value,
                      }))
                    }
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateWebhookSecret}
                    disabled={generating === 'secret'}
                    className="whitespace-nowrap"
                  >
                    {generating === 'secret' ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Used for HMAC signature verification to secure webhook calls
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key *</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    placeholder="Enter or generate an API key"
                    value={formData.apiKey}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, apiKey: e.target.value }))
                    }
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateApiKey}
                    disabled={generating === 'apiKey'}
                    className="whitespace-nowrap"
                  >
                    {generating === 'apiKey' ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Additional authentication layer for webhook requests
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={loadConfiguration}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {testResult && (
                <Alert>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {config && config.webhookUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Details</CardTitle>
                <CardDescription>
                  Use these values in your n8n workflow configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Our Webhook Endpoint (for n8n HTTP Request node)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/api/chat/webhook`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/api/chat/webhook`,
                          'endpoint'
                        )
                      }
                    >
                      {copied === 'endpoint' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Required Headers</Label>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                      x-webhook-signature: sha256=[signature]
                      <br />
                      x-api-key: {config.apiKey ? '[CONFIGURED]' : '[NOT SET]'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div
                          className={`w-2 h-2 rounded-full ${config.verified ? 'bg-green-500' : 'bg-red-500'}`}
                        ></div>
                        Connection:{' '}
                        {config.verified ? 'Verified' : 'Not verified'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last check:{' '}
                        {config.lastHealthCheck
                          ? new Date(config.lastHealthCheck).toLocaleString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {setupInstructions && (
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions for n8n Engineers</CardTitle>
                <CardDescription>
                  Copy these instructions and provide them to your n8n workflow
                  development team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Complete Integration Instructions</Label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {setupInstructions.instructions}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        setupInstructions.instructions,
                        'instructions'
                      )
                    }
                  >
                    {copied === 'instructions' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Instructions
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Test cURL Command</Label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {setupInstructions.curlExample}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(setupInstructions.curlExample, 'curl')
                    }
                  >
                    {copied === 'curl' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy cURL Command
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Share with n8n Team:</strong> These instructions
                    contain everything your n8n engineers need to configure the
                    webhook integration, including security requirements and
                    testing procedures.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Connection Testing
              </CardTitle>
              <CardDescription>
                Test the integration between your e-commerce system and n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Current Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Configuration:</span>
                      <span
                        className={config ? 'text-green-600' : 'text-red-600'}
                      >
                        {config ? 'Loaded' : 'Not configured'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Webhook URL:</span>
                      <span
                        className={
                          config?.webhookUrl ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {config?.webhookUrl ? 'Set' : 'Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Security:</span>
                      <span
                        className={
                          config?.webhookSecret && config?.apiKey
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {config?.webhookSecret && config?.apiKey
                          ? 'Configured'
                          : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Health Status:</span>
                      <span
                        className={
                          config?.healthStatus === 'HEALTHY'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }
                      >
                        {config?.healthStatus || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Test Connection</h4>
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing || !config}
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test n8n Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {testResult && (
                <Alert>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  What This Test Does
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sends a test payload to your n8n webhook URL</li>
                  <li>• Verifies the connection and response</li>
                  <li>• Validates security headers and authentication</li>
                  <li>• Updates the health status in real-time</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Documentation</CardTitle>
              <CardDescription>
                Resources for your n8n workflow development team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Quick Reference</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Webhook Endpoint:</strong>
                      <br />
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        POST /api/chat/webhook
                      </code>
                    </div>
                    <div>
                      <strong>Required Headers:</strong>
                      <br />
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        x-webhook-signature
                        <br />
                        x-api-key
                      </code>
                    </div>
                    <div>
                      <strong>Response Format:</strong>
                      <br />
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        JSON with sessionId & response
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Resources</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Complete Integration Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Example n8n Workflows
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Payload Specifications
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>For n8n Engineers:</strong> Complete documentation
                  with examples, payload formats, and workflow templates will be
                  available once this integration is saved and verified. Contact
                  your system administrator for access.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
