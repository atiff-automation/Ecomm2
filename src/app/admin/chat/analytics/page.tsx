/**
 * Analytics Dashboard - Complete Chat Analytics Implementation
 * Following @CLAUDE.md DRY principles with centralized architecture
 * Replacing placeholder with production-ready analytics functionality
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
import { AnalyticsCharts } from '@/components/chat/analytics/AnalyticsCharts';
import { MetricsOverview } from '@/components/chat/analytics/MetricsOverview';
import { ReportFilters } from '@/components/chat/analytics/ReportFilters';
import { ExportControls } from '@/components/chat/analytics/ExportControls';
import type {
  AnalyticsData,
  ReportConfig,
  AnalyticsExportData,
} from '@/types/chat';

export default function ChatAnalyticsPage() {
  useSession(); // For authentication

  // Core state management - centralized approach
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time updates - Production-ready polling pattern
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isComponentMounted = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Data fetching with improved error handling and stability
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/chat/analytics?range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch analytics: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load analytics data'
      );
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [timeRange]);

  // Setup polling with proper cleanup
  useEffect(() => {
    const startPolling = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Only start polling after initial load is complete and we have data
      if (!loading && !isInitialLoad && analytics) {
        intervalRef.current = setInterval(() => {
          // Only fetch if component is still mounted and not currently loading
          if (isComponentMounted.current && !loading) {
            fetchAnalyticsData();
          }
        }, 60000); // 60 seconds for analytics (less frequent than sessions)
      }
    };

    startPolling();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading, isInitialLoad, analytics, fetchAnalyticsData]);

  // Cleanup on unmount
  useEffect(() => {
    isComponentMounted.current = true;

    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Initial data load and when time range changes
  useEffect(() => {
    setIsInitialLoad(true);
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((newTimeRange: string) => {
    setTimeRange(newTimeRange);
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle report export
  const handleExportReport = useCallback(
    async (config: ReportConfig): Promise<AnalyticsExportData> => {
      try {
        const response = await fetch('/api/admin/chat/analytics/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...config,
            timeRange,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Export failed: ${response.status} ${response.statusText}`
          );
        }

        const contentType =
          response.headers.get('content-type') || 'application/octet-stream';
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `analytics_report_${timeRange}_${new Date().toISOString().split('T')[0]}.${config.format}`;

        const content = await response.arrayBuffer();
        const size = content.byteLength;

        return {
          filename,
          content,
          mimeType: contentType,
          size,
        };
      } catch (error) {
        console.error('Export error:', error);
        throw error;
      }
    },
    [timeRange]
  );

  // Tab configuration for chat navigation
  const chatTabs: TabConfig[] = [
    {
      id: 'sessions',
      label: 'Sessions',
      href: '/admin/chat',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/admin/chat/analytics',
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
      label: 'Archive',
      href: '/admin/chat/archive',
    },
  ];

  // Error state
  if (error && !loading) {
    return (
      <AdminPageLayout
        title="Chat Management"
        subtitle="Monitor and manage customer chat interactions"
        tabs={chatTabs}
        loading={false}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Failed to Load Analytics
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      }
      loading={loading && isInitialLoad}
    >
      <div className="space-y-6">
        {/* Filters and Controls */}
        <ReportFilters
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onExport={handleExportReport}
          onRefresh={handleRefresh}
          disabled={loading}
          loading={loading}
        />

        {/* Metrics Overview */}
        {analytics && (
          <MetricsOverview
            metrics={{
              ...analytics.sessionMetrics,
              ...analytics.messageMetrics,
              ...analytics.performanceMetrics,
            }}
            loading={loading}
          />
        )}

        {/* Charts Dashboard */}
        {analytics && (
          <AnalyticsCharts
            data={analytics}
            loading={loading}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        )}

        {/* Export Controls */}
        <ExportControls
          onExport={handleExportReport}
          timeRange={timeRange}
          disabled={loading}
        />

        {/* Analytics Summary */}
        {analytics && !loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Analytics Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Time Range:</span>
                <span className="ml-2 font-medium">{analytics.timeRange}</span>
              </div>
              <div>
                <span className="text-gray-600">Generated At:</span>
                <span className="ml-2 font-medium">
                  {new Date(analytics.generatedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Sessions:</span>
                <span className="ml-2 font-medium">
                  {analytics.sessionMetrics.totalSessions.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Messages:</span>
                <span className="ml-2 font-medium">
                  {analytics.messageMetrics.totalMessages.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="ml-2 font-medium">
                  {Math.round(analytics.performanceMetrics.averageResponseTime)}
                  ms
                </span>
              </div>
              <div>
                <span className="text-gray-600">Success Rate:</span>
                <span className="ml-2 font-medium">
                  {Math.round(analytics.performanceMetrics.successRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
