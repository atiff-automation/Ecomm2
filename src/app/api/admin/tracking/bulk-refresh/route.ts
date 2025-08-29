/**
 * Admin Bulk Refresh API
 * Allows admin to trigger bulk tracking updates
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTrackingCacheByOrderId,
  createJob,
  getTrackingCachesDueForUpdate,
} from '@/lib/services/tracking-cache';
import {
  getJobPriority,
  TRACKING_REFACTOR_CONFIG,
} from '@/lib/config/tracking-refactor';
import {
  AdminTrackingManagementRequest,
  AdminTrackingManagementResponse,
  TrackingRefactorError,
} from '@/lib/types/tracking-refactor';
import {
  createTrackingErrorResponse,
  trackTrackingAPIPerformance,
} from '@/lib/utils/tracking-error-handling';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * Validate admin access
 */
async function validateAdminAccess(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return false;
  }

  // Check if user has admin role
  const userRole = (session.user as any).role;
  return userRole === 'ADMIN' || userRole === 'SUPERADMIN';
}

/**
 * POST /api/admin/tracking/bulk-refresh
 * Bulk refresh tracking for multiple orders
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let processedCount = 0;

  try {
    // Validate admin access
    const hasAdminAccess = await validateAdminAccess();
    if (!hasAdminAccess) {
      throw new TrackingRefactorError(
        'Admin access required',
        'ADMIN_ACCESS_REQUIRED',
        403
      );
    }

    const body: AdminTrackingManagementRequest = await request.json();
    const { action, orderIds, trackingCacheIds, priority, scheduleFor } = body;

    if (action !== 'BULK_REFRESH' && action !== 'REFRESH') {
      throw new TrackingRefactorError(
        'Invalid action. Use BULK_REFRESH or REFRESH',
        'VALIDATION_ERROR',
        400
      );
    }

    const jobIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];
    const jobPriority = priority || getJobPriority('MANUAL');
    const scheduledFor = scheduleFor ? new Date(scheduleFor) : new Date();

    // Validate schedule time
    if (scheduledFor < new Date(Date.now() - 5 * 60 * 1000)) {
      // Can't schedule more than 5 minutes in past
      throw new TrackingRefactorError(
        'Schedule time cannot be in the past',
        'VALIDATION_ERROR',
        400
      );
    }

    if (orderIds && orderIds.length > 0) {
      // Process specific order IDs
      console.log(
        `🔄 Processing bulk refresh for ${orderIds.length} orders...`
      );

      for (const orderId of orderIds.slice(0, 50)) {
        // Limit to 50 orders at once
        try {
          const trackingCache = await getTrackingCacheByOrderId(orderId);

          if (!trackingCache) {
            errors.push({
              id: orderId,
              error: 'No tracking cache found',
            });
            continue;
          }

          const jobId = await createJob({
            trackingCacheId: trackingCache.id,
            jobType: 'MANUAL',
            priority: jobPriority,
            scheduledFor: scheduledFor,
          });

          jobIds.push(jobId);
          processedCount++;
        } catch (error) {
          errors.push({
            id: orderId,
            error: error.message,
          });
        }
      }
    } else if (trackingCacheIds && trackingCacheIds.length > 0) {
      // Process specific tracking cache IDs
      console.log(
        `🔄 Processing bulk refresh for ${trackingCacheIds.length} tracking caches...`
      );

      for (const cacheId of trackingCacheIds.slice(0, 50)) {
        // Limit to 50 caches at once
        try {
          // Verify cache exists
          const cache = await prisma.trackingCache.findUnique({
            where: { id: cacheId },
            select: { id: true },
          });

          if (!cache) {
            errors.push({
              id: cacheId,
              error: 'Tracking cache not found',
            });
            continue;
          }

          const jobId = await createJob({
            trackingCacheId: cacheId,
            jobType: 'MANUAL',
            priority: jobPriority,
            scheduledFor: scheduledFor,
          });

          jobIds.push(jobId);
          processedCount++;
        } catch (error) {
          errors.push({
            id: cacheId,
            error: error.message,
          });
        }
      }
    } else {
      // No specific IDs provided - refresh caches that are due for update
      console.log('🔄 Processing bulk refresh for caches due for update...');

      const batchSize = Math.min(
        TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE * 2,
        50
      );

      const cachesDue = await getTrackingCachesDueForUpdate(batchSize);

      if (cachesDue.length === 0) {
        return NextResponse.json({
          success: true,
          jobsCreated: 0,
          message: 'No tracking caches are currently due for update',
        } as AdminTrackingManagementResponse);
      }

      for (const cache of cachesDue) {
        try {
          const jobId = await createJob({
            trackingCacheId: cache.id,
            jobType: 'MANUAL',
            priority: jobPriority,
            scheduledFor: scheduledFor,
          });

          jobIds.push(jobId);
          processedCount++;
        } catch (error) {
          errors.push({
            id: cache.id,
            error: error.message,
          });
        }
      }
    }

    const response: AdminTrackingManagementResponse = {
      success: true,
      jobsCreated: jobIds.length,
      jobIds: jobIds,
      message: `Created ${jobIds.length} bulk refresh jobs${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    };

    // Include errors if any
    if (errors.length > 0) {
      (response as any).errors = errors;
    }

    console.log(
      `✅ Bulk refresh completed: ${jobIds.length} jobs created, ${errors.length} errors`
    );

    // Track performance
    trackTrackingAPIPerformance('admin-bulk-refresh', startTime, true, {
      jobsCreated: jobIds.length,
      errorsCount: errors.length,
      processedCount,
      action,
      scheduledFor: scheduledFor.toISOString(),
    });

    return NextResponse.json(response);
  } catch (error) {
    // Track performance for errors
    trackTrackingAPIPerformance(
      'admin-bulk-refresh',
      startTime,
      false,
      { processedCount },
      error as Error
    );

    return createTrackingErrorResponse(error as Error, request);
  }
}
