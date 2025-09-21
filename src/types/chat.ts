/**
 * Centralized Chat Management Type Definitions
 * Following DRY principles and single source of truth approach
 */

// Core Session Types
export interface ChatSession {
  id: string;
  sessionId: string;
  status: 'active' | 'ended';
  startedAt: string;
  lastActivity: string;
  messageCount: number;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  duration?: number;
  endedAt?: string;
}

// Metrics and Analytics Types
// @CLAUDE.md - Enhanced metrics interface with proper time range support
export interface ChatMetrics {
  // Time range specific metrics
  totalSessions: number;
  totalMessages: number;
  todaysSessions: number;

  // All time data for comparison
  totalSessionsAllTime?: number;
  totalMessagesAllTime?: number;

  // Real-time metrics
  activeSessions: number;

  // Calculated metrics - NO hardcoded values
  averageSessionDuration: number; // in seconds, calculated from completed sessions
  completedSessionsCount?: number;
  messagesPerSession: number;

  // Time range metadata for clarity
  timeRange?: string;
  timeRangeLabel?: string;
  isAllTime?: boolean;
  generatedAt?: string;

  // Legacy fields for backward compatibility
  responseTime?: number;
  yesterdaySessions?: number;
  weeklyGrowth?: number;
  monthlyGrowth?: number;
}

export interface DetailedMetrics extends ChatMetrics {
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyStats: Array<{ date: string; sessions: number; messages: number }>;
  userTypeDistribution: {
    authenticated: number;
    anonymous: number;
  };
  sessionDurationDistribution: {
    short: number; // < 5 minutes
    medium: number; // 5-30 minutes
    long: number; // > 30 minutes
  };
}

// Filtering and Search Types
export interface FilterState {
  search: string;
  status: 'all' | 'active' | 'ended';
  dateRange: {
    from: Date;
    to: Date;
  };
  userType: 'all' | 'authenticated' | 'anonymous';
  durationFilter: 'all' | 'short' | 'medium' | 'long';
  messageCountFilter: 'all' | 'low' | 'medium' | 'high';
}

export interface SortConfig {
  key: keyof ChatSession;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  sessionIds: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  includeMetadata: boolean;
  includeSystemMessages: boolean;
  autoArchive: boolean;
}

export interface ExportProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
  totalSessions: number;
  processedSessions: number;
}

export interface ExportProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export interface ExportJob {
  id: string;
  options: ExportOptions;
  progress: ExportProgress;
}

// API Response Types
export interface SessionsResponse {
  sessions: ChatSession[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MetricsResponse {
  metrics: ChatMetrics;
  timestamp: string;
}

export interface DetailedMetricsResponse {
  metrics: DetailedMetrics;
  timestamp: string;
}

// Message Types for Individual Session Details
export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SessionDetail extends ChatSession {
  messages: ChatMessage[];
  summary?: string;
  tags?: string[];
  rating?: number;
  feedback?: string;
}

// Operations (Queue + Monitoring) Types
export interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
}

export interface MonitoringMetrics {
  webhookHealth: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  uptime: number;
}

export interface OperationsMetrics {
  queue: QueueMetrics;
  monitoring: MonitoringMetrics;
  timestamp: string;
}

// UI State Types
export interface SessionTableState {
  selectedSessions: string[];
  sortConfig: SortConfig;
  filters: FilterState;
  pagination: PaginationConfig;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

// Component Props Types
export interface MetricsCardProps {
  metrics: ChatMetrics;
  loading?: boolean;
  variant?: 'default' | 'compact';
}

export interface SessionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
  disabled?: boolean;
}

export interface SessionsTableProps {
  sessions: ChatSession[];
  selectedSessions: string[];
  onSelectionChange: (selected: string[]) => void;
  onExportSession: (sessionId: string) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  loading?: boolean;
}

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSessions: string[];
  onExport: (options: ExportOptions) => void;
}

// Hook Return Types
export interface UseSessionDataReturn {
  sessions: ChatSession[];
  metrics: ChatMetrics | null;
  filteredSessions: ChatSession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: FilterState) => void;
  updateSort: (sort: SortConfig) => void;
  updatePagination: (pagination: PaginationConfig) => void;
}

export interface UseExportReturn {
  exportJobs: ExportJob[];
  exportSession: (sessionId: string, options: Partial<ExportOptions>) => Promise<void>;
  exportSessions: (options: ExportOptions) => Promise<void>;
  getExportProgress: (jobId: string) => ExportProgress | null;
  cancelExport: (jobId: string) => Promise<void>;
  downloadExport: (jobId: string) => void;
}

// Error Types
export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Constants Types
export type SessionStatus = ChatSession['status'];
export type ExportFormat = ExportOptions['format'];
export type UserType = FilterState['userType'];
export type DurationFilter = FilterState['durationFilter'];
export type MessageCountFilter = FilterState['messageCountFilter'];

// Default Values
export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  dateRange: {
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  },
  userType: 'all',
  durationFilter: 'all',
  messageCountFilter: 'all',
};

export const DEFAULT_SORT: SortConfig = {
  key: 'lastActivity',
  direction: 'desc',
};

export const DEFAULT_PAGINATION: PaginationConfig = {
  page: 1,
  pageSize: 20,
  total: 0,
};

export const DEFAULT_EXPORT_OPTIONS: Partial<ExportOptions> = {
  format: 'pdf',
  includeMetadata: true,
  includeSystemMessages: false,
  autoArchive: false,
};

// ============================================================================
// Analytics Types - Extended for comprehensive analytics dashboard
// ============================================================================

export interface AnalyticsData {
  sessionMetrics: {
    totalSessions: number;
    activeSessions: number;
    endedSessions: number;
    averageSessionDuration: number;
    sessionGrowth: number;
  };

  messageMetrics: {
    totalMessages: number;
    messagesPerSession: number;
    botMessages: number;
    userMessages: number;
    messageGrowth: number;
  };

  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    queueProcessingTime: number;
    errorRate: number;
  };

  engagementMetrics: {
    peakHours: Array<{ hour: number; sessions: number }>;
    userTypes: { authenticated: number; guest: number };
    sessionLengthDistribution: Array<{ range: string; count: number }>;
    returnUserRate: number;
  };

  trendData: {
    sessionsOverTime: Array<{ date: string; sessions: number; messages: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    dailyComparison: Array<{ day: string; current: number; previous: number }>;
  };

  timeRange: string;
  generatedAt: string;
  periodComparison?: {
    previousPeriod: string;
    growth: {
      sessions: number;
      messages: number;
      avgDuration: number;
    };
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  color?: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string;
  format?: 'number' | 'percentage' | 'duration' | 'date';
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  timeRange: string;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  format: 'json' | 'csv' | 'pdf';
  branding?: {
    logo?: string;
    companyName?: string;
    companyAddress?: string;
  };
}

export interface AnalyticsExportData {
  filename: string;
  content: string | Buffer;
  mimeType: string;
  size: number;
}


// ============================================================================
// Component Props Types - Extended for Analytics
// ============================================================================

export interface AnalyticsChartsProps {
  data: AnalyticsData;
  loading?: boolean;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export interface MetricsOverviewProps {
  metrics: AnalyticsData['sessionMetrics'] & AnalyticsData['messageMetrics'];
  loading?: boolean;
}

export interface ReportFiltersProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onExport: (config: ReportConfig) => void;
  disabled?: boolean;
}


// ============================================================================
// Hook Return Types - Extended for Analytics
// ============================================================================

export interface UseAnalyticsReturn {
  analytics: AnalyticsData | null;
  chartData: ChartData[];
  loading: boolean;
  error: string | null;
  timeRange: string;
  setTimeRange: (range: string) => void;
  refreshAnalytics: () => Promise<void>;
  exportReport: (config: ReportConfig) => Promise<AnalyticsExportData>;
}


// ============================================================================
// Default Values - Extended for Analytics
// ============================================================================

export const DEFAULT_ANALYTICS_TIME_RANGE = '24h';


export const DEFAULT_REPORT_CONFIG: Partial<ReportConfig> = {
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
  format: 'pdf',
};

