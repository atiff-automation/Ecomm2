/**
 * Admin Manual Tracking Refresh API
 * Allows admin to manually trigger tracking updates for specific orders
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getTrackingCacheByOrderId,
  createJob,
} from '@/lib/services/tracking-cache';
import { 
  getJobPriority,
} from '@/lib/config/tracking-refactor';
import {
  AdminTrackingManagementResponse,
  TrackingRefactorError,
} from '@/lib/types/tracking-refactor';
import {
  createTrackingErrorResponse,
  trackTrackingAPIPerformance,
} from '@/lib/utils/tracking-error-handling';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

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
 * POST /api/admin/tracking/refresh-order/[id]
 * Manually refresh tracking for specific order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

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

    const orderId = params.id;
    if (!orderId) {
      throw new TrackingRefactorError(
        'Order ID is required',
        'VALIDATION_ERROR',
        400
      );
    }

    // Get tracking cache for order
    const trackingCache = await getTrackingCacheByOrderId(orderId);
    
    if (!trackingCache) {
      throw new TrackingRefactorError(
        'No tracking cache found for this order',
        'TRACKING_NOT_AVAILABLE',
        404
      );
    }

    // Create manual refresh job with high priority
    const jobId = await createJob({
      trackingCacheId: trackingCache.id,
      jobType: 'MANUAL',
      priority: getJobPriority('MANUAL'),
      scheduledFor: new Date(),
    });

    const response: AdminTrackingManagementResponse = {
      success: true,
      jobsCreated: 1,
      jobIds: [jobId],
      message: `Manual refresh job created for order ${trackingCache.order.orderNumber}`,
    };

    // Track performance
    trackTrackingAPIPerformance(
      'admin-refresh-order',
      startTime,
      true,
      {
        orderId,
        jobType: 'MANUAL',
        jobId,
      }
    );

    return NextResponse.json(response);

  } catch (error) {
    // Track performance for errors
    trackTrackingAPIPerformance(
      'admin-refresh-order',
      startTime,
      false,
      { orderId: params.id },
      error as Error
    );

    return createTrackingErrorResponse(error as Error, request);
  }
}