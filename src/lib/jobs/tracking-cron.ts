/**
 * Tracking Cron Job Setup
 * Automated scheduling for tracking updates
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { trackingJobProcessor } from './tracking-job-processor';
import {
  getTrackingCachesDueForUpdate,
  createJob,
  cleanupCompletedJobs,
  getCacheStatistics,
  validateCacheConsistency,
} from '../services/tracking-cache';
import {
  TRACKING_REFACTOR_CONFIG,
  getJobPriority,
  isDebugMode,
} from '../config/tracking-refactor';
import { TrackingRefactorError } from '../types/tracking-refactor';

class TrackingCronManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  /**
   * Start all cron jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Tracking cron jobs are already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting tracking cron jobs...');

    try {
      // Every 15 minutes: Process urgent jobs
      this.scheduleInterval('urgent-jobs', 15 * 60 * 1000, () => {
        this.processUrgentJobs();
      });

      // Every hour: Process regular updates
      this.scheduleInterval('regular-updates', 60 * 60 * 1000, () => {
        this.processRegularUpdates();
      });

      // Every 6 hours: Cleanup completed jobs
      this.scheduleInterval('cleanup-jobs', 6 * 60 * 60 * 1000, () => {
        this.performCleanupTasks();
      });

      // Daily: Generate reports and validate consistency
      this.scheduleInterval('daily-maintenance', 24 * 60 * 60 * 1000, () => {
        this.performDailyMaintenance();
      });

      // If debug mode, run a quick health check every 5 minutes
      if (isDebugMode()) {
        this.scheduleInterval('debug-health-check', 5 * 60 * 1000, () => {
          this.performHealthCheck();
        });
      }

      console.log('✅ Tracking cron jobs started successfully');
      
      // Run initial health check
      await this.performHealthCheck();

    } catch (error) {
      console.error('❌ Failed to start tracking cron jobs:', error);
      this.stop();
      throw error;
    }
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    console.log('🛑 Stopping tracking cron jobs...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      if (isDebugMode()) {
        console.log(`Stopped ${name} interval`);
      }
    });
    
    this.intervals.clear();
    this.isRunning = false;
    
    console.log('✅ Tracking cron jobs stopped');
  }

  /**
   * Schedule an interval with error handling
   */
  private scheduleInterval(name: string, intervalMs: number, callback: () => Promise<void> | void): void {
    const interval = setInterval(async () => {
      try {
        if (isDebugMode()) {
          console.log(`🔄 Running ${name} task...`);
        }
        await callback();
      } catch (error) {
        console.error(`❌ Error in ${name} task:`, error);
      }
    }, intervalMs);

    this.intervals.set(name, interval);
    
    if (isDebugMode()) {
      console.log(`📅 Scheduled ${name} to run every ${intervalMs / 1000} seconds`);
    }
  }

  /**
   * Process urgent jobs (high priority, manual requests)
   */
  private async processUrgentJobs(): Promise<void> {
    try {
      const result = await trackingJobProcessor.processJobs();
      
      if (result.totalJobs > 0) {
        console.log(`🔥 Urgent jobs processed: ${result.successfulJobs}/${result.totalJobs} successful`);
        
        if (result.failedJobs > 0) {
          console.warn(`⚠️ ${result.failedJobs} urgent jobs failed`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to process urgent jobs:', error);
    }
  }

  /**
   * Process regular tracking updates
   */
  private async processRegularUpdates(): Promise<void> {
    try {
      // Get caches that need updating
      const cachesToUpdate = await getTrackingCachesDueForUpdate(
        TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE * 2
      );

      if (cachesToUpdate.length === 0) {
        if (isDebugMode()) {
          console.log('📦 No tracking caches need updating');
        }
        return;
      }

      console.log(`🔄 Creating update jobs for ${cachesToUpdate.length} tracking caches...`);

      // Create jobs for each cache that needs updating
      let jobsCreated = 0;
      for (const cache of cachesToUpdate) {
        try {
          await createJob({
            trackingCacheId: cache.id,
            jobType: 'UPDATE',
            priority: getJobPriority('UPDATE'),
            scheduledFor: new Date(),
          });
          jobsCreated++;
        } catch (error) {
          console.error(`Failed to create job for cache ${cache.id}:`, error);
        }
      }

      console.log(`✅ Created ${jobsCreated} update jobs`);

      // Process the jobs
      const result = await trackingJobProcessor.processJobs();
      console.log(`📊 Regular updates processed: ${result.successfulJobs}/${result.totalJobs} successful`);

    } catch (error) {
      console.error('❌ Failed to process regular updates:', error);
    }
  }

  /**
   * Perform cleanup tasks
   */
  private async performCleanupTasks(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup tasks...');

      // Clean up old completed jobs
      const cleanupDays = TRACKING_REFACTOR_CONFIG.ARCHIVE.ARCHIVE_AFTER_DAYS || 7;
      const deletedJobs = await cleanupCompletedJobs(cleanupDays);

      if (deletedJobs > 0) {
        console.log(`🗑️ Cleaned up ${deletedJobs} old jobs`);
      }

      // Get cache statistics for monitoring
      const stats = await getCacheStatistics();
      console.log('📊 Cache statistics:', {
        totalCaches: stats.caches.total,
        activeCaches: stats.caches.active,
        pendingJobs: stats.jobs.pending,
        runningJobs: stats.jobs.running,
      });

      // Alert if there are too many failed or attention-required caches
      if (stats.caches.failed > 10) {
        console.warn(`⚠️ High number of failed caches: ${stats.caches.failed}`);
      }

      if (stats.caches.requiresAttention > 5) {
        console.warn(`⚠️ ${stats.caches.requiresAttention} caches require attention`);
      }

      console.log('✅ Cleanup tasks completed');

    } catch (error) {
      console.error('❌ Failed to perform cleanup tasks:', error);
    }
  }

  /**
   * Perform daily maintenance tasks
   */
  private async performDailyMaintenance(): Promise<void> {
    try {
      console.log('🔧 Starting daily maintenance...');

      // Validate cache consistency
      const consistencyIssues = await validateCacheConsistency();
      
      if (consistencyIssues.length > 0) {
        console.warn(`⚠️ Found ${consistencyIssues.length} cache consistency issues:`);
        consistencyIssues.forEach(issue => {
          console.warn(`  - Order ${issue.orderId}: ${issue.issues.join(', ')}`);
        });
      } else {
        console.log('✅ Cache consistency validation passed');
      }

      // Get detailed statistics
      const stats = await getCacheStatistics();
      
      // Daily report
      console.log('📊 Daily Tracking Report:', {
        date: new Date().toISOString().split('T')[0],
        caches: stats.caches,
        jobs: stats.jobs,
        consistencyIssues: consistencyIssues.length,
      });

      // Performance metrics
      const processorStatus = trackingJobProcessor.getStatus();
      console.log('⚡ Processor Performance:', {
        uptime: Math.round(processorStatus.uptime / 1000 / 60), // minutes
        processedJobs: processorStatus.processedJobsCount,
        isProcessing: processorStatus.isProcessing,
      });

      console.log('✅ Daily maintenance completed');

    } catch (error) {
      console.error('❌ Failed to perform daily maintenance:', error);
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const stats = await getCacheStatistics();
      const processorStatus = trackingJobProcessor.getStatus();

      const health = {
        timestamp: new Date().toISOString(),
        status: 'HEALTHY',
        caches: stats.caches,
        jobs: stats.jobs,
        processor: processorStatus,
      };

      // Check for issues
      const warnings = [];

      if (stats.jobs.pending > 100) {
        warnings.push('High number of pending jobs');
        health.status = 'DEGRADED';
      }

      if (stats.caches.failed > 20) {
        warnings.push('High number of failed caches');
        health.status = 'DEGRADED';
      }

      if (stats.caches.requiresAttention > 10) {
        warnings.push('Many caches require attention');
        health.status = 'DEGRADED';
      }

      if (processorStatus.isProcessing && processorStatus.uptime > 5 * 60 * 1000) {
        warnings.push('Processor has been running for a long time');
      }

      if (warnings.length > 0) {
        console.warn('⚠️ Health check warnings:', warnings);
      }

      if (isDebugMode()) {
        console.log('🏥 Health check:', health);
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  /**
   * Get cron manager status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: Array.from(this.intervals.keys()),
      intervalCount: this.intervals.size,
    };
  }
}

// ==================== MANUAL TRIGGER FUNCTIONS ====================

/**
 * Manually trigger urgent job processing
 */
export const triggerUrgentJobs = async (): Promise<void> => {
  console.log('🔥 Manually triggering urgent job processing...');
  
  try {
    const result = await trackingJobProcessor.processJobs();
    console.log(`✅ Manual urgent jobs completed: ${result.successfulJobs}/${result.totalJobs} successful`);
    return result;
  } catch (error) {
    console.error('❌ Manual urgent job processing failed:', error);
    throw new TrackingRefactorError(
      `Manual urgent job processing failed: ${error.message}`,
      'MANUAL_TRIGGER_ERROR'
    );
  }
};

/**
 * Manually trigger tracking updates for specific orders
 */
export const triggerManualUpdate = async (orderIds: string[]): Promise<void> => {
  console.log(`🔧 Manually triggering updates for ${orderIds.length} orders...`);
  
  try {
    let jobsCreated = 0;
    
    for (const orderId of orderIds) {
      // Get tracking cache for order
      const { getTrackingCacheByOrderId } = await import('../services/tracking-cache');
      const cache = await getTrackingCacheByOrderId(orderId);
      
      if (!cache) {
        console.warn(`⚠️ No tracking cache found for order ${orderId}`);
        continue;
      }

      // Create manual job with high priority
      await createJob({
        trackingCacheId: cache.id,
        jobType: 'MANUAL',
        priority: getJobPriority('MANUAL'),
        scheduledFor: new Date(),
      });
      
      jobsCreated++;
    }

    console.log(`✅ Created ${jobsCreated} manual update jobs`);

    // Process the jobs immediately
    const result = await trackingJobProcessor.processJobs();
    console.log(`📊 Manual updates processed: ${result.successfulJobs}/${result.totalJobs} successful`);

  } catch (error) {
    console.error('❌ Manual update trigger failed:', error);
    throw new TrackingRefactorError(
      `Manual update trigger failed: ${error.message}`,
      'MANUAL_UPDATE_ERROR'
    );
  }
};

/**
 * Manually trigger cleanup
 */
export const triggerCleanup = async (): Promise<void> => {
  console.log('🧹 Manually triggering cleanup...');
  
  try {
    const cronManager = new TrackingCronManager();
    await cronManager.performCleanupTasks();
    console.log('✅ Manual cleanup completed');
  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    throw new TrackingRefactorError(
      `Manual cleanup failed: ${error.message}`,
      'MANUAL_CLEANUP_ERROR'
    );
  }
};

// ==================== EXPORTS ====================

export const trackingCronManager = new TrackingCronManager();
export { TrackingCronManager };