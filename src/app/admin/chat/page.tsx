/**
 * Enhanced Sessions Tab - Consolidated Chat Management
 * Following @CLAUDE.md DRY principles with centralized architecture
 * Implementing CHAT_MANAGEMENT_ENHANCEMENT_PLAN.md Phase 3 structure
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';
// Import directly with correct default/named imports
import MetricsCards from '@/components/chat/MetricsCards';
import { SessionFilters } from '@/components/chat/SessionFilters';
import { SessionsTable } from '@/components/chat/SessionsTable';
import { MessagesChart } from '@/components/chat/MessagesChart';
// Removed problematic useRealTimeUpdates hook - using production polling pattern instead
import type {
  ChatSession,
  ChatMetrics,
  FilterState,
  SortConfig,
  PaginationConfig,
} from '@/types/chat';
import { filterSessions, sortSessions } from '@/utils/chat';

export default function SessionsPage() {
  useSession();

  // Core state management - centralized approach
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [metrics, setMetrics] = useState<ChatMetrics>({
    totalSessions: 0,
    activeSessions: 0,
    totalMessages: 0,
    averageSessionDuration: 0,
    todaysSessions: 0,
    messagesPerSession: 0,
  });

  // @CLAUDE.md - Time range selector state for clear metrics display
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Enhanced filtering state following plan specification
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days instead of 365
      to: new Date(),
    },
    userType: 'all',
    durationFilter: 'all',
    messageCountFilter: 'all',
  });

  // Sorting and pagination state following plan
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'lastActivity',
    direction: 'desc',
  });

  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 50,
    total: 0,
  });

  const [loading, setLoading] = useState(true);

  // Data fetching with improved error handling and stability
  const fetchChatData = useCallback(async () => {
    try {
      setLoading(true);

      const [sessionsResponse, metricsResponse] = await Promise.all([
        fetch('/api/admin/chat/sessions'),
        fetch(`/api/admin/chat/metrics?range=${timeRange}`),
      ]);

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      } else {
        console.error('Sessions API Error:', {
          status: sessionsResponse.status,
          statusText: sessionsResponse.statusText,
        });
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(
          metricsData.metrics || {
            totalSessions: 0,
            activeSessions: 0,
            totalMessages: 0,
            averageSessionDuration: 0,
            todaysSessions: 0,
            messagesPerSession: 0,
          }
        );
      } else {
        console.error('Metrics API Error:', {
          status: metricsResponse.status,
          statusText: metricsResponse.statusText,
        });
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [timeRange]);

  // Real-time updates for session list - Fixed race condition with loading state management
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Real-time updates - Production-ready polling pattern
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isComponentMounted = useRef(true);

  // Setup polling with proper cleanup
  useEffect(() => {
    const startPolling = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Only start polling after initial load is complete and we have data
      if (!loading && !isInitialLoad && sessions.length > 0) {
        intervalRef.current = setInterval(() => {
          // Only fetch if component is still mounted and not currently loading
          if (isComponentMounted.current && !loading) {
            fetchChatData();
          }
        }, 30000); // 30 seconds
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
  }, [loading, isInitialLoad, sessions.length, fetchChatData]); // Dependencies that should trigger polling restart

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
    setIsInitialLoad(true); // Reset for new time range
    fetchChatData();
  }, [fetchChatData, timeRange]); // Include fetchChatData in dependencies

  // Data processing following centralized utilities
  const filteredSessions = filterSessions(sessions, filters);
  const sortedSessions = sortSessions(filteredSessions, sortConfig);

  // Pagination logic
  const paginatedSessions = sortedSessions.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  // Update pagination total when filtered data changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredSessions.length,
    }));
  }, [filteredSessions.length]);

  // Update pagination when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      // Sessions loaded successfully, no action needed
    }
  }, [sessions]);

  // Event handlers following plan component structure
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (key: keyof ChatSession) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleViewSession = (sessionId: string) => {
    window.open(`/admin/chat/sessions/${sessionId}`, '_blank');
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/admin/chat/sessions/${sessionId}/end`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        fetchChatData();
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Tab configuration for chat navigation
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

  // Component rendering - loading state and data management

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      actions={
        <div className="flex items-center gap-2">
          {/* @CLAUDE.md - Time range selector for clear metrics context */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchChatData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
      loading={loading}
    >
      {/* Analytics Dashboard - Chart and Compact Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Messages Chart - 3/4 width */}
        <div className="lg:col-span-3">
          <MessagesChart timeRange={timeRange} loading={loading} />
        </div>

        {/* Compact Metrics - 1/4 width, stacked vertically */}
        <div className="lg:col-span-1 flex flex-col justify-between h-full">
          <MetricsCards metrics={metrics} loading={loading} variant="compact" />
        </div>
      </div>

      {/* Filters Bar - Horizontal layout matching products page */}
      <SessionFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Sessions Table - Clean container */}
      <div className="bg-white rounded-lg border border-gray-200">
        <SessionsTable
          sessions={paginatedSessions}
          onViewSession={handleViewSession}
          onEndSession={handleEndSession}
          sortConfig={sortConfig}
          onSort={handleSort}
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </AdminPageLayout>
  );
}
