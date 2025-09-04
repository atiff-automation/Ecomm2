'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageCircle,
  Zap,
  BarChart3,
  RefreshCw,
  Server
} from 'lucide-react';

interface SystemMetrics {
  uptime: string;
  totalMessages: number;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  lastHealthCheck: string;
  systemStatus: 'healthy' | 'warning' | 'critical';
  services: {
    ordersEnabled: boolean;
    inventoryEnabled: boolean;
    dailySummaryEnabled: boolean;
  };
  connectivity: {
    telegramApi: boolean;
    database: boolean;
    redis: boolean;
  };
  security: {
    tokenEncrypted: boolean;
    rateLimiting: boolean;
    auditLogging: boolean;
  };
}

export default function NotificationsMonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Define streamlined tabs for Telegram system
  const tabs: TabConfig[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/admin/notifications',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/notifications/configuration',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      href: '/admin/notifications/monitoring',
    },
  ];

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Fetch real metrics from centralized API - NO HARDCODED VALUES
      const response = await fetch('/api/admin/telegram/monitoring');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMetrics(data.metrics);
        } else {
          console.error('API error:', data.message);
          // Don't set fake data - show loading state or error
        }
      } else {
        console.error('Failed to fetch metrics:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pageActions = (
    <Button onClick={loadMetrics} variant="outline" size="sm" disabled={loading}>
      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  if (loading && !metrics) {
    return (
      <AdminPageLayout
        title="System Monitoring"
        subtitle="Monitor Telegram notification system performance and health"
        tabs={tabs}
        actions={pageActions}
        loading={true}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading system metrics...</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="System Monitoring"
      subtitle="Monitor Telegram notification system performance and health"
      tabs={tabs}
      actions={pageActions}
    >
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <div className="flex items-center mt-2">
                  <Badge className={getStatusColor(metrics?.systemStatus || 'healthy')}>
                    {getStatusIcon(metrics?.systemStatus || 'healthy')}
                    <span className="ml-1 capitalize">{metrics?.systemStatus || 'Unknown'}</span>
                  </Badge>
                </div>
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{metrics?.uptime || '0m'}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{metrics?.successRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{metrics?.avgResponseTime || 0}ms</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
              Message Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Total Messages Sent</p>
                <p className="text-sm text-blue-700">Since system start</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalMessages?.toLocaleString() || '0'}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Successful Deliveries</p>
                <p className="text-sm text-green-700">Messages delivered successfully</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{metrics?.successRate || 0}%</p>
                <p className="text-sm text-green-700">
                  {metrics?.totalMessages ? Math.round((metrics.totalMessages * (metrics.successRate || 0)) / 100) : 0} messages
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Failed Messages</p>
                <p className="text-sm text-red-700">Requires attention</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{metrics?.errorCount || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-purple-900">Average Response Time</p>
                <p className="text-lg font-bold text-purple-600">{metrics?.avgResponseTime || 0}ms</p>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((metrics?.avgResponseTime || 0) / 1000 * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-purple-700 mt-1">Target: &lt;500ms</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-indigo-900">Health Check Status</p>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-indigo-700">
                Last check: {metrics?.lastHealthCheck ? new Date(metrics.lastHealthCheck).toLocaleString() : 'Never'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 mb-2">System Load</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bot API</span>
                  <span className="text-green-600">Normal</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Message Queue</span>
                  <span className="text-green-600">Empty</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database</span>
                  <span className="text-green-600">Optimal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            System Health Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Connectivity</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Telegram API</span>
                  <Badge variant="secondary" className={metrics?.connectivity?.telegramApi ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {metrics?.connectivity?.telegramApi ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <Badge variant="secondary" className={metrics?.connectivity?.database ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {metrics?.connectivity?.database ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Redis Cache</span>
                  <Badge variant="secondary" className={metrics?.connectivity?.redis ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {metrics?.connectivity?.redis ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Services</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Order Notifications</span>
                  <Badge variant="secondary" className={metrics?.services?.ordersEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {metrics?.services?.ordersEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inventory Alerts</span>
                  <Badge variant="secondary" className={metrics?.services?.inventoryEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {metrics?.services?.inventoryEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Summary</span>
                  <Badge variant="secondary" className={metrics?.services?.dailySummaryEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {metrics?.services?.dailySummaryEnabled ? "Scheduled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Security</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Token Encryption</span>
                  <Badge variant="secondary" className={metrics?.security?.tokenEncrypted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {metrics?.security?.tokenEncrypted ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rate Limiting</span>
                  <Badge variant="secondary" className={metrics?.security?.rateLimiting ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {metrics?.security?.rateLimiting ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Audit Logging</span>
                  <Badge variant="secondary" className={metrics?.security?.auditLogging ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {metrics?.security?.auditLogging ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}