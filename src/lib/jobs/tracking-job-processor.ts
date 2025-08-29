/**
 * Tracking Job Processor
 * Main job runner for background tracking updates
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import {
  getPendingJobs,
  updateJobStatus,
  updateTrackingCache,
  createUpdateLog,
  markTrackingCacheForAttention,
} from '../services/tracking-cache';
import {
  JobProcessingContext,
  JobProcessingResult,
  JobBatchResult,
  JobProcessingError,
  ApiIntegrationError,
  EasyParcelTrackingResponse,
  TrackingEvent,
} from '../types/tracking-refactor';
import {
  TRACKING_REFACTOR_CONFIG,
  calculateNextUpdate,
  getRetryDelay,
  isDebugMode,
} from '../config/tracking-refactor';
import { easyParcelService } from '../shipping/easyparcel-service';

class TrackingJobProcessor {
  private isProcessing: boolean = false;
  private processedJobsCount: number = 0;
  private startTime: Date = new Date();

  /**
   * Process pending jobs in batches
   */
  async processJobs(): Promise<JobBatchResult> {
    if (this.isProcessing) {
      throw new JobProcessingError('Job processor is already running');
    }

    this.isProcessing = true;
    this.startTime = new Date();

    try {
      const result = await this.processBatch();
      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a batch of jobs
   */
  private async processBatch(): Promise<JobBatchResult> {
    const batchStartTime = Date.now();
    const batchSize = TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE;
    const maxConcurrent =
      TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.MAX_CONCURRENT;

    let totalJobs = 0;
    let successfulJobs = 0;
    let failedJobs = 0;
    let skippedJobs = 0;
    const errors: Array<{ jobId: string; error: string }> = [];

    try {
      // Get pending jobs
      const pendingJobs = await getPendingJobs(batchSize);
      totalJobs = pendingJobs.length;

      if (totalJobs === 0) {
        if (isDebugMode()) {
          console.log('📦 No pending jobs to process');
        }
        return {
          totalJobs: 0,
          successfulJobs: 0,
          failedJobs: 0,
          skippedJobs: 0,
          processingTimeMs: Date.now() - batchStartTime,
          errors: [],
        };
      }

      console.log(`🚀 Processing ${totalJobs} tracking jobs...`);

      // Process jobs in batches to respect concurrency limits
      for (let i = 0; i < pendingJobs.length; i += maxConcurrent) {
        const batch = pendingJobs.slice(i, i + maxConcurrent);

        const batchPromises = batch.map(async job => {
          try {
            const context: JobProcessingContext = {
              jobId: job.id,
              trackingCacheId: job.trackingCacheId,
              jobType: job.jobType,
              priority: job.priority,
              attemptNumber: job.attempts + 1,
              maxAttempts: job.maxAttempts,
              scheduledFor: job.scheduledFor,
              startedAt: new Date(),
            };

            // Mark job as running
            await updateJobStatus(job.id, 'RUNNING');

            const result = await this.processJob(context, job.trackingCache);

            if (result.success) {
              await updateJobStatus(job.id, 'COMPLETED');
              successfulJobs++;
            } else {
              if (
                result.shouldRetry &&
                context.attemptNumber < context.maxAttempts
              ) {
                // Schedule retry
                await this.scheduleRetry(job.id, result.nextRetryAt);
                skippedJobs++;
              } else {
                await updateJobStatus(job.id, 'FAILED', result.errorMessage);
                failedJobs++;
              }
            }

            // Log the job execution
            await createUpdateLog({
              trackingCacheId: job.trackingCacheId,
              updateType: job.jobType.toLowerCase(),
              triggeredBy: 'system',
              apiCallSuccess: result.success,
              apiResponseTimeMs: result.apiResponseTimeMs,
              apiErrorMessage: result.errorMessage,
              statusChanged: result.statusChanged,
              previousStatus: result.previousStatus,
              newStatus: result.newStatus,
              eventsAdded: result.eventsAdded,
              startedAt: context.startedAt,
              completedAt: new Date(),
            });
          } catch (error) {
            console.error(`❌ Job processing error for job ${job.id}:`, error);
            await updateJobStatus(job.id, 'FAILED', error.message);
            errors.push({
              jobId: job.id,
              error: error.message,
            });
            failedJobs++;
          }
        });

        // Wait for current batch to complete before processing next batch
        await Promise.all(batchPromises);
      }

      const processingTimeMs = Date.now() - batchStartTime;
      console.log(
        `✅ Batch processing complete: ${successfulJobs}/${totalJobs} successful (${processingTimeMs}ms)`
      );

      return {
        totalJobs,
        successfulJobs,
        failedJobs,
        skippedJobs,
        processingTimeMs,
        errors,
      };
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw new JobProcessingError(`Batch processing failed: ${error.message}`);
    }
  }

  /**
   * Process individual job
   */
  private async processJob(
    context: JobProcessingContext,
    trackingCache: any
  ): Promise<JobProcessingResult> {
    const startTime = Date.now();

    try {
      if (isDebugMode()) {
        console.log(
          `🔄 Processing job ${context.jobId} (${context.jobType}) for order ${trackingCache.order.orderNumber}`
        );
      }

      switch (context.jobType) {
        case 'UPDATE':
        case 'RETRY':
          return await this.processUpdateJob(context, trackingCache);

        case 'MANUAL':
          return await this.processManualJob(context, trackingCache);

        case 'CLEANUP':
          return await this.processCleanupJob(context, trackingCache);

        default:
          throw new JobProcessingError(`Unknown job type: ${context.jobType}`);
      }
    } catch (error) {
      console.error(`❌ Job ${context.jobId} failed:`, error);

      return {
        success: false,
        statusChanged: false,
        eventsAdded: 0,
        apiResponseTimeMs: Date.now() - startTime,
        errorMessage: error.message,
        shouldRetry:
          error instanceof ApiIntegrationError &&
          context.attemptNumber < context.maxAttempts,
        nextRetryAt:
          error instanceof ApiIntegrationError
            ? new Date(Date.now() + getRetryDelay(context.attemptNumber))
            : undefined,
      };
    }
  }

  /**
   * Process update/retry job
   */
  private async processUpdateJob(
    context: JobProcessingContext,
    trackingCache: any
  ): Promise<JobProcessingResult> {
    const apiStartTime = Date.now();

    try {
      // Call EasyParcel API
      const trackingResult = await easyParcelService.trackShipment(
        trackingCache.courierTrackingNumber
      );
      const apiResponse: EasyParcelTrackingResponse = {
        success: trackingResult?.success || false,
        data: trackingResult?.success
          ? {
              trackingNumber: trackingCache.courierTrackingNumber,
              status: trackingResult.status || 'UNKNOWN',
              statusDescription: trackingResult.statusDescription,
              estimatedDelivery: trackingResult.estimatedDelivery,
              actualDelivery: trackingResult.actualDelivery,
              events: trackingResult.events || [],
              courierDetails: {
                service: trackingCache.courierService,
                name:
                  trackingResult.courierName || trackingCache.courierService,
              },
            }
          : undefined,
        error: !trackingResult?.success
          ? {
              code: 'API_ERROR',
              message: trackingResult?.error || 'API call failed',
            }
          : undefined,
      };

      const apiResponseTime = Date.now() - apiStartTime;

      if (!apiResponse.success || !apiResponse.data) {
        // API call failed
        const shouldRetry = context.attemptNumber < context.maxAttempts;
        const nextRetryAt = shouldRetry
          ? new Date(Date.now() + getRetryDelay(context.attemptNumber))
          : undefined;

        // Mark for attention if max retries exceeded
        if (!shouldRetry) {
          await markTrackingCacheForAttention(
            context.trackingCacheId,
            `API call failed after ${context.maxAttempts} attempts: ${apiResponse.error?.message}`
          );
        }

        return {
          success: false,
          statusChanged: false,
          eventsAdded: 0,
          apiResponseTimeMs: apiResponseTime,
          errorMessage: apiResponse.error?.message || 'API call failed',
          shouldRetry,
          nextRetryAt,
        };
      }

      // Process successful API response
      const currentStatus = trackingCache.currentStatus;
      const newStatus = apiResponse.data.status;
      const statusChanged = currentStatus !== newStatus;

      // Convert API events to our format
      const newEvents: TrackingEvent[] = apiResponse.data.events.map(event => ({
        eventCode: event.eventCode || 'UNKNOWN',
        eventName: event.eventName,
        description: event.description,
        location: event.location,
        timestamp: event.timestamp,
        timezone: event.timezone || 'Asia/Kuala_Lumpur',
        source: 'EASYPARCEL',
      }));

      // Check for new events
      const existingEvents = Array.isArray(trackingCache.trackingEvents)
        ? trackingCache.trackingEvents
        : [];
      const existingEventIds = new Set(
        existingEvents.map((e: any) => `${e.timestamp}-${e.eventName}`)
      );
      const eventsToAdd = newEvents.filter(
        event => !existingEventIds.has(`${event.timestamp}-${event.eventName}`)
      );

      // Merge events
      const allEvents = [...existingEvents, ...eventsToAdd];

      // Calculate next update time
      const nextUpdateDue = calculateNextUpdate(
        newStatus,
        new Date(),
        0, // Reset failure count on success
        apiResponse.data.estimatedDelivery
          ? new Date(apiResponse.data.estimatedDelivery)
          : trackingCache.estimatedDelivery
      );

      // Update tracking cache
      await updateTrackingCache(context.trackingCacheId, {
        currentStatus: newStatus,
        lastStatusUpdate: new Date(),
        trackingEvents: allEvents,
        estimatedDelivery: apiResponse.data.estimatedDelivery
          ? new Date(apiResponse.data.estimatedDelivery)
          : trackingCache.estimatedDelivery,
        actualDelivery: apiResponse.data.actualDelivery
          ? new Date(apiResponse.data.actualDelivery)
          : trackingCache.actualDelivery,
        lastApiUpdate: new Date(),
        nextUpdateDue,
        consecutiveFailures: 0,
        lastApiResponse: apiResponse.data,
        apiResponseHash: this.generateResponseHash(apiResponse.data),
      });

      if (isDebugMode()) {
        console.log(
          `✅ Job ${context.jobId} completed: ${statusChanged ? 'status changed' : 'no changes'}, ${eventsToAdd.length} new events`
        );
      }

      return {
        success: true,
        statusChanged,
        eventsAdded: eventsToAdd.length,
        previousStatus: statusChanged ? currentStatus : undefined,
        newStatus: statusChanged ? newStatus : undefined,
        apiResponseTimeMs: apiResponseTime,
        shouldRetry: false,
      };
    } catch (error) {
      console.error(
        `❌ Update job failed for cache ${context.trackingCacheId}:`,
        error
      );

      // Increment failure count
      await updateTrackingCache(context.trackingCacheId, {
        consecutiveFailures: trackingCache.consecutiveFailures + 1,
      });

      throw error;
    }
  }

  /**
   * Process manual job (higher priority, immediate execution)
   */
  private async processManualJob(
    context: JobProcessingContext,
    trackingCache: any
  ): Promise<JobProcessingResult> {
    // Manual jobs are essentially update jobs with higher priority
    return await this.processUpdateJob(context, trackingCache);
  }

  /**
   * Process cleanup job
   */
  private async processCleanupJob(
    context: JobProcessingContext,
    trackingCache: any
  ): Promise<JobProcessingResult> {
    try {
      // For now, cleanup jobs just mark inactive tracking as archived
      if (!trackingCache.isActive && trackingCache.isDelivered) {
        await updateTrackingCache(context.trackingCacheId, {
          // Add any cleanup logic here
        });
      }

      return {
        success: true,
        statusChanged: false,
        eventsAdded: 0,
        shouldRetry: false,
      };
    } catch (error) {
      throw new JobProcessingError(`Cleanup job failed: ${error.message}`);
    }
  }

  /**
   * Schedule retry for failed job
   */
  private async scheduleRetry(jobId: string, retryAt?: Date): Promise<void> {
    // For now, we just update the job to pending status
    // In a full implementation, we'd reschedule the job
    await updateJobStatus(jobId, 'PENDING');
  }

  /**
   * Generate hash for API response to detect changes
   */
  private generateResponseHash(apiData: any): string {
    const str = JSON.stringify({
      status: apiData.status,
      events: apiData.events?.map((e: any) => `${e.timestamp}-${e.eventName}`),
      estimatedDelivery: apiData.estimatedDelivery,
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processedJobsCount: this.processedJobsCount,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

// ==================== EXPORTS ====================

export const trackingJobProcessor = new TrackingJobProcessor();
export { TrackingJobProcessor };
