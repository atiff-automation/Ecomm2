/**
 * Webhook Processing Service
 * Handles webhook retry logic and failure recovery
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 2.6
 */

import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

export interface WebhookQueueItem {
  id: string;
  trackingNumber: string;
  eventCode: string;
  eventName: string;
  eventTime: string;
  location?: string;
  shipmentId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  lastError?: string;
}

export class WebhookProcessor {
  private isProcessing = false;
  private readonly maxRetries = 3;
  private readonly retryDelays = [5000, 30000, 300000]; // 5s, 30s, 5min

  constructor() {
    // Start processing queue if in production
    if (process.env.NODE_ENV === 'production') {
      this.startProcessing();
    }
  }

  /**
   * Queue webhook for processing with retry logic
   */
  async queueWebhook(payload: {
    tracking_number: string;
    event_code: string;
    event_name: string;
    event_time: string;
    location?: string;
    shipment_id: string;
    courier_remarks?: string;
  }): Promise<void> {
    try {
      console.log('📥 Queuing webhook for processing:', {
        trackingNumber: payload.tracking_number,
        eventCode: payload.event_code,
      });

      // Create webhook queue record
      await prisma.webhookQueue.create({
        data: {
          trackingNumber: payload.tracking_number,
          eventCode: payload.event_code,
          eventName: payload.event_name,
          eventTime: new Date(payload.event_time),
          location: payload.location,
          shipmentId: payload.shipment_id,
          payload: payload as any,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: this.maxRetries,
          nextRetryAt: new Date(),
          createdAt: new Date(),
        },
      });

      console.log('✅ Webhook queued successfully');
    } catch (error) {
      console.error('❌ Failed to queue webhook:', error);
      throw error;
    }
  }

  /**
   * Process webhook queue items
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      console.log('🔄 Processing webhook queue...');

      // Get pending webhooks ready for processing
      const pendingWebhooks = await prisma.webhookQueue.findMany({
        where: {
          status: { in: ['PENDING', 'RETRY'] },
          nextRetryAt: { lte: new Date() },
          retryCount: { lt: this.maxRetries },
        },
        orderBy: { createdAt: 'asc' },
        take: 10, // Process up to 10 at a time
      });

      if (pendingWebhooks.length === 0) {
        return;
      }

      console.log(`📦 Processing ${pendingWebhooks.length} webhook(s)`);

      for (const webhook of pendingWebhooks) {
        await this.processWebhookItem(webhook);

        // Add small delay between processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual webhook item
   */
  private async processWebhookItem(webhook: any): Promise<void> {
    try {
      console.log('🔄 Processing webhook item:', {
        id: webhook.id,
        trackingNumber: webhook.trackingNumber,
        retryCount: webhook.retryCount,
      });

      // Find shipment
      const shipment = await prisma.shipment.findUnique({
        where: { trackingNumber: webhook.trackingNumber },
        include: {
          order: {
            select: { id: true, orderNumber: true, userId: true },
          },
        },
      });

      if (!shipment) {
        await this.markWebhookFailed(webhook.id, 'Shipment not found');
        return;
      }

      // Map event code to status
      const newStatus = this.mapEventCodeToStatus(webhook.eventCode);
      const statusChanged = newStatus && newStatus !== shipment.status;

      // Process webhook in transaction
      await prisma.$transaction(async tx => {
        // Create tracking event
        await tx.shipmentTracking.create({
          data: {
            shipmentId: shipment.id,
            eventCode: webhook.eventCode,
            eventName: webhook.eventName,
            description: webhook.eventName,
            location: webhook.location || 'In Transit',
            eventTime: webhook.eventTime,
            source: 'EASYPARCEL',
          },
        });

        // Update shipment status if changed
        if (statusChanged) {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: {
              status: newStatus,
              statusDescription: webhook.eventName,
              lastTrackedAt: new Date(),
            },
          });

          // Update order status if delivered
          if (['DELIVERED', 'COMPLETED'].includes(newStatus)) {
            await tx.order.update({
              where: { id: shipment.order.id },
              data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
              },
            });
          }
        }

        // Mark webhook as processed
        await tx.webhookQueue.update({
          where: { id: webhook.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            lastError: null,
          },
        });
      });

      console.log('✅ Webhook processed successfully:', webhook.id);
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      await this.retryWebhook(webhook.id, error.message);
    }
  }

  /**
   * Retry webhook with exponential backoff
   */
  private async retryWebhook(webhookId: string, error: string): Promise<void> {
    try {
      const webhook = await prisma.webhookQueue.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        return;
      }

      const newRetryCount = webhook.retryCount + 1;

      if (newRetryCount >= this.maxRetries) {
        // Max retries reached, mark as failed
        await this.markWebhookFailed(webhookId, error);
        return;
      }

      // Calculate next retry time with exponential backoff
      const delay =
        this.retryDelays[
          Math.min(newRetryCount - 1, this.retryDelays.length - 1)
        ];
      const nextRetryAt = new Date(Date.now() + delay);

      await prisma.webhookQueue.update({
        where: { id: webhookId },
        data: {
          status: 'RETRY',
          retryCount: newRetryCount,
          nextRetryAt,
          lastError: error,
          updatedAt: new Date(),
        },
      });

      console.log(
        `🔄 Webhook queued for retry (${newRetryCount}/${this.maxRetries}):`,
        {
          webhookId,
          nextRetryAt,
          error: error.substring(0, 100),
        }
      );
    } catch (retryError) {
      console.error('❌ Failed to schedule webhook retry:', retryError);
    }
  }

  /**
   * Mark webhook as permanently failed
   */
  private async markWebhookFailed(
    webhookId: string,
    error: string
  ): Promise<void> {
    try {
      await prisma.webhookQueue.update({
        where: { id: webhookId },
        data: {
          status: 'FAILED',
          lastError: error,
          failedAt: new Date(),
        },
      });

      console.log('❌ Webhook marked as failed:', {
        webhookId,
        error: error.substring(0, 100),
      });

      // TODO: Send alert to admins about failed webhook
    } catch (updateError) {
      console.error('❌ Failed to mark webhook as failed:', updateError);
    }
  }

  /**
   * Map EasyParcel event codes to our shipment status
   */
  private mapEventCodeToStatus(eventCode: string): string | null {
    const statusMapping: Record<string, string> = {
      BOOKED: 'BOOKED',
      LABEL_GENERATED: 'LABEL_GENERATED',
      PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
      PICKED_UP: 'PICKED_UP',
      IN_TRANSIT: 'IN_TRANSIT',
      ARRIVED_AT_HUB: 'IN_TRANSIT',
      DEPARTED_FROM_HUB: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERY_ATTEMPTED: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      COMPLETED: 'DELIVERED',
      CANCELLED: 'CANCELLED',
      FAILED: 'FAILED',
      RETURNED: 'FAILED',
    };

    return statusMapping[eventCode] || null;
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    console.log('🚀 Starting webhook queue processor');

    // Process queue every 30 seconds
    setInterval(() => {
      this.processQueue().catch(error => {
        console.error('❌ Background queue processing error:', error);
      });
    }, 30000);

    // Process immediately on startup
    setTimeout(() => {
      this.processQueue().catch(error => {
        console.error('❌ Initial queue processing error:', error);
      });
    }, 5000);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    processed: number;
    oldestPending?: Date;
  }> {
    const [pending, processing, failed, processed, oldestPending] =
      await Promise.all([
        prisma.webhookQueue.count({ where: { status: 'PENDING' } }),
        prisma.webhookQueue.count({ where: { status: 'RETRY' } }),
        prisma.webhookQueue.count({ where: { status: 'FAILED' } }),
        prisma.webhookQueue.count({ where: { status: 'PROCESSED' } }),
        prisma.webhookQueue.findFirst({
          where: { status: { in: ['PENDING', 'RETRY'] } },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      pending,
      processing,
      failed,
      processed,
      oldestPending: oldestPending?.createdAt,
    };
  }

  /**
   * Cleanup old processed webhooks
   */
  async cleanupOldWebhooks(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );

    const result = await prisma.webhookQueue.deleteMany({
      where: {
        status: 'PROCESSED',
        processedAt: { lt: cutoffDate },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old webhook records`);
    return result.count;
  }
}

// Export singleton instance
export const webhookProcessor = new WebhookProcessor();
