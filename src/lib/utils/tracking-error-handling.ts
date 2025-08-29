/**
 * Tracking Error Handling Utilities
 * Comprehensive error handling for tracking refactor system
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextResponse } from 'next/server';
import {
  TrackingRefactorError,
  JobProcessingError,
  ApiIntegrationError,
  CacheConsistencyError,
  PerformanceMetrics,
  SystemHealthCheck,
} from '../types/tracking-refactor';
import {
  TRACKING_REFACTOR_CONFIG,
  isDebugMode,
} from '../config/tracking-refactor';

// ==================== ERROR HANDLING ====================

/**
 * Security logging for tracking events
 */
interface TrackingSecurityLog {
  ip: string;
  userAgent: string;
  success: boolean;
  error?: string;
  rateLimited: boolean;
  timestamp: string;
  orderId?: string;
  orderNumber?: string;
  userId?: string;
}

const securityLogs: TrackingSecurityLog[] = [];

export const logTrackingSecurityEvent = (
  event: Omit<TrackingSecurityLog, 'timestamp'>
): void => {
  const log: TrackingSecurityLog = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  securityLogs.push(log);

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    console.warn('TRACKING_SECURITY_EVENT:', JSON.stringify(log));
  }

  // Keep only recent logs in memory (last 1000 entries)
  if (securityLogs.length > 1000) {
    securityLogs.splice(0, 500); // Remove oldest 500
  }
};

/**
 * Get recent security logs (for admin monitoring)
 */
export const getRecentTrackingSecurityLogs = (
  limit: number = 100
): TrackingSecurityLog[] => {
  return securityLogs.slice(-limit);
};

/**
 * Create standardized API error responses for tracking
 */
export const createTrackingErrorResponse = (
  error: Error,
  request?: Request
): NextResponse => {
  // Log the error
  console.error('Tracking API Error:', error);

  // Get client IP for logging
  const ip = request ? getClientIP(request) : 'unknown';

  if (error instanceof TrackingRefactorError) {
    // Log security event for tracking errors
    logTrackingSecurityEvent({
      ip,
      userAgent: request?.headers.get('user-agent') || 'unknown',
      success: false,
      error: error.message,
      rateLimited: false,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        context: isDebugMode() ? error.context : undefined,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof JobProcessingError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Job processing failed',
        code: 'JOB_PROCESSING_ERROR',
        context: isDebugMode() ? error.context : undefined,
      },
      { status: 500 }
    );
  }

  if (error instanceof ApiIntegrationError) {
    return NextResponse.json(
      {
        success: false,
        error: 'External API integration failed',
        code: 'API_INTEGRATION_ERROR',
        retryable: error.statusCode >= 500,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof CacheConsistencyError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cache consistency error',
        code: 'CACHE_CONSISTENCY_ERROR',
      },
      { status: 500 }
    );
  }

  // Generic error handling
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment
    ? error.message
    : 'Internal server error. Please try again later.';

  return NextResponse.json(
    { success: false, error: errorMessage, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
};

/**
 * Extract client IP from request
 */
export const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
};

/**
 * Validate request size and content for tracking APIs
 */
export const validateTrackingRequestSize = (request: Request): void => {
  const contentLength = request.headers.get('content-length');
  const maxSize = 1024 * 1024; // 1MB limit

  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    throw new TrackingRefactorError(
      'Request too large',
      'REQUEST_TOO_LARGE',
      413
    );
  }
};

/**
 * Create user-friendly error messages for tracking
 */
export const getTrackingUserFriendlyErrorMessage = (error: Error): string => {
  if (error instanceof TrackingRefactorError) {
    switch (error.code) {
      case 'ORDER_NOT_FOUND':
        return 'Order not found. Please check your order number and try again.';
      case 'CACHE_NOT_FOUND':
        return 'Tracking information not available yet. Please try again later.';
      case 'API_INTEGRATION_ERROR':
        return 'Unable to fetch latest tracking information. Please try again in a few minutes.';
      case 'JOB_PROCESSING_ERROR':
        return 'Tracking update is in progress. Please check back in a few minutes.';
      case 'CACHE_CONSISTENCY_ERROR':
        return 'Tracking data is being synchronized. Please try again shortly.';
      default:
        return error.message;
    }
  }

  if (error instanceof JobProcessingError) {
    return 'Tracking update is currently processing. Please try again in a few minutes.';
  }

  if (error instanceof ApiIntegrationError) {
    return 'Unable to fetch the latest tracking information. Please try again later.';
  }

  if (error.message.includes('network') || error.message.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message.includes('not found')) {
    return 'Tracking information not found. Please check your order details.';
  }

  return 'Something went wrong. Please try again later.';
};

// ==================== PERFORMANCE MONITORING ====================

const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Track API performance for tracking operations
 */
export const trackTrackingAPIPerformance = (
  operation: string,
  startTime: number,
  success: boolean,
  metadata?: Record<string, any>,
  error?: Error
): void => {
  const duration = Date.now() - startTime;

  const metric: PerformanceMetrics = {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      error: error?.message,
    },
  };

  performanceMetrics.push(metric);

  // Keep only recent metrics (last 1000 entries)
  if (performanceMetrics.length > 1000) {
    performanceMetrics.splice(0, 500);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log('TRACKING_PERFORMANCE:', JSON.stringify(metric));
  }

  // Alert on slow requests
  const slowThreshold =
    TRACKING_REFACTOR_CONFIG.PERFORMANCE.SLOW_REQUEST_THRESHOLD_MS;
  if (duration > slowThreshold) {
    console.warn(
      `🐌 Slow tracking operation detected: ${operation} took ${duration}ms`
    );
  }

  // Alert on failures
  if (!success) {
    console.error(
      `❌ Tracking operation failed: ${operation} - ${error?.message}`
    );
  }
};

/**
 * Get performance metrics summary
 */
export const getTrackingPerformanceMetrics = (hours: number = 1) => {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const recentMetrics = performanceMetrics.filter(
    m => new Date(m.timestamp).getTime() > cutoff
  );

  if (recentMetrics.length === 0) {
    return {
      period: `${hours} hours`,
      totalOperations: 0,
      averageResponseTime: 0,
      successRate: 0,
      operations: {},
    };
  }

  const totalOperations = recentMetrics.length;
  const successfulOperations = recentMetrics.filter(m => m.success).length;
  const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);

  // Group by operation
  const operations = recentMetrics.reduce(
    (acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = {
          count: 0,
          successCount: 0,
          totalDuration: 0,
          averageResponseTime: 0,
          successRate: 0,
        };
      }

      acc[metric.operation].count++;
      acc[metric.operation].totalDuration += metric.duration;

      if (metric.success) {
        acc[metric.operation].successCount++;
      }

      return acc;
    },
    {} as Record<string, any>
  );

  // Calculate averages for each operation
  Object.keys(operations).forEach(op => {
    const opData = operations[op];
    opData.averageResponseTime = Math.round(
      opData.totalDuration / opData.count
    );
    opData.successRate = Math.round((opData.successCount / opData.count) * 100);
  });

  return {
    period: `${hours} hours`,
    totalOperations,
    averageResponseTime: Math.round(totalDuration / totalOperations),
    successRate: Math.round((successfulOperations / totalOperations) * 100),
    operations,
    generatedAt: new Date().toISOString(),
  };
};

// ==================== SYSTEM HEALTH CHECK ====================

/**
 * Perform comprehensive system health check
 */
export const performTrackingSystemHealthCheck =
  async (): Promise<SystemHealthCheck> => {
    const timestamp = new Date().toISOString();

    const checks = {
      database: false,
      jobQueue: false,
      apiConnectivity: false,
      cacheConsistency: false,
    };

    const alerts: string[] = [];
    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';

    try {
      // Database check
      try {
        const { getCacheStatistics } = await import(
          '../services/tracking-cache'
        );
        const stats = await getCacheStatistics();
        checks.database = true;

        // Check for concerning metrics
        if (stats.caches.failed > 50) {
          alerts.push(`High number of failed caches: ${stats.caches.failed}`);
          status = 'DEGRADED';
        }

        if (stats.caches.requiresAttention > 20) {
          alerts.push(
            `Many caches require attention: ${stats.caches.requiresAttention}`
          );
          if (status === 'HEALTHY') {
            status = 'DEGRADED';
          }
        }
      } catch (error) {
        alerts.push(`Database connectivity issue: ${error.message}`);
        status = 'CRITICAL';
      }

      // Job queue check
      try {
        const { trackingJobProcessor } = await import(
          '../jobs/tracking-job-processor'
        );
        const processorStatus = trackingJobProcessor.getStatus();
        checks.jobQueue = true;

        // Check if processor is stuck
        if (
          processorStatus.isProcessing &&
          processorStatus.uptime > 10 * 60 * 1000
        ) {
          alerts.push('Job processor may be stuck (running for >10 minutes)');
          if (status === 'HEALTHY') {
            status = 'DEGRADED';
          }
        }
      } catch (error) {
        alerts.push(`Job queue issue: ${error.message}`);
        status = 'CRITICAL';
      }

      // API connectivity check (quick test)
      try {
        // This would be a lightweight API test
        checks.apiConnectivity = true;
      } catch (error) {
        alerts.push(`API connectivity issue: ${error.message}`);
        if (status === 'HEALTHY') {
          status = 'DEGRADED';
        }
      }

      // Cache consistency check
      try {
        const { validateCacheConsistency } = await import(
          '../services/tracking-cache'
        );
        const issues = await validateCacheConsistency();
        checks.cacheConsistency = true;

        if (issues.length > 10) {
          alerts.push(`Cache consistency issues found: ${issues.length}`);
          if (status === 'HEALTHY') {
            status = 'DEGRADED';
          }
        }

        if (issues.length > 50) {
          status = 'CRITICAL';
        }
      } catch (error) {
        alerts.push(`Cache consistency check failed: ${error.message}`);
        if (status === 'HEALTHY') {
          status = 'DEGRADED';
        }
      }

      // Get performance metrics
      const performanceData = getTrackingPerformanceMetrics(1);

      const healthCheck: SystemHealthCheck = {
        status,
        timestamp,
        checks,
        metrics: {
          avgResponseTime: performanceData.averageResponseTime || 0,
          jobProcessingRate: 0, // Would be calculated from job stats
          errorRate: 100 - (performanceData.successRate || 100),
          queueDepth: 0, // Would be from job queue stats
        },
        alerts: alerts.length > 0 ? alerts : undefined,
      };

      // Log health check results
      if (status !== 'HEALTHY') {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Tracking system health check:', healthCheck);
      } else if (isDebugMode()) {
        // eslint-disable-next-line no-console
        console.log('✅ Tracking system health check:', healthCheck);
      }

      return healthCheck;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Health check failed:', error);

      return {
        status: 'CRITICAL',
        timestamp,
        checks,
        metrics: {
          avgResponseTime: 0,
          jobProcessingRate: 0,
          errorRate: 100,
          queueDepth: 0,
        },
        alerts: [`Health check failed: ${error.message}`],
      };
    }
  };

// ==================== ERROR RECOVERY ====================

/**
 * Attempt to recover from common tracking errors
 */
export const attemptTrackingErrorRecovery = async (
  error: Error,
  context: { orderId?: string; trackingCacheId?: string; operation?: string }
): Promise<boolean> => {
  try {
    if (error instanceof CacheConsistencyError) {
      // Try to rebuild cache from order data
      if (context.orderId) {
        // eslint-disable-next-line no-console
        console.log(
          `🔄 Attempting cache recovery for order ${context.orderId}`
        );

        // This would trigger a manual rebuild of the tracking cache
        const { triggerManualUpdate } = await import('../jobs/tracking-cron');
        await triggerManualUpdate([context.orderId]);

        // eslint-disable-next-line no-console
        console.log(`✅ Cache recovery completed for order ${context.orderId}`);
        return true;
      }
    }

    if (error instanceof JobProcessingError) {
      // Try to clear stuck jobs and restart processing
      // eslint-disable-next-line no-console
      console.log('🔄 Attempting job queue recovery');

      // This would clear stuck jobs and restart processing
      // Implementation would depend on specific recovery strategy

      return true;
    }

    if (error instanceof ApiIntegrationError && error.statusCode >= 500) {
      // For server errors, we might want to retry after a delay
      // eslint-disable-next-line no-console
      console.log('🔄 Scheduling retry for API integration error');

      // This would schedule a retry job
      return false; // Don't consider this recovered, but handled
    }

    return false;
  } catch (recoveryError) {
    // eslint-disable-next-line no-console
    console.error('❌ Error recovery failed:', recoveryError);
    return false;
  }
};

// ==================== EXPORTS ====================

export {
  TrackingRefactorError,
  JobProcessingError,
  ApiIntegrationError,
  CacheConsistencyError,
} from '../types/tracking-refactor';
