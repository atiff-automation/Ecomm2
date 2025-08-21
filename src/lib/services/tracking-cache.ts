/**
 * Tracking Cache Service
 * Basic CRUD operations for the tracking cache system
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { PrismaClient } from '@prisma/client';
import {
  TrackingCacheWithRelations,
  CreateTrackingCacheData,
  UpdateTrackingCacheData,
  CreateJobData,
  CreateUpdateLogData,
  TrackingRefactorError,
  CacheConsistencyError,
} from '../types/tracking-refactor';
import { TRACKING_REFACTOR_CONFIG, calculateNextUpdate, isTerminalStatus } from '../config/tracking-refactor';

const prisma = new PrismaClient();

// ==================== TRACKING CACHE CRUD ====================

/**
 * Create a new tracking cache entry
 */
export const createTrackingCache = async (data: CreateTrackingCacheData): Promise<TrackingCacheWithRelations> => {
  try {
    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, orderNumber: true, userId: true, guestEmail: true, status: true },
    });

    if (!order) {
      throw new TrackingRefactorError(
        `Order not found: ${data.orderId}`,
        'ORDER_NOT_FOUND',
        404
      );
    }

    // Check if tracking cache already exists
    const existingCache = await prisma.trackingCache.findUnique({
      where: { orderId: data.orderId },
    });

    if (existingCache) {
      throw new TrackingRefactorError(
        `Tracking cache already exists for order: ${data.orderId}`,
        'CACHE_ALREADY_EXISTS',
        409
      );
    }

    const trackingCache = await prisma.trackingCache.create({
      data: {
        orderId: data.orderId,
        courierTrackingNumber: data.courierTrackingNumber,
        courierService: data.courierService,
        currentStatus: data.currentStatus,
        lastStatusUpdate: data.lastStatusUpdate,
        trackingEvents: data.trackingEvents || [],
        estimatedDelivery: data.estimatedDelivery,
        lastApiUpdate: data.lastApiUpdate,
        nextUpdateDue: data.nextUpdateDue,
        updateFrequencyMinutes: data.updateFrequencyMinutes || TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES.IN_TRANSIT,
        isDelivered: isTerminalStatus(data.currentStatus),
        isActive: !isTerminalStatus(data.currentStatus),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            guestEmail: true,
            status: true,
          },
        },
        updateLogs: true,
        jobQueue: true,
      },
    });

    return trackingCache;
  } catch (error) {
    if (error instanceof TrackingRefactorError) {
      throw error;
    }
    throw new TrackingRefactorError(
      `Failed to create tracking cache: ${error.message}`,
      'CREATE_CACHE_ERROR',
      500,
      true,
      { orderId: data.orderId, error: error.message }
    );
  }
};

/**
 * Get tracking cache by order ID
 */
export const getTrackingCacheByOrderId = async (orderId: string): Promise<TrackingCacheWithRelations | null> => {
  try {
    const trackingCache = await prisma.trackingCache.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            guestEmail: true,
            status: true,
          },
        },
        updateLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10, // Last 10 logs
        },
        jobQueue: {
          where: { status: { in: ['PENDING', 'RUNNING'] } },
          orderBy: { scheduledFor: 'asc' },
        },
      },
    });

    return trackingCache;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get tracking cache: ${error.message}`,
      'GET_CACHE_ERROR',
      500,
      true,
      { orderId, error: error.message }
    );
  }
};

/**
 * Get tracking cache by tracking number
 */
export const getTrackingCacheByTrackingNumber = async (trackingNumber: string): Promise<TrackingCacheWithRelations | null> => {
  try {
    const trackingCache = await prisma.trackingCache.findFirst({
      where: { courierTrackingNumber: trackingNumber },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            guestEmail: true,
            status: true,
          },
        },
        updateLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        jobQueue: {
          where: { status: { in: ['PENDING', 'RUNNING'] } },
          orderBy: { scheduledFor: 'asc' },
        },
      },
    });

    return trackingCache;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get tracking cache by tracking number: ${error.message}`,
      'GET_CACHE_ERROR',
      500,
      true,
      { trackingNumber, error: error.message }
    );
  }
};

/**
 * Update tracking cache
 */
export const updateTrackingCache = async (
  cacheId: string,
  data: UpdateTrackingCacheData
): Promise<TrackingCacheWithRelations> => {
  try {
    // Get current cache to check for changes
    const currentCache = await prisma.trackingCache.findUnique({
      where: { id: cacheId },
    });

    if (!currentCache) {
      throw new TrackingRefactorError(
        `Tracking cache not found: ${cacheId}`,
        'CACHE_NOT_FOUND',
        404
      );
    }

    // Check if status changed and calculate new update schedule
    const statusChanged = data.currentStatus && data.currentStatus !== currentCache.currentStatus;
    const newNextUpdateDue = data.nextUpdateDue || (statusChanged 
      ? calculateNextUpdate(
          data.currentStatus || currentCache.currentStatus,
          new Date(),
          data.consecutiveFailures || currentCache.consecutiveFailures,
          data.estimatedDelivery || currentCache.estimatedDelivery
        )
      : currentCache.nextUpdateDue
    );

    // Update delivered and active flags based on status
    let updateData = { ...data };
    if (data.currentStatus) {
      updateData.isDelivered = isTerminalStatus(data.currentStatus);
      updateData.isActive = !isTerminalStatus(data.currentStatus);
    }

    const updatedCache = await prisma.trackingCache.update({
      where: { id: cacheId },
      data: {
        ...updateData,
        nextUpdateDue: newNextUpdateDue,
        updatedAt: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            guestEmail: true,
            status: true,
          },
        },
        updateLogs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        jobQueue: {
          where: { status: { in: ['PENDING', 'RUNNING'] } },
          orderBy: { scheduledFor: 'asc' },
        },
      },
    });

    return updatedCache;
  } catch (error) {
    if (error instanceof TrackingRefactorError) {
      throw error;
    }
    throw new TrackingRefactorError(
      `Failed to update tracking cache: ${error.message}`,
      'UPDATE_CACHE_ERROR',
      500,
      true,
      { cacheId, error: error.message }
    );
  }
};

/**
 * Get tracking caches due for update
 */
export const getTrackingCachesDueForUpdate = async (limit: number = 10): Promise<TrackingCacheWithRelations[]> => {
  try {
    const now = new Date();
    
    const caches = await prisma.trackingCache.findMany({
      where: {
        isActive: true,
        isDelivered: false,
        nextUpdateDue: {
          lte: now,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            guestEmail: true,
            status: true,
          },
        },
        updateLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1, // Just the latest log
        },
        jobQueue: {
          where: { status: { in: ['PENDING', 'RUNNING'] } },
          orderBy: { scheduledFor: 'asc' },
        },
      },
      orderBy: [
        { requiresAttention: 'desc' }, // Attention-required items first
        { nextUpdateDue: 'asc' }, // Oldest due first
      ],
      take: limit,
    });

    return caches;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get caches due for update: ${error.message}`,
      'GET_DUE_CACHES_ERROR',
      500,
      true,
      { limit, error: error.message }
    );
  }
};

/**
 * Mark tracking cache as requiring attention
 */
export const markTrackingCacheForAttention = async (
  cacheId: string,
  reason?: string
): Promise<TrackingCacheWithRelations> => {
  try {
    const updatedCache = await updateTrackingCache(cacheId, {
      requiresAttention: true,
    });

    // Log the attention requirement
    await createUpdateLog({
      trackingCacheId: cacheId,
      updateType: 'attention_marked',
      triggeredBy: 'system',
      apiCallSuccess: false,
      apiErrorMessage: reason || 'Marked for attention',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    return updatedCache;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to mark cache for attention: ${error.message}`,
      'MARK_ATTENTION_ERROR',
      500,
      true,
      { cacheId, reason, error: error.message }
    );
  }
};

// ==================== JOB QUEUE OPERATIONS ====================

/**
 * Create a new job
 */
export const createJob = async (data: CreateJobData): Promise<string> => {
  try {
    // Validate tracking cache exists
    const cache = await prisma.trackingCache.findUnique({
      where: { id: data.trackingCacheId },
    });

    if (!cache) {
      throw new TrackingRefactorError(
        `Tracking cache not found: ${data.trackingCacheId}`,
        'CACHE_NOT_FOUND',
        404
      );
    }

    const job = await prisma.trackingJobQueue.create({
      data: {
        trackingCacheId: data.trackingCacheId,
        jobType: data.jobType,
        priority: data.priority || TRACKING_REFACTOR_CONFIG.JOB_PRIORITIES.SCHEDULED,
        scheduledFor: data.scheduledFor,
        maxAttempts: data.maxAttempts || 3,
      },
    });

    return job.id;
  } catch (error) {
    if (error instanceof TrackingRefactorError) {
      throw error;
    }
    throw new TrackingRefactorError(
      `Failed to create job: ${error.message}`,
      'CREATE_JOB_ERROR',
      500,
      true,
      { data, error: error.message }
    );
  }
};

/**
 * Get pending jobs
 */
export const getPendingJobs = async (limit: number = 10) => {
  try {
    const jobs = await prisma.trackingJobQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        trackingCache: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // Lower priority number = higher priority
        { scheduledFor: 'asc' },
      ],
      take: limit,
    });

    return jobs;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get pending jobs: ${error.message}`,
      'GET_PENDING_JOBS_ERROR',
      500,
      true,
      { limit, error: error.message }
    );
  }
};

/**
 * Update job status
 */
export const updateJobStatus = async (
  jobId: string,
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
  error?: string
) => {
  try {
    await prisma.trackingJobQueue.update({
      where: { id: jobId },
      data: {
        status,
        lastAttemptAt: new Date(),
        lastError: error,
        attempts: {
          increment: status === 'RUNNING' ? 1 : 0,
        },
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    throw new TrackingRefactorError(
      `Failed to update job status: ${err.message}`,
      'UPDATE_JOB_ERROR',
      500,
      true,
      { jobId, status, error: err.message }
    );
  }
};

// ==================== UPDATE LOG OPERATIONS ====================

/**
 * Create update log
 */
export const createUpdateLog = async (data: CreateUpdateLogData): Promise<string> => {
  try {
    const log = await prisma.trackingUpdateLog.create({
      data,
    });

    return log.id;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to create update log: ${error.message}`,
      'CREATE_LOG_ERROR',
      500,
      true,
      { data, error: error.message }
    );
  }
};

/**
 * Get update logs for a tracking cache
 */
export const getUpdateLogs = async (trackingCacheId: string, limit: number = 50) => {
  try {
    const logs = await prisma.trackingUpdateLog.findMany({
      where: { trackingCacheId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get update logs: ${error.message}`,
      'GET_LOGS_ERROR',
      500,
      true,
      { trackingCacheId, limit, error: error.message }
    );
  }
};

// ==================== HEALTH AND MAINTENANCE ====================

/**
 * Get cache statistics
 */
export const getCacheStatistics = async () => {
  try {
    const [
      totalCaches,
      activeCaches,
      deliveredCaches,
      failedCaches,
      attentionCaches,
      pendingJobs,
      runningJobs,
    ] = await Promise.all([
      prisma.trackingCache.count(),
      prisma.trackingCache.count({ where: { isActive: true } }),
      prisma.trackingCache.count({ where: { isDelivered: true } }),
      prisma.trackingCache.count({ where: { isFailed: true } }),
      prisma.trackingCache.count({ where: { requiresAttention: true } }),
      prisma.trackingJobQueue.count({ where: { status: 'PENDING' } }),
      prisma.trackingJobQueue.count({ where: { status: 'RUNNING' } }),
    ]);

    return {
      caches: {
        total: totalCaches,
        active: activeCaches,
        delivered: deliveredCaches,
        failed: failedCaches,
        requiresAttention: attentionCaches,
      },
      jobs: {
        pending: pendingJobs,
        running: runningJobs,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to get cache statistics: ${error.message}`,
      'GET_STATS_ERROR',
      500,
      true,
      { error: error.message }
    );
  }
};

/**
 * Clean up old completed jobs
 */
export const cleanupCompletedJobs = async (olderThanDays: number = 7): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.trackingJobQueue.deleteMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to cleanup completed jobs: ${error.message}`,
      'CLEANUP_ERROR',
      500,
      true,
      { olderThanDays, error: error.message }
    );
  }
};

/**
 * Validate cache consistency
 */
export const validateCacheConsistency = async (): Promise<Array<{ orderId: string; issues: string[] }>> => {
  try {
    const issues: Array<{ orderId: string; issues: string[] }> = [];

    // Find orders with shipments but no tracking cache
    const ordersWithoutCache = await prisma.order.findMany({
      where: {
        shipment: {
          isNot: null,
        },
        trackingCache: null,
      },
      select: { id: true, orderNumber: true },
    });

    ordersWithoutCache.forEach(order => {
      issues.push({
        orderId: order.id,
        issues: ['Has shipment but no tracking cache'],
      });
    });

    // Find tracking caches with inconsistent status
    const inconsistentCaches = await prisma.trackingCache.findMany({
      where: {
        OR: [
          { isDelivered: false, currentStatus: 'DELIVERED' },
          { isActive: true, isDelivered: true },
          { isActive: false, isDelivered: false, isFailed: false },
        ],
      },
      select: { orderId: true, currentStatus: true, isDelivered: true, isActive: true, isFailed: true },
    });

    inconsistentCaches.forEach(cache => {
      const cacheIssues: string[] = [];
      
      if (!cache.isDelivered && cache.currentStatus === 'DELIVERED') {
        cacheIssues.push('Status is DELIVERED but isDelivered is false');
      }
      
      if (cache.isActive && cache.isDelivered) {
        cacheIssues.push('Cache is both active and delivered');
      }
      
      if (!cache.isActive && !cache.isDelivered && !cache.isFailed) {
        cacheIssues.push('Cache is inactive but not delivered or failed');
      }

      if (cacheIssues.length > 0) {
        issues.push({
          orderId: cache.orderId,
          issues: cacheIssues,
        });
      }
    });

    return issues;
  } catch (error) {
    throw new CacheConsistencyError(
      `Failed to validate cache consistency: ${error.message}`,
      { error: error.message }
    );
  }
};

// ==================== EXPORTS ====================

export {
  prisma as trackingCachePrisma,
};