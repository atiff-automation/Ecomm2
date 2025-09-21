/**
 * Operations Tab - Unified Queue & Monitoring
 * Consolidated view following DRY principles
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  TrendingUp,
  Server,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
}

interface MonitoringMetrics {
  webhookHealth: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  uptime: number;
}

interface QueueJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  processingTime?: number;
  error?: string;
}

export default function OperationsPage() {
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [monitoringMetrics, setMonitoringMetrics] =
    useState<MonitoringMetrics | null>(null);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('queue');

  // Fetch queue metrics and jobs
  const fetchQueueData = async () => {
    try {
      const [metricsResponse, jobsResponse] = await Promise.all([
        fetch('/api/admin/chat/queue/stats'),
        fetch('/api/admin/chat/queue'),
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        // Transform API response to match expected interface
        const transformedMetrics: QueueMetrics = {
          totalJobs: metricsData.total || 0,
          pendingJobs: metricsData.pending || 0,
          processingJobs: metricsData.processing || 0,
          completedJobs: metricsData.completed || 0,
          failedJobs: metricsData.failed || 0,
          averageProcessingTime: metricsData.processingRate || 0,
        };
        setQueueMetrics(transformedMetrics);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setQueueJobs(jobsData.items || []);
      }
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError('Failed to load queue data');
    }
  };

  // Fetch monitoring metrics
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/admin/chat/monitoring/metrics');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match expected interface
        const transformedMetrics: MonitoringMetrics = {
          webhookHealth:
            data.healthStatus === 'HEALTHY'
              ? 'healthy'
              : data.healthStatus === 'DEGRADED'
                ? 'degraded'
                : 'critical',
          responseTime: data.avgResponseTime || 0,
          successRate: data.successRate || 0,
          errorRate: 100 - (data.successRate || 0),
          totalRequests: data.totalDeliveries || 0,
          uptime: data.successRate ? data.successRate / 100 : 0,
        };
        setMonitoringMetrics(transformedMetrics);
      }
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Failed to load monitoring data');
    }
  };

  // Combined data fetch
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchQueueData(), fetchMonitoringData()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchAllData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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

  if (loading) {
    return (
      <AdminPageLayout
        title="Chat Management"
        subtitle="Monitor and manage customer chat interactions"
        tabs={chatTabs}
        loading={true}
      >
        <OperationsPageSkeleton />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      loading={loading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Operations Center
            </h2>
            <p className="text-gray-600">
              Monitor queue performance and webhook health
            </p>
          </div>
          <Button onClick={fetchAllData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Unified Operations Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Queue Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Performance Monitoring</span>
            </TabsTrigger>
          </TabsList>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="space-y-6">
            {/* Queue Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Jobs
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {queueMetrics?.totalJobs || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Processing
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {queueMetrics?.processingJobs || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {queueMetrics?.completedJobs || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Failed
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {queueMetrics?.failedJobs || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Queue Jobs Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recent Jobs
                  </h3>
                  <span className="text-sm text-gray-500">
                    {queueJobs.length} jobs
                  </span>
                </div>
              </div>

              {/* Table Content */}
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queueJobs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center">
                              <Database className="h-12 w-12 text-gray-300 mb-4" />
                              <span className="text-sm font-medium">
                                No jobs found
                              </span>
                              <span className="text-xs text-gray-400 mt-1">
                                Queue is currently empty
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        queueJobs.map(job => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {job.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(job.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {job.processingTime
                                ? `${job.processingTime}ms`
                                : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Performance Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {/* Monitoring Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Health Status
                      </p>
                      <div className="mt-2">
                        <Badge
                          className={getHealthColor(
                            monitoringMetrics?.webhookHealth || 'unknown'
                          )}
                        >
                          {monitoringMetrics?.webhookHealth || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Server className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Response Time
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {monitoringMetrics?.responseTime || 0}ms
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Success Rate
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {monitoringMetrics?.successRate || 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Requests
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {monitoringMetrics?.totalRequests?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Uptime
                    </span>
                    <span className="text-sm text-gray-900">
                      {Math.round((monitoringMetrics?.uptime || 0) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(monitoringMetrics?.uptime || 0) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Success Rate
                    </span>
                    <span className="text-sm text-gray-900">
                      {monitoringMetrics?.successRate || 0}%
                    </span>
                  </div>
                  <Progress
                    value={monitoringMetrics?.successRate || 0}
                    className="h-2"
                  />
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Error Rate:</span>
                      <span className="ml-2 font-medium">
                        {monitoringMetrics?.errorRate || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Processing:</span>
                      <span className="ml-2 font-medium">
                        {queueMetrics?.averageProcessingTime || 0}ms
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
}

const OperationsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
