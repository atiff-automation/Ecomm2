/**
 * Centralized Session Data Hook
 * Single source of truth for session management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChatSession,
  ChatMetrics,
  FilterState,
  SortConfig,
  PaginationConfig,
  UseSessionDataReturn,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  DEFAULT_PAGINATION,
} from '@/types/chat';
import {
  filterSessions,
  sortSessions,
  calculateMetrics,
  debounce,
  STORAGE_KEYS,
  saveToLocalStorage,
  loadFromLocalStorage,
  handleApiError,
} from '@/utils/chat';

export const useSessionData = (): UseSessionDataReturn => {
  // State management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state with localStorage persistence
  const [filters, setFilters] = useState<FilterState>(() =>
    loadFromLocalStorage(STORAGE_KEYS.CHAT_FILTERS, DEFAULT_FILTERS)
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(() =>
    loadFromLocalStorage(STORAGE_KEYS.CHAT_SORT, DEFAULT_SORT)
  );
  const [pagination, setPagination] = useState<PaginationConfig>(() =>
    loadFromLocalStorage(STORAGE_KEYS.CHAT_PAGINATION, DEFAULT_PAGINATION)
  );

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch sessions data
  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/chat/sessions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching sessions:', err);
    }
  }, []);

  // Fetch metrics data
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      // Don't set error for metrics as it's not critical
    }
  }, []);

  // Combined refetch function
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSessions(), fetchMetrics()]);
    } finally {
      setLoading(false);
    }
  }, [fetchSessions, fetchMetrics]);

  // Debounced filter update to prevent excessive localStorage writes
  const debouncedSaveFilters = useMemo(
    () => debounce((newFilters: FilterState) => {
      saveToLocalStorage(STORAGE_KEYS.CHAT_FILTERS, newFilters);
    }, 500),
    []
  );

  // Filter update handler
  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    debouncedSaveFilters(newFilters);
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSaveFilters]);

  // Sort update handler
  const updateSort = useCallback((newSort: SortConfig) => {
    setSortConfig(newSort);
    saveToLocalStorage(STORAGE_KEYS.CHAT_SORT, newSort);
    // Reset pagination when sort changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Pagination update handler
  const updatePagination = useCallback((newPagination: PaginationConfig) => {
    setPagination(newPagination);
    saveToLocalStorage(STORAGE_KEYS.CHAT_PAGINATION, newPagination);
  }, []);

  // Memoized filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    const filtered = filterSessions(sessions, filters);
    const sorted = sortSessions(filtered, sortConfig);

    // Update pagination total
    setPagination(prev => ({
      ...prev,
      total: sorted.length,
    }));

    return sorted;
  }, [sessions, filters, sortConfig]);

  // Memoized paginated sessions
  const paginatedSessions = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredSessions.slice(startIndex, endIndex);
  }, [filteredSessions, pagination.page, pagination.pageSize]);

  // Initial data fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only fetch new data if component is still mounted and visible
      if (document.visibilityState === 'visible') {
        fetchSessions();
        fetchMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSessions, fetchMetrics]);

  // Page visibility handler for efficient updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoRefresh) {
        // Refresh data when tab becomes visible
        fetchSessions();
        fetchMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchSessions, fetchMetrics]);

  return {
    sessions: paginatedSessions,
    metrics,
    filteredSessions,
    loading,
    error,
    refetch,
    updateFilters,
    updateSort,
    updatePagination,

    // Additional utilities
    totalSessions: sessions.length,
    filteredCount: filteredSessions.length,
    currentPage: pagination.page,
    totalPages: Math.ceil(filteredSessions.length / pagination.pageSize),
    hasNextPage: pagination.page < Math.ceil(filteredSessions.length / pagination.pageSize),
    hasPreviousPage: pagination.page > 1,

    // Auto-refresh controls
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,

    // Current filter and sort state
    filters,
    sortConfig,
    pagination,
  };
};