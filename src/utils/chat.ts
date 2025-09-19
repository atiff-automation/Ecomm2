/**
 * Shared Chat Utility Functions
 * Centralized utility functions following DRY principles
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  ChatSession,
  ChatMetrics,
  FilterState,
  SortConfig,
  ExportOptions,
  ValidationResult,
  SessionStatus,
  UserType,
  DurationFilter,
  MessageCountFilter
} from '@/types/chat';

// Utility for className merging (consistent with existing codebase)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date and Time Utilities
export const formatDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  return `${diffMins}m`;
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
};

// Status and Badge Utilities
export const getStatusColor = (status: SessionStatus): string => {
  const statusColors: Record<SessionStatus, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    ended: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return statusColors[status] || statusColors.ended;
};

export const getStatusIcon = (status: SessionStatus): string => {
  const statusIcons: Record<SessionStatus, string> = {
    active: '🟢',
    ended: '⚪',
  };
  return statusIcons[status] || statusIcons.ended;
};

export const getDisplayStatus = (status: SessionStatus): string => {
  const displayStatuses: Record<SessionStatus, string> = {
    active: 'Active',
    ended: 'Ended',
  };
  return displayStatuses[status] || 'Ended';
};

export const getUserTypeLabel = (session: ChatSession): UserType => {
  return session.userEmail ? 'authenticated' : 'anonymous';
};

// Session Classification Utilities
export const getDurationCategory = (session: ChatSession): DurationFilter => {
  const duration = session.duration || 0;
  if (duration < 5 * 60) return 'short'; // < 5 minutes
  if (duration < 30 * 60) return 'medium'; // 5-30 minutes
  return 'long'; // > 30 minutes
};

export const getMessageCountCategory = (messageCount: number): MessageCountFilter => {
  if (messageCount < 5) return 'low';
  if (messageCount < 20) return 'medium';
  return 'high';
};

// Filtering Utilities
export const filterSessions = (sessions: ChatSession[], filters: FilterState): ChatSession[] => {
  return sessions.filter(session => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        session.sessionId.toLowerCase().includes(searchTerm) ||
        session.userEmail?.toLowerCase().includes(searchTerm) ||
        session.ipAddress?.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Status filter - simplified to active/ended only
    if (filters.status !== 'all' && session.status !== filters.status) {
      return false;
    }

    // Date range filter
    const sessionDate = new Date(session.startedAt);
    if (sessionDate < filters.dateRange.from || sessionDate > filters.dateRange.to) {
      return false;
    }

    // User type filter
    if (filters.userType !== 'all') {
      const userType = getUserTypeLabel(session);
      if (userType !== filters.userType) return false;
    }

    // Duration filter
    if (filters.durationFilter !== 'all') {
      const durationCategory = getDurationCategory(session);
      if (durationCategory !== filters.durationFilter) return false;
    }

    // Message count filter
    if (filters.messageCountFilter !== 'all') {
      const messageCategory = getMessageCountCategory(session.messageCount);
      if (messageCategory !== filters.messageCountFilter) return false;
    }

    return true;
  });
};

// Sorting Utilities
export const sortSessions = (sessions: ChatSession[], sortConfig: SortConfig): ChatSession[] => {
  return [...sessions].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    let comparison = 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      // Convert to string for comparison
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
};

// Metrics Calculation Utilities
export const calculateMetrics = (sessions: ChatSession[]): Partial<ChatMetrics> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const todaysSessions = sessions.filter(s =>
    new Date(s.startedAt) >= today
  ).length;
  const yesterdaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= yesterday && sessionDate < today;
  }).length;

  // Calculate average session duration for ended sessions
  const endedSessions = sessions.filter(s => s.status === 'ended' && s.duration);
  const averageSessionDuration = endedSessions.length > 0
    ? endedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / endedSessions.length
    : 0;

  return {
    totalSessions: sessions.length,
    activeSessions,
    totalMessages,
    averageSessionDuration,
    todaysSessions,
    yesterdaySessions,
  };
};

// Validation Utilities
export const validateExportOptions = (options: ExportOptions): ValidationResult => {
  const errors: string[] = [];

  if (!options.sessionIds || options.sessionIds.length === 0) {
    errors.push('At least one session must be selected for export');
  }

  if (options.sessionIds.length > 1000) {
    errors.push('Maximum 1000 sessions can be exported at once');
  }

  const dateRangeDays = Math.ceil(
    (options.dateRange.to.getTime() - options.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dateRangeDays > 365) {
    errors.push('Date range cannot exceed 1 year');
  }

  if (options.dateRange.from > options.dateRange.to) {
    errors.push('Start date must be before end date');
  }

  if (!['pdf', 'csv', 'json'].includes(options.format)) {
    errors.push('Invalid export format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDateRange = (from: Date, to: Date): ValidationResult => {
  const errors: string[] = [];

  if (from > to) {
    errors.push('Start date must be before end date');
  }

  if (to > new Date()) {
    errors.push('End date cannot be in the future');
  }

  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    errors.push('Date range cannot exceed 1 year');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Data Formatting Utilities
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const generateSessionId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateExportFileName = (format: string, sessionCount: number): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const sessionText = sessionCount === 1 ? 'session' : 'sessions';
  return `chat_export_${sessionCount}_${sessionText}_${timestamp}.${format}`;
};

// Array and Object Utilities
export const groupSessionsByDate = (sessions: ChatSession[]): Record<string, ChatSession[]> => {
  return sessions.reduce((acc, session) => {
    const date = formatDate(session.startedAt);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);
};

export const getUniqueValues = <T, K extends keyof T>(array: T[], key: K): T[K][] => {
  return Array.from(new Set(array.map(item => item[key])));
};

// Search Utilities
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Performance Utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Storage Utilities
export const STORAGE_KEYS = {
  CHAT_FILTERS: 'chat_management_filters',
  CHAT_SORT: 'chat_management_sort',
  CHAT_PAGINATION: 'chat_management_pagination',
  EXPORT_HISTORY: 'chat_export_history',
} as const;

export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// API Utilities
export const buildApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};