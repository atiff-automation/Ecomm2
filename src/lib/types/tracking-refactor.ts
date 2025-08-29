/**
 * Tracking Refactor Type Definitions
 * Centralized types for the new tracking cache architecture
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import {
  TrackingCache,
  TrackingUpdateLog,
  TrackingJobQueue,
  TrackingJobStatus,
  TrackingJobType,
} from '@prisma/client';

// ==================== CORE INTERFACES ====================

export interface TrackingCacheWithRelations extends TrackingCache {
  order: {
    id: string;
    orderNumber: string;
    userId?: string;
    guestEmail?: string;
    status: string;
  };
  updateLogs: TrackingUpdateLog[];
  jobQueue: TrackingJobQueue[];
}

export interface TrackingEvent {
  eventCode: string;
  eventName: string;
  description: string;
  location?: string;
  timestamp: string;
  timezone?: string;
  source?: string;
}

export interface CachedTrackingResponse {
  success: boolean;
  data?: {
    orderNumber: string;
    currentStatus: string;
    lastStatusUpdate: string;
    trackingEvents: TrackingEvent[];
    estimatedDelivery?: string;
    actualDelivery?: string;
    courierService: string;
    courierTrackingNumber: string;

    // Cache metadata
    lastApiUpdate: string;
    nextUpdateDue: string;
    dataFreshness: 'FRESH' | 'STALE' | 'EXPIRED';
    cacheAge: number; // seconds

    // Privacy filtered for guests
    isFiltered?: boolean;
  };
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

// ==================== JOB PROCESSING ====================

export interface JobProcessingContext {
  jobId: string;
  trackingCacheId: string;
  jobType: TrackingJobType;
  priority: number;
  attemptNumber: number;
  maxAttempts: number;
  scheduledFor: Date;
  startedAt: Date;
}

export interface JobProcessingResult {
  success: boolean;
  statusChanged: boolean;
  eventsAdded: number;
  previousStatus?: string;
  newStatus?: string;
  apiResponseTimeMs?: number;
  errorMessage?: string;
  shouldRetry: boolean;
  nextRetryAt?: Date;
}

export interface JobBatchResult {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  skippedJobs: number;
  processingTimeMs: number;
  errors: Array<{
    jobId: string;
    error: string;
  }>;
}

// ==================== API INTEGRATION ====================

export interface EasyParcelTrackingRequest {
  trackingNumber: string;
  courierService?: string;
  includeEvents?: boolean;
}

export interface EasyParcelTrackingResponse {
  success: boolean;
  data?: {
    trackingNumber: string;
    status: string;
    statusDescription?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    events: TrackingEvent[];
    courierDetails: {
      service: string;
      name: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
  rateLimited?: boolean;
  retryAfter?: number;
}

// ==================== ADMIN MANAGEMENT ====================

export interface AdminTrackingManagementRequest {
  action: 'REFRESH' | 'BULK_REFRESH' | 'FORCE_UPDATE' | 'RESET_FAILURES';
  orderIds?: string[];
  trackingCacheIds?: string[];
  priority?: number;
  scheduleFor?: string; // ISO date string
}

export interface AdminTrackingManagementResponse {
  success: boolean;
  jobsCreated?: number;
  jobIds?: string[];
  message?: string;
  error?: string;
}

export interface TrackingJobStatusResponse {
  success: boolean;
  data?: {
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalJobs: number;
    averageProcessingTime: number;
    lastProcessedAt?: string;
    nextScheduledAt?: string;
    queueHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    recentJobs: Array<{
      id: string;
      jobType: string;
      status: string;
      createdAt: string;
      scheduledFor: string;
      attempts: number;
      lastError?: string;
    }>;
  };
  error?: string;
}

export interface ApiUsageStatsResponse {
  success: boolean;
  data?: {
    dailyApiCalls: number;
    dailyBudget: number;
    remainingCalls: number;
    usagePercentage: number;
    averageResponseTime: number;
    successRate: number;
    lastResetAt: string;
    nextResetAt: string;
    hourlyBreakdown: Array<{
      hour: number;
      calls: number;
      successRate: number;
    }>;
  };
  error?: string;
}

// ==================== ERROR HANDLING ====================

export class TrackingRefactorError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    code: string = 'TRACKING_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    this.name = 'TrackingRefactorError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
  }
}

export class JobProcessingError extends TrackingRefactorError {
  constructor(message: string, context?: any) {
    super(message, 'JOB_PROCESSING_ERROR', 500, true, context);
    this.name = 'JobProcessingError';
  }
}

export class ApiIntegrationError extends TrackingRefactorError {
  constructor(message: string, statusCode: number = 502, context?: any) {
    super(message, 'API_INTEGRATION_ERROR', statusCode, true, context);
    this.name = 'ApiIntegrationError';
  }
}

export class CacheConsistencyError extends TrackingRefactorError {
  constructor(message: string, context?: any) {
    super(message, 'CACHE_CONSISTENCY_ERROR', 500, true, context);
    this.name = 'CacheConsistencyError';
  }
}

// ==================== PERFORMANCE MONITORING ====================

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: string;
  metadata?: {
    jobType?: string;
    batchSize?: number;
    queueDepth?: number;
    cacheHitRate?: number;
  };
}

export interface SystemHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  checks: {
    database: boolean;
    jobQueue: boolean;
    apiConnectivity: boolean;
    cacheConsistency: boolean;
  };
  metrics: {
    avgResponseTime: number;
    jobProcessingRate: number;
    errorRate: number;
    queueDepth: number;
  };
  alerts?: string[];
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface DataConsistencyCheck {
  orderId: string;
  issues: Array<{
    type: 'MISSING_CACHE' | 'STALE_DATA' | 'ORPHANED_CACHE' | 'INVALID_STATUS';
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  lastChecked: string;
}

// ==================== CONFIGURATION ====================

export interface EnvironmentConfiguration {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  updateFrequencies: Record<string, number>;
  apiTimeout: number;
  batchSize: number;
}

export interface TrackingRefactorConfiguration {
  updateFrequencies: Record<string, number>;
  jobProcessing: {
    batchSize: number;
    maxConcurrent: number;
    retryDelays: number[];
    maxFailures: number;
  };
  apiManagement: {
    requestTimeout: number;
    rateLimitBuffer: number;
    dailyBudget: number;
  };
  cacheSettings: {
    ttlHours: number;
    cleanupInterval: number;
    maxEventHistory: number;
  };
}

// ==================== GUEST TRACKING ====================

export interface GuestTrackingRequestRefactor {
  orderNumber: string;
  email?: string;
  phone?: string;
}

export interface GuestTrackingResponseRefactor extends CachedTrackingResponse {
  data?: CachedTrackingResponse['data'] & {
    // Additional guest-specific fields
    allowedActions: Array<'TRACK' | 'CONTACT_SUPPORT'>;
    estimatedDeliveryFormatted?: string;
    statusDescription?: string;
  };
}

// ==================== CUSTOMER TRACKING ====================

export interface CustomerTrackingRequest {
  orderId?: string;
  orderNumber?: string;
  includeHistory?: boolean;
}

export interface CustomerTrackingResponse extends CachedTrackingResponse {
  data?: CachedTrackingResponse['data'] & {
    // Additional customer-specific fields
    orderDetails: {
      orderDate: string;
      orderTotal: number;
      currency: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    };
    allowedActions: Array<'TRACK' | 'CANCEL' | 'MODIFY' | 'CONTACT_SUPPORT'>;
    deliveryInstructions?: string;
    supportContactInfo: {
      email: string;
      phone: string;
      hours: string;
    };
  };
}

// ==================== UTILITY TYPES ====================

export type JobQueueStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type CacheDataFreshness = 'FRESH' | 'STALE' | 'EXPIRED';
export type UpdateTriggerType = 'SCHEDULED' | 'MANUAL' | 'WEBHOOK' | 'RETRY';
export type SystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

// ==================== DATABASE OPERATION TYPES ====================

export interface CreateTrackingCacheData {
  orderId: string;
  courierTrackingNumber: string;
  courierService: string;
  currentStatus: string;
  lastStatusUpdate: Date;
  trackingEvents?: TrackingEvent[];
  estimatedDelivery?: Date;
  lastApiUpdate: Date;
  nextUpdateDue: Date;
  updateFrequencyMinutes?: number;
}

export interface UpdateTrackingCacheData {
  currentStatus?: string;
  lastStatusUpdate?: Date;
  trackingEvents?: TrackingEvent[];
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveryLocation?: string;
  lastApiUpdate?: Date;
  nextUpdateDue?: Date;
  updateFrequencyMinutes?: number;
  consecutiveFailures?: number;
  isDelivered?: boolean;
  isFailed?: boolean;
  requiresAttention?: boolean;
  lastApiResponse?: any;
  apiResponseHash?: string;
}

export interface CreateJobData {
  trackingCacheId: string;
  jobType: TrackingJobType;
  priority?: number;
  scheduledFor: Date;
  maxAttempts?: number;
}

export interface CreateUpdateLogData {
  trackingCacheId: string;
  updateType: string;
  triggeredBy?: string;
  apiCallSuccess: boolean;
  apiResponseTimeMs?: number;
  apiStatusCode?: number;
  apiErrorMessage?: string;
  statusChanged?: boolean;
  previousStatus?: string;
  newStatus?: string;
  eventsAdded?: number;
  startedAt: Date;
  completedAt?: Date;
}

// ==================== EXPORT ALL ====================

export type {
  TrackingCache,
  TrackingUpdateLog,
  TrackingJobQueue,
  TrackingJobStatus,
  TrackingJobType,
} from '@prisma/client';
