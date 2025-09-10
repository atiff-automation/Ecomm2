import { prisma } from '@/lib/db/prisma';
import { CHAT_CONFIG } from './validation';
import { createChatError } from './errors';
import { getChatConfig, getQueueConfig } from './config';

export interface WebhookPayload {
  sessionId: string;
  messageId: string;
  userId?: string;
  guestEmail?: string;
  message: {
    content: string;
    type: string;
    timestamp: string;
  };
  userContext: {
    isAuthenticated: boolean;
    membershipLevel: 'guest' | 'member';
    membershipTotal: number | null;
    userInfo: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  sessionMetadata?: any;
}

export class WebhookService {
  /**
   * Queue a webhook for processing
   * @param payload Webhook payload data
   * @param webhookUrl Target webhook URL
   * @param messageId Associated message ID
   * @returns Queue item ID
   */
  async queueWebhook(
    payload: WebhookPayload,
    webhookUrl: string,
    messageId: string
  ): Promise<string> {
    try {
      // Get configuration from database
      const config = await getChatConfig();
      const queueConfig = await getQueueConfig();

      if (!config.webhookSecret) {
        throw createChatError('INTERNAL_ERROR', 'Webhook secret not configured');
      }

      if (!webhookUrl) {
        throw createChatError('INTERNAL_ERROR', 'Webhook URL not provided');
      }

      // Create queue item
      const queueItem = await prisma.chatWebhookQueue.create({
        data: {
          messageId,
          webhookUrl,
          payload,
          status: 'pending',
          attempts: 0,
          maxAttempts: queueConfig.maxRetries,
        }
      });

      console.log(`Webhook queued for message ${messageId} with queue ID ${queueItem.id}`);
      return queueItem.id;

    } catch (error) {
      console.error(`Failed to queue webhook for message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get webhook queue item by ID
   * @param queueId Queue item ID
   * @returns Queue item or null if not found
   */
  async getQueueItem(queueId: string) {
    try {
      return await prisma.chatWebhookQueue.findUnique({
        where: { id: queueId }
      });
    } catch (error) {
      console.error(`Failed to get queue item ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Get webhook queue items by message ID
   * @param messageId Message ID
   * @returns Array of queue items
   */
  async getQueueItemsByMessage(messageId: string) {
    try {
      return await prisma.chatWebhookQueue.findMany({
        where: { messageId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error(`Failed to get queue items for message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel pending webhook
   * @param queueId Queue item ID
   * @returns true if cancelled, false if not found or already processed
   */
  async cancelWebhook(queueId: string): Promise<boolean> {
    try {
      const result = await prisma.chatWebhookQueue.updateMany({
        where: {
          id: queueId,
          status: 'pending'
        },
        data: {
          status: 'failed',
          error: 'Cancelled by user',
          updatedAt: new Date()
        }
      });

      const cancelled = result.count > 0;
      if (cancelled) {
        console.log(`Webhook cancelled for queue ID ${queueId}`);
      }

      return cancelled;
    } catch (error) {
      console.error(`Failed to cancel webhook ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed webhook immediately
   * @param queueId Queue item ID
   * @returns true if retry scheduled, false if not eligible
   */
  async retryWebhook(queueId: string): Promise<boolean> {
    try {
      const queueItem = await prisma.chatWebhookQueue.findUnique({
        where: { id: queueId }
      });

      if (!queueItem) {
        return false;
      }

      if (queueItem.status !== 'failed') {
        return false;
      }

      if (queueItem.attempts >= queueItem.maxAttempts) {
        return false;
      }

      // Reset to pending for immediate retry
      await prisma.chatWebhookQueue.update({
        where: { id: queueId },
        data: {
          status: 'pending',
          nextRetryAt: new Date(),
          error: null,
          updatedAt: new Date()
        }
      });

      console.log(`Webhook retry scheduled for queue ID ${queueId}`);
      return true;
    } catch (error) {
      console.error(`Failed to retry webhook ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * Get webhook delivery status
   * @param messageId Message ID
   * @returns Delivery status information
   */
  async getDeliveryStatus(messageId: string): Promise<{
    messageId: string;
    status: 'pending' | 'delivered' | 'failed' | 'processing';
    attempts: number;
    maxAttempts: number;
    lastAttemptAt?: Date;
    nextRetryAt?: Date;
    error?: string;
    completedAt?: Date;
  }> {
    try {
      const queueItem = await prisma.chatWebhookQueue.findFirst({
        where: { messageId },
        orderBy: { createdAt: 'desc' }
      });

      if (!queueItem) {
        return {
          messageId,
          status: 'failed',
          attempts: 0,
          maxAttempts: CHAT_CONFIG.WEBHOOK_LIMITS.MAX_ATTEMPTS,
          error: 'No webhook queue item found'
        };
      }

      return {
        messageId,
        status: queueItem.status === 'completed' ? 'delivered' : queueItem.status,
        attempts: queueItem.attempts,
        maxAttempts: queueItem.maxAttempts,
        lastAttemptAt: queueItem.lastAttemptAt || undefined,
        nextRetryAt: queueItem.nextRetryAt || undefined,
        error: queueItem.error || undefined,
        completedAt: queueItem.status === 'completed' ? queueItem.updatedAt : undefined
      };
    } catch (error) {
      console.error(`Failed to get delivery status for message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Build webhook payload from message data
   * @param message Message data
   * @param session Session data with user information
   * @returns Formatted webhook payload
   */
  buildWebhookPayload(message: any, session: any): WebhookPayload {
    return {
      sessionId: message.sessionId,
      messageId: message.id,
      userId: session.userId || undefined,
      guestEmail: session.guestEmail || undefined,
      message: {
        content: message.content,
        type: message.messageType,
        timestamp: message.createdAt.toISOString(),
      },
      userContext: {
        isAuthenticated: !!session.userId,
        membershipLevel: session.user?.isMember ? 'member' : 'guest',
        membershipTotal: session.user?.membershipTotal ? Number(session.user.membershipTotal) : null,
        userInfo: session.user ? {
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
        } : null,
      },
      sessionMetadata: session.metadata,
    };
  }

  /**
   * Health check for webhook service
   * @returns Service health status
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    queueStats: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      total: number;
    };
    configStatus: {
      webhookSecret: boolean;
      n8nWebhookUrl: boolean;
    };
  }> {
    try {
      // Check queue statistics
      const queueStats = await prisma.chatWebhookQueue.groupBy({
        by: ['status'],
        _count: { status: true }
      });

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      for (const stat of queueStats) {
        const count = stat._count.status;
        stats[stat.status as keyof typeof stats] = count;
        stats.total += count;
      }

      // Check configuration from database
      const config = await getChatConfig();
      const configStatus = {
        webhookSecret: !!config.webhookSecret,
        n8nWebhookUrl: !!config.webhookUrl,
        isActive: config.isActive,
        isVerified: config.verified,
      };

      // Determine overall health
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (!configStatus.webhookSecret || !configStatus.n8nWebhookUrl || !configStatus.isActive) {
        status = 'unhealthy';
      } else if (!configStatus.isVerified) {
        status = 'degraded';
      } else if (stats.failed > stats.completed && stats.total > 0) {
        status = 'degraded';
      }

      return {
        status,
        queueStats: stats,
        configStatus
      };
    } catch (error) {
      console.error('Webhook service health check failed:', error);
      return {
        status: 'unhealthy',
        queueStats: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          total: 0
        },
        configStatus: {
          webhookSecret: false,
          n8nWebhookUrl: false,
          isActive: false,
          isVerified: false,
        }
      };
    }
  }
}

// Singleton instance
export const webhookService = new WebhookService();