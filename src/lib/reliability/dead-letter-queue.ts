/**
 * Centralized Dead Letter Queue Service
 * SINGLE SOURCE OF TRUTH for handling failed notifications across the application
 * NO HARDCODE - All DLQ configuration centralized and environment-driven
 */

import { prisma } from '@/lib/db/prisma';

// CENTRALIZED CONFIGURATION - Single source of truth
const DLQ_CONFIG = {
  MAX_RETRY_ATTEMPTS: parseInt(process.env.DLQ_MAX_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY_HOURS: parseInt(process.env.DLQ_RETRY_DELAY_HOURS || '1'),
  CLEANUP_AFTER_DAYS: parseInt(process.env.DLQ_CLEANUP_AFTER_DAYS || '30'),
  BATCH_SIZE: parseInt(process.env.DLQ_BATCH_SIZE || '50'),
  PROCESSING_INTERVAL_MS: parseInt(process.env.DLQ_PROCESSING_INTERVAL_MS || '300000'), // 5 minutes
  ALERT_THRESHOLD: parseInt(process.env.DLQ_ALERT_THRESHOLD || '100'),
} as const;

interface FailedNotification {
  id: string;
  type: string;
  payload: any;
  recipient: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP';
  failureReason: string;
  retryCount: number;
  nextRetryAt?: Date;
  createdAt: Date;
  lastAttemptAt: Date;
  metadata?: Record<string, any>;
}

interface DLQMetrics {
  totalFailed: number;
  pendingRetries: number;
  permanentFailures: number;
  successfulRetries: number;
  processingErrors: number;
}

interface RetryResult {
  success: boolean;
  notificationId: string;
  error?: string;
  shouldRetry: boolean;
}

/**
 * CENTRALIZED Dead Letter Queue Class - Single Source of Truth
 */
export class DeadLetterQueue {
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * SYSTEMATIC failed notification recording - Single source of truth
   */
  static async recordFailedNotification(
    type: string,
    payload: any,
    recipient: string,
    channel: 'EMAIL' | 'SMS' | 'PUSH' | 'TELEGRAM' | 'IN_APP',
    error: Error,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // CENTRALIZED failure analysis
      const failureAnalysis = this.analyzeFailure(error);

      // SYSTEMATIC database storage
      const failedNotification = await prisma.failedNotification.create({
        data: {
          type,
          payload: JSON.stringify(payload),
          recipient,
          channel,
          failureReason: error.message,
          stackTrace: error.stack,
          retryCount: 0,
          nextRetryAt: failureAnalysis.shouldRetry
            ? new Date(Date.now() + DLQ_CONFIG.RETRY_DELAY_HOURS * 60 * 60 * 1000)
            : null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          createdAt: new Date(),
          lastAttemptAt: new Date(),
        },
      });

      console.error(`💀 Notification failed and queued in DLQ:`, {
        id: failedNotification.id,
        type,
        channel,
        recipient: this.maskRecipient(recipient),
        error: error.message,
        willRetry: failureAnalysis.shouldRetry,
      });

      // CENTRALIZED alerting check
      await this.checkAlertThreshold();

      return failedNotification.id;
    } catch (dbError) {
      console.error('❌ Failed to record notification in DLQ:', dbError);
      throw new Error('Could not record failed notification in dead letter queue');
    }
  }

  /**
   * CENTRALIZED failure analysis - Single source of truth
   */
  private static analyzeFailure(error: Error): { shouldRetry: boolean; category: string } {
    const errorMessage = error.message.toLowerCase();

    // SYSTEMATIC non-retryable error patterns
    const nonRetryablePatterns = [
      /invalid.*token/,
      /authentication.*failed/,
      /forbidden/,
      /not.*found/,
      /malformed/,
      /invalid.*format/,
      /permission.*denied/,
      /user.*not.*exist/,
      /invalid.*recipient/,
    ];

    // CENTRALIZED retryable error patterns
    const retryablePatterns = [
      /timeout/,
      /connection.*failed/,
      /network.*error/,
      /rate.*limit/,
      /service.*unavailable/,
      /temporary.*failure/,
      /server.*error/,
      /internal.*error/,
    ];

    // Check non-retryable patterns first
    for (const pattern of nonRetryablePatterns) {
      if (pattern.test(errorMessage)) {
        return { shouldRetry: false, category: 'permanent' };
      }
    }

    // Check retryable patterns
    for (const pattern of retryablePatterns) {
      if (pattern.test(errorMessage)) {
        return { shouldRetry: true, category: 'transient' };
      }
    }

    // Default to retryable for unknown errors - SAFE FALLBACK
    return { shouldRetry: true, category: 'unknown' };
  }

  /**
   * SYSTEMATIC DLQ processing - DRY PRINCIPLE
   */
  static async processPendingRetries(): Promise<DLQMetrics> {
    const metrics: DLQMetrics = {
      totalFailed: 0,
      pendingRetries: 0,
      permanentFailures: 0,
      successfulRetries: 0,
      processingErrors: 0,
    };

    try {
      // CENTRALIZED pending retry query
      const pendingRetries = await prisma.failedNotification.findMany({
        where: {
          nextRetryAt: {
            lte: new Date(),
          },
          retryCount: {
            lt: DLQ_CONFIG.MAX_RETRY_ATTEMPTS,
          },
        },
        take: DLQ_CONFIG.BATCH_SIZE,
        orderBy: {
          nextRetryAt: 'asc',
        },
      });

      metrics.pendingRetries = pendingRetries.length;

      console.log(`🔄 Processing ${pendingRetries.length} failed notifications from DLQ`);

      // SYSTEMATIC batch processing
      const retryResults = await Promise.allSettled(
        pendingRetries.map(notification => this.retryNotification(notification))
      );

      // CENTRALIZED results processing
      for (let i = 0; i < retryResults.length; i++) {
        const result = retryResults[i];
        const notification = pendingRetries[i];

        if (result.status === 'fulfilled') {
          const retryResult = result.value;

          if (retryResult.success) {
            metrics.successfulRetries++;
            await this.markAsResolved(notification.id);
          } else {
            await this.updateRetryCount(notification, retryResult.error || 'Unknown error');

            if (!retryResult.shouldRetry || notification.retryCount >= DLQ_CONFIG.MAX_RETRY_ATTEMPTS - 1) {
              metrics.permanentFailures++;
              await this.markAsPermanentFailure(notification.id);
            }
          }
        } else {
          metrics.processingErrors++;
          console.error(`Error processing DLQ notification ${notification.id}:`, result.reason);
        }
      }

      // SYSTEMATIC metrics collection
      const totalMetrics = await this.getMetrics();
      return { ...metrics, ...totalMetrics };
    } catch (error) {
      console.error('❌ Error processing DLQ:', error);
      throw error;
    }
  }

  /**
   * CENTRALIZED notification retry - Single source of truth
   */
  private static async retryNotification(notification: any): Promise<RetryResult> {
    try {
      // SYSTEMATIC payload parsing
      const payload = JSON.parse(notification.payload);
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : undefined;

      // CENTRALIZED channel-specific retry logic
      let retrySuccess = false;

      switch (notification.channel) {
        case 'TELEGRAM':
          retrySuccess = await this.retryTelegramNotification(payload, notification.recipient);
          break;

        case 'EMAIL':
          retrySuccess = await this.retryEmailNotification(payload, notification.recipient);
          break;

        case 'SMS':
          retrySuccess = await this.retrySmsNotification(payload, notification.recipient);
          break;

        case 'PUSH':
          retrySuccess = await this.retryPushNotification(payload, notification.recipient);
          break;

        case 'IN_APP':
          retrySuccess = await this.retryInAppNotification(payload, notification.recipient);
          break;

        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      return {
        success: retrySuccess,
        notificationId: notification.id,
        shouldRetry: !retrySuccess, // Retry if it failed again
      };
    } catch (error) {
      console.error(`Retry failed for notification ${notification.id}:`, error);

      const shouldRetry = this.analyzeFailure(error as Error).shouldRetry;

      return {
        success: false,
        notificationId: notification.id,
        error: (error as Error).message,
        shouldRetry,
      };
    }
  }

  /**
   * SYSTEMATIC channel-specific retry methods - DRY PRINCIPLE
   */
  private static async retryTelegramNotification(payload: any, recipient: string): Promise<boolean> {
    try {
      const { simplifiedTelegramService } = await import('@/lib/telegram/simplified-telegram-service');
      await simplifiedTelegramService.sendMessage({
        message: payload.message,
        channel: payload.channel || 'orders',
      });
      return true;
    } catch (error) {
      console.error('Telegram retry failed:', error);
      return false;
    }
  }

  private static async retryEmailNotification(payload: any, recipient: string): Promise<boolean> {
    try {
      const { emailService } = await import('@/lib/email/email-service');

      switch (payload.type) {
        case 'ORDER_CONFIRMATION':
          await emailService.sendOrderConfirmation(payload);
          break;
        default:
          throw new Error(`Unsupported email type: ${payload.type}`);
      }

      return true;
    } catch (error) {
      console.error('Email retry failed:', error);
      return false;
    }
  }

  private static async retrySmsNotification(payload: any, recipient: string): Promise<boolean> {
    // SMS retry implementation would go here
    console.warn('SMS retry not implemented yet');
    return false;
  }

  private static async retryPushNotification(payload: any, recipient: string): Promise<boolean> {
    // Push notification retry implementation would go here
    console.warn('Push notification retry not implemented yet');
    return false;
  }

  private static async retryInAppNotification(payload: any, recipient: string): Promise<boolean> {
    // In-app notification retry implementation would go here
    console.warn('In-app notification retry not implemented yet');
    return false;
  }

  /**
   * CENTRALIZED database operations - DRY PRINCIPLE
   */
  private static async updateRetryCount(notification: any, errorMessage: string): Promise<void> {
    const nextRetryAt = new Date(Date.now() + DLQ_CONFIG.RETRY_DELAY_HOURS * 60 * 60 * 1000);

    await prisma.failedNotification.update({
      where: { id: notification.id },
      data: {
        retryCount: notification.retryCount + 1,
        lastAttemptAt: new Date(),
        failureReason: errorMessage,
        nextRetryAt: notification.retryCount + 1 < DLQ_CONFIG.MAX_RETRY_ATTEMPTS ? nextRetryAt : null,
      },
    });
  }

  private static async markAsResolved(notificationId: string): Promise<void> {
    await prisma.failedNotification.update({
      where: { id: notificationId },
      data: {
        resolvedAt: new Date(),
        nextRetryAt: null,
      },
    });

    console.log(`✅ DLQ notification ${notificationId} successfully retried and resolved`);
  }

  private static async markAsPermanentFailure(notificationId: string): Promise<void> {
    await prisma.failedNotification.update({
      where: { id: notificationId },
      data: {
        permanentFailure: true,
        nextRetryAt: null,
      },
    });

    console.error(`💀 DLQ notification ${notificationId} marked as permanent failure`);
  }

  /**
   * SYSTEMATIC DLQ metrics collection - Single source of truth
   */
  static async getMetrics(): Promise<DLQMetrics> {
    const [
      totalFailed,
      pendingRetries,
      permanentFailures,
      successfulRetries,
    ] = await Promise.all([
      prisma.failedNotification.count(),
      prisma.failedNotification.count({
        where: {
          nextRetryAt: { not: null },
          retryCount: { lt: DLQ_CONFIG.MAX_RETRY_ATTEMPTS },
        },
      }),
      prisma.failedNotification.count({
        where: { permanentFailure: true },
      }),
      prisma.failedNotification.count({
        where: { resolvedAt: { not: null } },
      }),
    ]);

    return {
      totalFailed,
      pendingRetries,
      permanentFailures,
      successfulRetries,
      processingErrors: 0, // This would be tracked in a separate table
    };
  }

  /**
   * CENTRALIZED alerting system - Single source of truth
   */
  private static async checkAlertThreshold(): Promise<void> {
    const metrics = await this.getMetrics();

    if (metrics.pendingRetries >= DLQ_CONFIG.ALERT_THRESHOLD) {
      console.error(`🚨 DLQ Alert: ${metrics.pendingRetries} notifications pending retry (threshold: ${DLQ_CONFIG.ALERT_THRESHOLD})`);

      // SYSTEMATIC alert notification
      try {
        const { simplifiedTelegramService } = await import('@/lib/telegram/simplified-telegram-service');
        await simplifiedTelegramService.sendSystemAlertNotification(
          '🚨 Dead Letter Queue Alert',
          `High number of failed notifications: ${metrics.pendingRetries} pending retries`,
          'error'
        );
      } catch (error) {
        console.error('Failed to send DLQ alert:', error);
      }
    }
  }

  /**
   * SYSTEMATIC cleanup operations - DRY PRINCIPLE
   */
  static async cleanup(): Promise<number> {
    const cutoffDate = new Date(Date.now() - DLQ_CONFIG.CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000);

    const deletedCount = await prisma.failedNotification.deleteMany({
      where: {
        OR: [
          { resolvedAt: { lte: cutoffDate } },
          {
            permanentFailure: true,
            createdAt: { lte: cutoffDate },
          },
        ],
      },
    });

    console.log(`🧹 DLQ cleanup: removed ${deletedCount.count} old records`);
    return deletedCount.count;
  }

  /**
   * CENTRALIZED DLQ scheduler - Single source of truth
   */
  static startProcessing(): void {
    if (this.processingInterval) {
      return; // Already running
    }

    console.log(`🚀 Starting DLQ processing with ${DLQ_CONFIG.PROCESSING_INTERVAL_MS}ms interval`);

    this.processingInterval = setInterval(async () => {
      try {
        await this.processPendingRetries();
      } catch (error) {
        console.error('DLQ processing error:', error);
      }
    }, DLQ_CONFIG.PROCESSING_INTERVAL_MS);
  }

  static stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('🛑 DLQ processing stopped');
    }
  }

  /**
   * SYSTEMATIC recipient masking - Security best practice
   */
  private static maskRecipient(recipient: string): string {
    if (recipient.includes('@')) {
      // Email masking
      const [local, domain] = recipient.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }

    if (recipient.startsWith('+') || recipient.match(/^\d+$/)) {
      // Phone number masking
      return `***${recipient.slice(-4)}`;
    }

    // Generic masking
    return `${recipient.substring(0, 3)}***`;
  }
}

/**
 * EXPORT centralized configuration and types
 */
export { DLQ_CONFIG };
export type { FailedNotification, DLQMetrics, RetryResult };