import { prisma } from '@/lib/db/prisma';
import { generateWebhookSignature } from './security';
import { CHAT_CONFIG } from './validation';
import { createChatError } from './errors';
import { getWebhookConfig } from './config';

export interface QueueItem {
  id: string;
  messageId: string;
  webhookUrl: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QueueProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly intervalMs: number = 5000, // Process queue every 5 seconds
    private readonly batchSize: number = 10
  ) {}

  start(): void {
    if (this.processingInterval) {
      console.warn('Queue processor is already running');
      return;
    }

    console.log('Starting chat webhook queue processor...');
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Queue processing error:', error);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Chat webhook queue processor stopped');
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      // Get pending items ready for processing
      const items = await this.getPendingItems();
      
      if (items.length === 0) {
        return;
      }

      console.log(`Processing ${items.length} webhook queue items`);

      // Process items in parallel with controlled concurrency
      const promises = items.map(item => this.processItem(item));
      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Queue processing batch error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async getPendingItems(): Promise<QueueItem[]> {
    const now = new Date();

    return await prisma.chatWebhookQueue.findMany({
      where: {
        OR: [
          { status: 'pending' },
          {
            status: 'failed',
            attempts: { lt: prisma.chatWebhookQueue.fields.maxAttempts },
            nextRetryAt: { lte: now }
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: this.batchSize
    }) as QueueItem[];
  }

  private async processItem(item: QueueItem): Promise<void> {
    try {
      // Mark as processing
      await this.updateItemStatus(item.id, 'processing');

      // Send webhook
      const result = await this.sendWebhook(item);

      if (result.success) {
        await this.markCompleted(item.id);
        console.log(`Webhook sent successfully for message ${item.messageId}`);
      } else {
        await this.handleFailure(item, result.error);
      }

    } catch (error) {
      console.error(`Error processing queue item ${item.id}:`, error);
      await this.handleFailure(item, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async sendWebhook(item: QueueItem): Promise<{ success: boolean; error?: string }> {
    try {
      // Get webhook configuration from database
      const webhookConfig = await getWebhookConfig();
      
      if (!webhookConfig.secret) {
        throw new Error('Webhook secret not configured in chat config');
      }

      if (!webhookConfig.apiKey) {
        throw new Error('API key not configured in chat config');
      }

      // Generate signature for security
      const signature = generateWebhookSignature(item.payload, webhookConfig.secret);

      const response = await fetch(item.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-API-Key': webhookConfig.apiKey,
          'User-Agent': 'ChatBot-Webhook/1.0'
        },
        body: JSON.stringify(item.payload),
        signal: AbortSignal.timeout(CHAT_CONFIG.WEBHOOK_LIMITS.TIMEOUT)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook send failed for ${item.messageId}:`, errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  private async updateItemStatus(
    id: string, 
    status: QueueItem['status'], 
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      lastAttemptAt: new Date(),
      updatedAt: new Date()
    };

    if (status === 'processing' || status === 'failed') {
      updateData.attempts = { increment: 1 };
    }

    if (error) {
      updateData.error = error;
    }

    await prisma.chatWebhookQueue.update({
      where: { id },
      data: updateData
    });
  }

  private async markCompleted(id: string): Promise<void> {
    await prisma.chatWebhookQueue.update({
      where: { id },
      data: {
        status: 'completed',
        updatedAt: new Date()
      }
    });
  }

  private async handleFailure(item: QueueItem, error: string): Promise<void> {
    const newAttempts = item.attempts + 1;
    const shouldRetry = newAttempts < item.maxAttempts;

    if (shouldRetry) {
      // Calculate exponential backoff: 2^attempts * base delay
      const backoffMs = Math.pow(2, newAttempts) * CHAT_CONFIG.WEBHOOK_LIMITS.RETRY_DELAY;
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.chatWebhookQueue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          attempts: newAttempts,
          error,
          nextRetryAt,
          lastAttemptAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Webhook retry scheduled for ${item.messageId} in ${backoffMs}ms (attempt ${newAttempts}/${item.maxAttempts})`);
    } else {
      // Max attempts reached, mark as permanently failed
      await prisma.chatWebhookQueue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          attempts: newAttempts,
          error: `Max attempts reached: ${error}`,
          lastAttemptAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.error(`Webhook permanently failed for ${item.messageId} after ${newAttempts} attempts: ${error}`);
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const stats = await prisma.chatWebhookQueue.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    };

    for (const stat of stats) {
      const count = stat._count.status;
      result[stat.status as keyof typeof result] = count;
      result.total += count;
    }

    return result;
  }

  async retryFailedItems(): Promise<number> {
    const result = await prisma.chatWebhookQueue.updateMany({
      where: {
        status: 'failed',
        attempts: { lt: prisma.chatWebhookQueue.fields.maxAttempts }
      },
      data: {
        status: 'pending',
        nextRetryAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`Reset ${result.count} failed webhook items for retry`);
    return result.count;
  }

  async cleanupCompletedItems(olderThanDays = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.chatWebhookQueue.deleteMany({
      where: {
        status: 'completed',
        updatedAt: { lt: cutoffDate }
      }
    });

    console.log(`Cleaned up ${result.count} completed webhook items older than ${olderThanDays} days`);
    return result.count;
  }
}

// Singleton instance
export const queueProcessor = new QueueProcessor();

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('Gracefully shutting down queue processor...');
    queueProcessor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Gracefully shutting down queue processor...');
    queueProcessor.stop();
    process.exit(0);
  });
}