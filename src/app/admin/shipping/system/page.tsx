/**
 * System Configuration Page
 * Technical configuration and health monitoring for shipping system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { toast } from 'sonner';
import {
  Save,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Monitor,
  Database,
  Globe,
} from 'lucide-react';

interface SystemHealth {
  database: boolean;
  easyParcelApi: boolean;
  authService: boolean;
  lastChecked: string;
}

interface SystemConfig {
  easyParcelApiKey?: string;
  easyParcelEndpoint?: string;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

interface CredentialStatus {
  hasCredentials: boolean;
  endpoint: string;
  apiKeyMasked?: string;
  lastUpdated?: Date;
  updatedBy?: string;
  isUsingEnvFallback: boolean;
  source?: 'database' | 'environment' | 'none';
  productionMode?: boolean;
  strictMode?: boolean;
}

export default function SystemConfigPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<SystemConfig>({
    debugMode: false,
    logLevel: 'info',
  });
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    redirect('/auth/signin');
    return null;
  }

  useEffect(() => {
    loadSystemConfig();
    checkSystemHealth();
    loadCredentialStatus();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const response = await fetch('/api/admin/shipping/system');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
      }
    } catch (error) {
      console.error('Error loading system config:', error);
      toast.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/shipping/system/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Error checking system health:', error);
    }
  };

  const loadCredentialStatus = async () => {
    try {
      const response = await fetch('/api/admin/shipping/credentials/status');
      if (response.ok) {
        const data = await response.json();
        setCredentialStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading credential status:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!config.easyParcelApiKey || !config.easyParcelEndpoint) {
        toast.error('Please enter both API Key and Endpoint URL');
        return;
      }

      // Save credentials using the new endpoint
      const response = await fetch('/api/admin/shipping/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.easyParcelApiKey,
          apiSecret: config.easyParcelApiKey, // Use same as API key for simplicity
          endpoint: config.easyParcelEndpoint,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('EasyParcel API credentials saved successfully');
        // Refresh status
        await Promise.all([
          checkSystemHealth(),
          loadCredentialStatus(),
        ]);
      } else {
        toast.error(data.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save API credentials');
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async () => {
    setTesting(true);
    try {
      // Test the credentials currently entered in the form
      const testPayload = {
        apiKey: config.easyParcelApiKey || '',
        endpoint: config.easyParcelEndpoint || ''
      };

      // Validate we have all required fields (EasyParcel only needs API key and endpoint)
      if (!testPayload.apiKey || !testPayload.endpoint) {
        toast.error('Please fill in API Key and Endpoint URL before testing');
        return;
      }

      const response = await fetch('/api/admin/shipping/credentials/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`API connection test successful (${data.responseTime}ms response time)`);
        await checkSystemHealth();
      } else {
        toast.error(`API test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing API:', error);
      toast.error('Failed to test API connection');
    } finally {
      setTesting(false);
    }
  };

  const clearCredentials = async () => {
    if (!confirm('Are you sure you want to clear all EasyParcel API credentials? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch('/api/admin/shipping/credentials/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('API credentials cleared successfully');
        // Clear the form
        setConfig({ ...config, easyParcelApiKey: '', easyParcelEndpoint: '' });
        // Refresh status
        await Promise.all([
          checkSystemHealth(),
          loadCredentialStatus(),
        ]);
      } else {
        toast.error(data.error || 'Failed to clear credentials');
      }
    } catch (error) {
      console.error('Error clearing credentials:', error);
      toast.error('Failed to clear credentials');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading system configuration...</span>
      </div>
    );
  }

  // Navigation tabs - consistent across shipping pages
  const tabs: TabConfig[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin/shipping' },
    { id: 'policies', label: 'Shipping Policies', href: '/admin/shipping/policies' },
    { id: 'couriers', label: 'Courier Management', href: '/admin/shipping/couriers' },
    { id: 'orders', label: 'Order Processing', href: '/admin/shipping/orders' },
    { id: 'system', label: 'System Config', href: '/admin/shipping/system' },
  ];

  return (
    <AdminPageLayout
      title="System Configuration"
      subtitle="Configure EasyParcel API credentials and monitor system health"
      tabs={tabs}
      loading={loading}
    >
      <div className="space-y-8">
        {/* System Health Overview */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  System Health
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkSystemHealth}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Last checked: {new Date(health.lastChecked).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-3">
                  {health.database ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-gray-600">
                      {health.database ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {health.easyParcelApi ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">EasyParcel API</p>
                    <p className="text-sm text-gray-600">
                      {health.easyParcelApi ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {health.authService ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Authentication</p>
                    <p className="text-sm text-gray-600">
                      {health.authService ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credential Status - Production Ready Display */}
        {credentialStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API Credential Status
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadCredentialStatus();
                    checkSystemHealth();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Production-ready credential management status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  {credentialStatus.hasCredentials ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Database Credentials</p>
                    <p className="text-sm text-gray-600">
                      {credentialStatus.hasCredentials && !credentialStatus.isUsingEnvFallback
                        ? `Configured (${credentialStatus.endpoint})`
                        : 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {credentialStatus.source === 'database' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : credentialStatus.source === 'environment' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Credential Source</p>
                    <p className="text-sm text-gray-600">
                      {credentialStatus.source === 'database'
                        ? 'Database (Production Ready)'
                        : credentialStatus.source === 'environment'
                          ? 'Environment Variables (Dev Only)'
                          : 'None (Configure Required)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Production Warnings */}
              {credentialStatus.isUsingEnvFallback && (
                <Alert className="mt-4 border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <strong>Development Mode:</strong> Using environment variable fallback.
                    Configure credentials via the form below for production deployment.
                  </AlertDescription>
                </Alert>
              )}

              {!credentialStatus.hasCredentials && (
                <Alert className="mt-4 border-red-500 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription>
                    <strong>Configuration Required:</strong> No EasyParcel API credentials found.
                    Configure credentials below to enable shipping functionality.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Configuration - User-Friendly Section */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              EasyParcel API Configuration
            </CardTitle>
            <CardDescription>
              Configure your EasyParcel shipping API credentials for Malaysia shipping services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  API Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.easyParcelApiKey || ''}
                  onChange={(e) => setConfig({ ...config, easyParcelApiKey: e.target.value })}
                  placeholder="Enter your EasyParcel API key"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from EasyParcel dashboard
                </p>
              </div>

              <div>
                <Label htmlFor="endpoint" className="text-sm font-medium">
                  API Endpoint URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endpoint"
                  type="url"
                  value={config.easyParcelEndpoint || ''}
                  onChange={(e) => setConfig({ ...config, easyParcelEndpoint: e.target.value })}
                  placeholder="Enter EasyParcel API endpoint URL"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Production: https://connect.easyparcel.my<br/>
                  Sandbox: http://demo.connect.easyparcel.my
                </p>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <Button
                onClick={testApiConnection}
                disabled={testing || clearing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Test API Connection
                  </>
                )}
              </Button>

              {credentialStatus?.hasCredentials && (
                <Button
                  onClick={clearCredentials}
                  disabled={clearing || testing}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {clearing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear Credentials
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Settings - Admin Only */}
        {session?.user?.role === 'SUPERADMIN' && (
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-yellow-600" />
                Technical Settings
                <Badge variant="secondary" className="ml-2">Super Admin Only</Badge>
              </CardTitle>
              <CardDescription>
                Advanced debugging and system monitoring settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={config.debugMode}
                  onChange={(e) => setConfig({ ...config, debugMode: e.target.checked })}
                  className="h-4 w-4 text-yellow-600 rounded"
                />
                <Label htmlFor="debugMode">Enable debug mode</Label>
              </div>

              <div>
                <Label htmlFor="logLevel">System Log Level</Label>
                <select
                  id="logLevel"
                  value={config.logLevel}
                  onChange={(e) => setConfig({ ...config, logLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="error">Error Only</option>
                  <option value="warn">Warning & Above</option>
                  <option value="info">Info & Above</option>
                  <option value="debug">Debug (Verbose)</option>
                </select>
              </div>

              {config.debugMode && (
                <Alert className="border-yellow-400 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Debug mode enabled:</strong> This may impact performance and should only be used for troubleshooting. Disable for production use.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button
            onClick={saveConfig}
            disabled={saving}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}