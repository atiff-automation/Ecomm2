'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Database,
  Globe,
  Zap
} from 'lucide-react';

interface WebhookMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  successRate: number;
  avgResponseTime: number;
  lastHealthCheck: string | null;
  healthStatus: string;
  queueSize: number;
}

interface RecentActivity {
  id: string;
  messageId: string;
  status: string;
  attempts: number;
  createdAt: string;
  lastError: string | null;
  webhookUrl: string;
}

export default function WebhookMonitoringPage() {
  const [metrics, setMetrics] = useState<WebhookMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMonitoringData = async () => {
    try {
      setError(null);
      
      const [metricsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/chat/monitoring/metrics'),
        fetch('/api/admin/chat/monitoring/activity')
      ]);

      if (!metricsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const metricsData = await metricsResponse.json();
      const activityData = await activityResponse.json();

      setMetrics(metricsData);
      setRecentActivity(activityData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600 bg-green-100';
      case 'DEGRADED':
        return 'text-yellow-600 bg-yellow-100';
      case 'UNHEALTHY':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchMonitoringData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No monitoring data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Last Updated */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Monitoring</h1>
          <p className="text-gray-600">Real-time performance and health metrics</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-900">
            {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchMonitoringData}
            className="mt-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Status */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Health Status</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.healthStatus}</p>
            </div>
            <div className={`p-3 rounded-full ${getHealthStatusColor(metrics.healthStatus)}`}>
              <Globe className="h-6 w-6" />
            </div>
          </div>
          {metrics.lastHealthCheck && (
            <p className="text-xs text-gray-500 mt-2">
              Last check: {new Date(metrics.lastHealthCheck).toLocaleString()}
            </p>
          )}
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.successfulDeliveries} of {metrics.totalDeliveries} successful
          </p>
        </div>

        {/* Queue Size */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Queue Size</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.queueSize}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.pendingDeliveries} pending
          </p>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.avgResponseTime}ms</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Average delivery time
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Successful</span>
              </div>
              <span className="font-medium text-green-600">{metrics.successfulDeliveries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="font-medium text-red-600">{metrics.failedDeliveries}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-medium text-yellow-600">{metrics.pendingDeliveries}</span>
            </div>
            <hr className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{metrics.totalDeliveries}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Message {activity.messageId.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Attempt {activity.attempts}
                    </p>
                    {activity.lastError && (
                      <p className="text-xs text-red-600 truncate max-w-32" title={activity.lastError}>
                        {activity.lastError}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Section */}
      {metrics.failedDeliveries > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="text-red-800 font-medium">Attention Required</h4>
          </div>
          <p className="text-red-700 mt-1">
            {metrics.failedDeliveries} webhook deliveries have failed. Check the Queue management for details.
          </p>
        </div>
      )}
    </div>
  );
}