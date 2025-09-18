/**
 * Chat Components Barrel Export
 * Centralized exports following DRY principles
 */

export { default as MetricsCards, DetailedMetricsCards } from './MetricsCards';
export { ChatWidget } from './ChatWidget';
export { SessionFilters } from './SessionFilters';
export { SessionsTable } from './SessionsTable';
export { ExportDialog } from './ExportDialog';

// Export all chat-related types for convenience
export type {
  ChatSession,
  ChatMetrics,
  FilterState,
  SortConfig,
  PaginationConfig,
  ExportOptions,
  ExportProgress,
  ExportJob,
} from '@/types/chat';

// Export commonly used utilities
export {
  formatDuration,
  formatTimestamp,
  formatDate,
  formatDateTime,
  getRelativeTime,
  getStatusColor,
  getStatusIcon,
  getUserTypeLabel,
  getDurationCategory,
  getMessageCountCategory,
  cn,
} from '@/utils/chat';

// TODO: Re-enable hooks once server/client context issues are resolved
// export { useSessionData } from '@/hooks/useSessionData';
// export { useExport } from '@/hooks/useExport';