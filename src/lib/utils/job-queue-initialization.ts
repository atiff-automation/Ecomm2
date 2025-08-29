/**
 * Job Queue Initialization Utility
 * Populates initial job queue and starts background processing
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import {
  getTrackingCachesDueForUpdate,
  createJob,
  getCacheStatistics,
} from '../services/tracking-cache';
import {
  getJobPriority,
  calculateNextUpdate,
  TRACKING_REFACTOR_CONFIG,
} from '../config/tracking-refactor';
import { trackingCronManager } from '../jobs/tracking-cron';
import { TrackingRefactorError } from '../types/tracking-refactor';
import { prisma } from '@/lib/db/prisma';

interface InitializationStats {
  activeTrackingCaches: number;
  jobsCreated: number;
  jobsByType: Record<string, number>;
  processingTimeMs: number;
  errors: Array<{
    cacheId: string;
    error: string;
  }>;
}

interface InitializationOptions {
  createInitialJobs?: boolean;
  startCronJobs?: boolean;
  forceRefreshAll?: boolean;
  batchSize?: number;
  dryRun?: boolean;
}

/**
 * Initialize job queue system
 */
export async function initializeJobQueue(
  options: InitializationOptions = {}
): Promise<InitializationStats> {
  const startTime = Date.now();
  const {
    createInitialJobs = true,
    startCronJobs = true,
    forceRefreshAll = false,
    batchSize = 100,
    dryRun = false,
  } = options;

  console.log(
    `🚀 Initializing tracking job queue${dryRun ? ' (DRY RUN)' : ''}...`
  );

  const stats: InitializationStats = {
    activeTrackingCaches: 0,
    jobsCreated: 0,
    jobsByType: {
      UPDATE: 0,
      MANUAL: 0,
      RETRY: 0,
      CLEANUP: 0,
    },
    processingTimeMs: 0,
    errors: [],
  };

  try {
    // Get statistics about current tracking caches
    const cacheStats = await getCacheStatistics();
    stats.activeTrackingCaches = cacheStats.caches.active;

    console.log(`📊 Current tracking cache stats:`, cacheStats);

    if (createInitialJobs) {
      await createInitialJobs(stats, forceRefreshAll, batchSize, dryRun);
    }

    if (startCronJobs && !dryRun) {
      await startCronJobSystem();
    }

    stats.processingTimeMs = Date.now() - startTime;

    console.log(
      `✅ Job queue initialization completed in ${stats.processingTimeMs}ms:`
    );
    console.log(`  - Active tracking caches: ${stats.activeTrackingCaches}`);
    console.log(`  - Jobs created: ${stats.jobsCreated}`);
    console.log(`  - Job types:`, stats.jobsByType);
    console.log(`  - Errors: ${stats.errors.length}`);
    console.log(`  - Cron jobs started: ${startCronJobs && !dryRun}`);

    if (stats.errors.length > 0) {
      console.log('❌ Initialization errors:');
      stats.errors.forEach(error => {
        console.log(`  - Cache ${error.cacheId}: ${error.error}`);
      });
    }

    return stats;
  } catch (error) {
    console.error('❌ Job queue initialization failed:', error);
    throw new TrackingRefactorError(
      `Job queue initialization failed: ${error.message}`,
      'INITIALIZATION_ERROR',
      500,
      true,
      { stats }
    );
  }
}

/**
 * Create initial jobs for tracking caches
 */
async function createInitialJobs(
  stats: InitializationStats,
  forceRefreshAll: boolean,
  batchSize: number,
  dryRun: boolean
): Promise<void> {
  try {
    if (forceRefreshAll) {
      console.log('🔄 Creating jobs for ALL active tracking caches...');

      // Get all active tracking caches in batches
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const activeCaches = await prisma.trackingCache.findMany({
          where: {
            isActive: true,
            isDelivered: false,
          },
          include: {
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
          take: batchSize,
          skip: offset,
        });

        if (activeCaches.length === 0) {
          hasMore = false;
          break;
        }

        console.log(
          `📦 Processing batch ${Math.floor(offset / batchSize) + 1}: ${activeCaches.length} caches`
        );

        for (const cache of activeCaches) {
          try {
            if (dryRun) {
              console.log(
                `🔍 DRY RUN - Would create job for order ${cache.order.orderNumber}`
              );
              stats.jobsCreated++;
              stats.jobsByType.UPDATE++;
              continue;
            }

            const jobId = await createJob({
              trackingCacheId: cache.id,
              jobType: 'UPDATE',
              priority: getJobPriority('UPDATE'),
              scheduledFor: new Date(), // Immediate processing
            });

            console.log(`✅ Created job for order ${cache.order.orderNumber}`);
            stats.jobsCreated++;
            stats.jobsByType.UPDATE++;
          } catch (error) {
            console.error(
              `❌ Failed to create job for cache ${cache.id}:`,
              error
            );
            stats.errors.push({
              cacheId: cache.id,
              error: error.message,
            });
          }
        }

        offset += batchSize;

        // Add small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      console.log('🎯 Creating jobs for tracking caches due for update...');

      // Get only caches that are due for update
      const dueForUpdate = await getTrackingCachesDueForUpdate(batchSize * 2);

      if (dueForUpdate.length === 0) {
        console.log('📋 No tracking caches are currently due for update');
        return;
      }

      console.log(`📦 Found ${dueForUpdate.length} caches due for update`);

      for (const cache of dueForUpdate) {
        try {
          if (dryRun) {
            console.log(
              `🔍 DRY RUN - Would create job for order ${cache.order.orderNumber}`
            );
            stats.jobsCreated++;
            stats.jobsByType.UPDATE++;
            continue;
          }

          const jobId = await createJob({
            trackingCacheId: cache.id,
            jobType: 'UPDATE',
            priority: getJobPriority('UPDATE'),
            scheduledFor: new Date(), // Immediate processing
          });

          console.log(`✅ Created job for order ${cache.order.orderNumber}`);
          stats.jobsCreated++;
          stats.jobsByType.UPDATE++;
        } catch (error) {
          console.error(
            `❌ Failed to create job for cache ${cache.id}:`,
            error
          );
          stats.errors.push({
            cacheId: cache.id,
            error: error.message,
          });
        }
      }
    }

    // Create cleanup jobs for old completed jobs
    if (!dryRun && stats.jobsCreated > 0) {
      try {
        const cleanupJobId = await createJob({
          trackingCacheId: '', // Special case for cleanup jobs
          jobType: 'CLEANUP',
          priority: getJobPriority('CLEANUP'),
          scheduledFor: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        });

        console.log('🧹 Created cleanup job');
        stats.jobsCreated++;
        stats.jobsByType.CLEANUP++;
      } catch (error) {
        console.warn('⚠️ Failed to create cleanup job:', error.message);
      }
    }
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to create initial jobs: ${error.message}`,
      'JOB_CREATION_ERROR',
      500
    );
  }
}

/**
 * Start cron job system
 */
async function startCronJobSystem(): Promise<void> {
  try {
    console.log('⏰ Starting cron job system...');

    // Check if cron jobs are already running
    const cronStatus = trackingCronManager.getStatus();
    if (cronStatus.isRunning) {
      console.log('⚠️ Cron job system is already running');
      return;
    }

    await trackingCronManager.start();
    console.log('✅ Cron job system started successfully');
  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to start cron job system: ${error.message}`,
      'CRON_START_ERROR',
      500
    );
  }
}

/**
 * Stop job queue system
 */
export async function stopJobQueue(): Promise<void> {
  try {
    console.log('🛑 Stopping tracking job queue system...');

    trackingCronManager.stop();
    console.log('✅ Job queue system stopped');
  } catch (error) {
    console.error('❌ Failed to stop job queue system:', error);
    throw new TrackingRefactorError(
      `Failed to stop job queue system: ${error.message}`,
      'STOP_ERROR',
      500
    );
  }
}

/**
 * Reset job queue (clear all pending jobs)
 */
export async function resetJobQueue(
  options: {
    keepRunningJobs?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<{
  deletedJobs: number;
  keptJobs: number;
}> {
  const { keepRunningJobs = true, dryRun = false } = options;

  console.log(`🔄 Resetting job queue${dryRun ? ' (DRY RUN)' : ''}...`);

  try {
    const whereClause: any = {};

    if (keepRunningJobs) {
      whereClause.status = { not: 'RUNNING' };
    }

    if (dryRun) {
      const jobsToDelete = await prisma.trackingJobQueue.count({
        where: whereClause,
      });

      const keptJobs = await prisma.trackingJobQueue.count({
        where: keepRunningJobs ? { status: 'RUNNING' } : {},
      });

      console.log(
        `🔍 DRY RUN - Would delete ${jobsToDelete} jobs, keep ${keptJobs} jobs`
      );

      return {
        deletedJobs: jobsToDelete,
        keptJobs,
      };
    }

    // Count jobs before deletion
    const keptJobs = keepRunningJobs
      ? await prisma.trackingJobQueue.count({ where: { status: 'RUNNING' } })
      : 0;

    // Delete jobs
    const result = await prisma.trackingJobQueue.deleteMany({
      where: whereClause,
    });

    console.log(
      `✅ Job queue reset completed: deleted ${result.count} jobs, kept ${keptJobs} jobs`
    );

    return {
      deletedJobs: result.count,
      keptJobs,
    };
  } catch (error) {
    console.error('❌ Failed to reset job queue:', error);
    throw new TrackingRefactorError(
      `Failed to reset job queue: ${error.message}`,
      'RESET_ERROR',
      500
    );
  }
}

/**
 * Get job queue health status
 */
export async function getJobQueueHealth(): Promise<{
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  metrics: {
    pendingJobs: number;
    runningJobs: number;
    failedJobs: number;
    avgWaitTime: number;
    cronStatus: boolean;
  };
  issues: string[];
}> {
  try {
    const [pendingJobs, runningJobs, failedJobs] = await Promise.all([
      prisma.trackingJobQueue.count({ where: { status: 'PENDING' } }),
      prisma.trackingJobQueue.count({ where: { status: 'RUNNING' } }),
      prisma.trackingJobQueue.count({ where: { status: 'FAILED' } }),
    ]);

    // Calculate average wait time for pending jobs
    const pendingJobsWithTime = await prisma.trackingJobQueue.findMany({
      where: { status: 'PENDING' },
      select: { createdAt: true, scheduledFor: true },
    });

    const now = new Date();
    const waitTimes = pendingJobsWithTime.map(job =>
      Math.max(0, now.getTime() - job.scheduledFor.getTime())
    );

    const avgWaitTime =
      waitTimes.length > 0
        ? Math.round(
            waitTimes.reduce((sum, time) => sum + time, 0) /
              waitTimes.length /
              1000
          ) // Convert to seconds
        : 0;

    const cronStatus = trackingCronManager.getStatus().isRunning;

    const issues: string[] = [];
    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';

    // Check for critical issues
    if (pendingJobs > 100) {
      issues.push(`High number of pending jobs: ${pendingJobs}`);
      status = 'CRITICAL';
    }

    if (!cronStatus) {
      issues.push('Cron job system is not running');
      status = 'CRITICAL';
    }

    if (failedJobs > 50) {
      issues.push(`High number of failed jobs: ${failedJobs}`);
      if (status === 'HEALTHY') {
        status = 'DEGRADED';
      }
    }

    // Check for degraded conditions
    if (pendingJobs > 50) {
      issues.push(`Elevated number of pending jobs: ${pendingJobs}`);
      if (status === 'HEALTHY') {
        status = 'DEGRADED';
      }
    }

    if (avgWaitTime > 300) {
      // 5 minutes
      issues.push(`Long average wait time: ${avgWaitTime} seconds`);
      if (status === 'HEALTHY') {
        status = 'DEGRADED';
      }
    }

    if (runningJobs === 0 && pendingJobs > 0) {
      issues.push('Jobs are pending but none are running');
      if (status === 'HEALTHY') {
        status = 'DEGRADED';
      }
    }

    return {
      status,
      metrics: {
        pendingJobs,
        runningJobs,
        failedJobs,
        avgWaitTime,
        cronStatus,
      },
      issues,
    };
  } catch (error) {
    return {
      status: 'CRITICAL',
      metrics: {
        pendingJobs: 0,
        runningJobs: 0,
        failedJobs: 0,
        avgWaitTime: 0,
        cronStatus: false,
      },
      issues: [`Health check failed: ${error.message}`],
    };
  }
}
