/**
 * Enhanced Sessions Tab - Consolidated Chat Management
 * Following @CLAUDE.md DRY principles with centralized architecture
 * Implementing CHAT_MANAGEMENT_ENHANCEMENT_PLAN.md Phase 3 structure
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Import directly with correct default/named imports
import MetricsCards from '@/components/chat/MetricsCards';
import { SessionFilters } from '@/components/chat/SessionFilters';
import { SessionsTable } from '@/components/chat/SessionsTable';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import type {
  ChatSession,
  ChatMetrics,
  FilterState,
  SortConfig,
  PaginationConfig
} from '@/types/chat';
import {
  filterSessions,
  sortSessions,
  calculateMetrics
} from '@/utils/chat';

export default function SessionsPage() {
  const { data: session } = useSession();

  // Core state management - centralized approach
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [metrics, setMetrics] = useState<ChatMetrics>({
    totalSessions: 0,
    activeSessions: 0,
    totalMessages: 0,
    averageSessionDuration: 0,
    todaysSessions: 0,
    responseTime: 0,
  });

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

  // Selection and export state
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [loading, setLoading] = useState(true);

  // Data fetching following centralized pattern
  const fetchChatData = async () => {
    try {
      setLoading(true);

      // Parallel data fetching for optimal performance
      const [sessionsResponse, metricsResponse] = await Promise.all([
        fetch('/api/admin/chat/sessions'),
        fetch('/api/admin/chat/metrics'),
      ]);

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        // console.log('🔍 Frontend Sessions Debug:', {
        //   sessionsCount: sessionsData.sessions?.length || 0,
        //   paginationTotal: sessionsData.pagination?.total,
        // });
        setSessions(sessionsData.sessions || []);
      } else {
        console.error('🔍 Frontend Sessions Error:', {
          status: sessionsResponse.status,
          statusText: sessionsResponse.statusText
        });
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics || metrics);
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates for session list - COMPLETELY DISABLED to fix race condition
  // const realTimeUpdates = useRealTimeUpdates({
  //   enabled: false, // TEMPORARILY DISABLED - was causing race condition with initial load
  //   interval: 30000, // 30 seconds
  //   onUpdate: fetchChatData,
  //   onError: (error) => {
  //     console.warn('Real-time update failed:', error);
  //   },
  // });

  // Initial data load
  useEffect(() => {
    fetchChatData();
  }, []);

  // Data processing following centralized utilities
  const filteredSessions = filterSessions(sessions, filters);
  const sortedSessions = sortSessions(filteredSessions, sortConfig);

  // Pagination logic
  const paginatedSessions = sortedSessions.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  // Debug logging (remove in production)
  // console.log('🔍 Session Processing Debug:', {
  //   originalSessions: sessions.length,
  //   filteredSessions: filteredSessions.length,
  //   paginatedSessions: paginatedSessions.length,
  // });

  // Update pagination total when filtered data changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredSessions.length,
    }));
  }, [filteredSessions.length]);

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
      const response = await fetch(`/api/admin/chat/sessions/${sessionId}/end`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchChatData();
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Enhanced export functionality
  const handleExport = async () => {
    if (selectedSessions.length === 0) {
      alert('Please select sessions to export');
      return;
    }

    try {
      setIsExporting(true);

      const response = await fetch('/api/admin/chat/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionIds: selectedSessions,
          format: exportFormat,
          includeMessages: true,
          dateRange: {
            from: filters.dateRange.from.toISOString(),
            to: filters.dateRange.to.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download handling
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `chat_export_${selectedSessions.length}_sessions_${new Date().toISOString().split('T')[0]}.${exportFormat}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clear selection after successful export
      setSelectedSessions([]);

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export sessions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSession = (sessionId: string) => {
    setSelectedSessions([sessionId]);
    // Trigger export immediately for single session
    setTimeout(() => handleExport(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Session Management</h2>
          <p className="text-gray-600">
            Enhanced session management with metrics and export capabilities
          </p>
        </div>
        <Button onClick={fetchChatData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* 1. Metrics Dashboard (Top Section) - Following Plan Structure */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* 2. Advanced Filters (Middle Section) - Following Plan Structure */}
      <SessionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        selectedCount={selectedSessions.length}
        isExporting={isExporting}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
      />

      {/* 3. Sessions Table (Main Section) - Following Plan Structure */}
      <SessionsTable
        sessions={paginatedSessions}
        selectedSessions={selectedSessions}
        onSelectionChange={setSelectedSessions}
        onExportSession={handleExportSession}
        onViewSession={handleViewSession}
        onEndSession={handleEndSession}
        sortConfig={sortConfig}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
}