/**

export const dynamic = 'force-dynamic';

 * Admin Job Status API
 * Provides job queue monitoring and statistics
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCacheStatistics,
  getPendingJobs,
} from '@/lib/services/tracking-cache';
import { trackingJobProcessor } from '@/lib/jobs/tracking-job-processor';
import {
  TrackingJobStatusResponse,
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
 * Calculate queue health status
 */
function calculateQueueHealth(stats: {
  pending: number;
  running: number;
  avgProcessingTime: number;
  errorRate: number;
}): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
  // Critical conditions
  if (stats.pending > 100 || stats.errorRate > 50) {
    return 'CRITICAL';
  }

  // Degraded conditions
  if (
    stats.pending > 50 ||
    stats.errorRate > 20 ||
    stats.avgProcessingTime > 10000
  ) {
    return 'DEGRADED';
  }

  return 'HEALTHY';
}

/**
 * GET /api/admin/tracking/job-status
 * Get comprehensive job queue status and statistics
 */
export async function GET(request: NextRequest) {
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

    // Get basic cache statistics
    const cacheStats = await getCacheStatistics();

    // Get detailed job statistics
    const [
      pendingJobsCount,
      runningJobsCount,
      completedJobsCount,
      failedJobsCount,
      totalJobsCount,
    ] = await Promise.all([
      prisma.trackingJobQueue.count({ where: { status: 'PENDING' } }),
      prisma.trackingJobQueue.count({ where: { status: 'RUNNING' } }),
      prisma.trackingJobQueue.count({ where: { status: 'COMPLETED' } }),
      prisma.trackingJobQueue.count({ where: { status: 'FAILED' } }),
      prisma.trackingJobQueue.count(),
    ]);

    // Get recent jobs for display
    const recentJobs = await prisma.trackingJobQueue.findMany({
      select: {
        id: true,
        jobType: true,
        status: true,
        createdAt: true,
        scheduledFor: true,
        attempts: true,
        lastError: true,
        trackingCache: {
          select: {
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Calculate processing statistics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCompletedJobs = await prisma.trackingUpdateLog.findMany({
      where: {
        startedAt: { gte: last24Hours },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
        apiCallSuccess: true,
        apiResponseTimeMs: true,
      },
    });

    // Calculate average processing time and success rate
    const processingTimes = recentCompletedJobs
      .filter(job => job.completedAt && job.apiResponseTimeMs)
      .map(job => job.apiResponseTimeMs!);

    const avgProcessingTime =
      processingTimes.length > 0
        ? Math.round(
            processingTimes.reduce((sum, time) => sum + time, 0) /
              processingTimes.length
          )
        : 0;

    const successfulJobs = recentCompletedJobs.filter(
      job => job.apiCallSuccess
    ).length;
    const errorRate =
      recentCompletedJobs.length > 0
        ? Math.round(
            ((recentCompletedJobs.length - successfulJobs) /
              recentCompletedJobs.length) *
              100
          )
        : 0;

    // Get processor status
    const processorStatus = trackingJobProcessor.getStatus();

    // Get next scheduled job
    const nextScheduled = await prisma.trackingJobQueue.findFirst({
      where: {
        status: 'PENDING',
        scheduledFor: { gt: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
      select: { scheduledFor: true },
    });

    // Get last processed job
    const lastProcessed = await prisma.trackingUpdateLog.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });

    // Calculate queue health
    const queueHealth = calculateQueueHealth({
      pending: pendingJobsCount,
      running: runningJobsCount,
      avgProcessingTime,
      errorRate,
    });

    const response: TrackingJobStatusResponse = {
      success: true,
      data: {
        pendingJobs: pendingJobsCount,
        runningJobs: runningJobsCount,
        completedJobs: completedJobsCount,
        failedJobs: failedJobsCount,
        totalJobs: totalJobsCount,
        averageProcessingTime: avgProcessingTime,
        lastProcessedAt: lastProcessed?.completedAt?.toISOString(),
        nextScheduledAt: nextScheduled?.scheduledFor?.toISOString(),
        queueHealth,
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          jobType: job.jobType,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
          scheduledFor: job.scheduledFor.toISOString(),
          attempts: job.attempts,
          lastError: job.lastError || undefined,
          orderNumber: job.trackingCache?.order?.orderNumber,
        })),
      },
    };

    // Track performance
    trackTrackingAPIPerformance('admin-job-status', startTime, true, {
      queueHealth,
      pendingJobs: pendingJobsCount,
      totalJobs: totalJobsCount,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Track performance for errors
    trackTrackingAPIPerformance(
      'admin-job-status',
      startTime,
      false,
      {},
      error as Error
    );

    return createTrackingErrorResponse(error as Error, request);
  }
}
