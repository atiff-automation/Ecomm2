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
   * Generate secure webhook secret
   * @param length Secret length (default: 64 characters)
   * @returns Cryptographically secure random string
   */
  generateWebhookSecret(length = 64): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Generate secure API key
   * @param length API key length (default: 32 characters)
   * @returns Cryptographically secure random string
   */
  generateApiKey(length = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Validate webhook URL format and requirements
   * @param url Webhook URL to validate
   * @returns Validation result with details
   */
  validateWebhookUrl(url: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const urlObj = new URL(url);

      // HTTPS requirement for n8n Cloud security
      if (urlObj.protocol !== 'https:') {
        errors.push('Webhook URL must use HTTPS protocol for security');
      }

      // Check for common n8n Cloud domains
      const validDomains = ['.n8n.cloud', '.app.n8n.io', 'localhost', '127.0.0.1'];
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname.includes(domain) || urlObj.hostname === domain.replace('.', '')
      );

      if (!isValidDomain && !urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        warnings.push(`Non-standard domain detected: ${urlObj.hostname}. Ensure this is a valid n8n webhook endpoint.`);
      }

      // Check path structure (n8n webhooks typically have specific patterns)
      if (!urlObj.pathname.includes('/webhook')) {
        warnings.push('URL path does not contain "/webhook". Verify this is a correct n8n webhook endpoint.');
      }

    } catch (error) {
      errors.push('Invalid URL format. Please provide a valid webhook URL.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate setup instructions for n8n integration
   * @param webhookUrl The webhook URL to use
   * @param webhookSecret The webhook secret for signature verification
   * @param apiKey The API key for authentication
   * @returns Formatted setup instructions
   */
  generateSetupInstructions(webhookUrl: string, webhookSecret: string, apiKey: string): {
    instructions: string;
    curlExample: string;
    testPayload: object;
  } {
    const testPayload = {
      sessionId: `test-${Date.now()}`,
      messageId: `test-msg-${Date.now()}`,
      guestEmail: 'test@example.com',
      timestamp: new Date().toISOString(),
      message: {
        content: 'Test message from e-commerce chat integration',
        type: 'text'
      },
      userContext: {
        isAuthenticated: false,
        membershipLevel: 'guest',
        membershipTotal: null,
        userInfo: null
      },
      sessionMetadata: {
        testMode: true,
        source: 'integration-setup'
      }
    };

    const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: sha256=<calculated_signature>" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "User-Agent: E-commerce-Chat/1.0" \\
  -d '${JSON.stringify(testPayload, null, 2)}'`;

    const instructions = `
# n8n Integration Setup Instructions

## 1. Configure Webhook Endpoint
- Use this webhook URL in your n8n workflow: ${webhookUrl}
- Set the HTTP method to: POST
- Content-Type: application/json

## 2. Security Headers (Required)
Add these headers to validate requests:
- X-Webhook-Signature: sha256=<calculated_signature>
- X-API-Key: ${apiKey}
- User-Agent: E-commerce-Chat/1.0

## 3. Signature Verification
Calculate HMAC-SHA256 signature using webhook secret:
- Secret: ${webhookSecret}
- Algorithm: HMAC-SHA256
- Input: Raw JSON payload (no formatting)
- Output: Prepend "sha256=" to the hexadecimal digest

## 4. Expected Response Format
Your n8n workflow should respond with:
{
  "sessionId": "<same_as_request>",
  "response": {
    "content": "Your bot response message",
    "type": "text"
  }
}

## 5. Test Your Integration
Use the test functionality in the admin panel or send a test request manually.
    `.trim();

    return {
      instructions,
      curlExample,
      testPayload
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
        }
      };
    }
  }

  /**
   * Enhanced delivery logging methods for Phase 3
   */

  /**
   * Get detailed delivery logs with filtering and pagination
   * @param filters Filtering options
   * @returns Paginated delivery logs
   */
  async getDeliveryLogs(filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    messageId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    logs: any[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        status,
        fromDate,
        toDate,
        messageId,
        limit = 50,
        offset = 0
      } = filters;

      const whereConditions: any = {};

      if (status) {
        whereConditions.status = status;
      }

      if (messageId) {
        whereConditions.messageId = messageId;
      }

      if (fromDate || toDate) {
        whereConditions.createdAt = {};
        if (fromDate) {
          whereConditions.createdAt.gte = fromDate;
        }
        if (toDate) {
          whereConditions.createdAt.lte = toDate;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.chatWebhookQueue.findMany({
          where: whereConditions,
          select: {
            id: true,
            messageId: true,
            webhookUrl: true,
            status: true,
            attempts: true,
            maxAttempts: true,
            lastError: true,
            createdAt: true,
            updatedAt: true,
            nextRetryAt: true,
            payload: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.chatWebhookQueue.count({
          where: whereConditions
        })
      ]);

      return {
        logs,
        total,
        hasMore: offset + logs.length < total
      };

    } catch (error) {
      console.error('Failed to get delivery logs:', error);
      throw error;
    }
  }

  /**
   * Get delivery metrics for a specific time period
   * @param fromDate Start date
   * @param toDate End date
   * @returns Delivery metrics
   */
  async getDeliveryMetrics(fromDate: Date, toDate: Date): Promise<{
    successRate: number;
    avgResponseTime: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
    retryRate: number;
    errorBreakdown: { [error: string]: number };
  }> {
    try {
      // Get basic counts
      const [total, successful, failed, pending] = await Promise.all([
        prisma.chatWebhookQueue.count({
          where: {
            createdAt: { gte: fromDate, lte: toDate }
          }
        }),
        prisma.chatWebhookQueue.count({
          where: {
            status: 'completed',
            createdAt: { gte: fromDate, lte: toDate }
          }
        }),
        prisma.chatWebhookQueue.count({
          where: {
            status: 'failed',
            createdAt: { gte: fromDate, lte: toDate }
          }
        }),
        prisma.chatWebhookQueue.count({
          where: {
            status: 'pending',
            createdAt: { gte: fromDate, lte: toDate }
          }
        })
      ]);

      // Calculate retry rate
      const retriedDeliveries = await prisma.chatWebhookQueue.count({
        where: {
          attempts: { gt: 1 },
          createdAt: { gte: fromDate, lte: toDate }
        }
      });

      // Get error breakdown
      const failedDeliveries = await prisma.chatWebhookQueue.findMany({
        where: {
          status: 'failed',
          lastError: { not: null },
          createdAt: { gte: fromDate, lte: toDate }
        },
        select: { lastError: true }
      });

      const errorBreakdown: { [error: string]: number } = {};
      failedDeliveries.forEach(delivery => {
        if (delivery.lastError) {
          // Extract error type from full error message
          const errorType = delivery.lastError.split(':')[0] || 'Unknown';
          errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
        }
      });

      // Calculate average response time from completed deliveries
      const completedDeliveries = await prisma.chatWebhookQueue.findMany({
        where: {
          status: 'completed',
          createdAt: { gte: fromDate, lte: toDate }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const avgResponseTime = completedDeliveries.length > 0
        ? completedDeliveries.reduce((acc, delivery) => {
            return acc + (delivery.updatedAt.getTime() - delivery.createdAt.getTime());
          }, 0) / completedDeliveries.length
        : 0;

      const successRate = total > 0 ? (successful / total) * 100 : 0;
      const retryRate = total > 0 ? (retriedDeliveries / total) * 100 : 0;

      return {
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalDeliveries: total,
        successfulDeliveries: successful,
        failedDeliveries: failed,
        pendingDeliveries: pending,
        retryRate: Math.round(retryRate * 100) / 100,
        errorBreakdown
      };

    } catch (error) {
      console.error('Failed to get delivery metrics:', error);
      throw error;
    }
  }

  /**
   * Generate test payload for webhook testing
   * @returns Standard test payload
   */
  generateTestPayload(): WebhookPayload {
    const timestamp = new Date().toISOString();
    const testMessageId = `test_${Date.now()}`;
    const testSessionId = `test_session_${Date.now()}`;

    return {
      sessionId: testSessionId,
      messageId: testMessageId,
      guestEmail: 'test@example.com',
      timestamp,
      message: {
        content: 'This is a test message from the e-commerce chat integration system.',
        type: 'text'
      },
      userContext: {
        isAuthenticated: false,
        membershipLevel: 'guest',
        membershipTotal: null,
        userInfo: null
      },
      sessionMetadata: {
        testMode: true,
        source: 'webhook-testing',
        timestamp
      }
    };
  }

  /**
   * Validate connection to n8n webhook
   * @returns Connection validation result
   */
  async validateConnection(): Promise<{
    isValid: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
    testPayload: WebhookPayload;
  }> {
    try {
      const config = await getChatConfig();
      
      if (!config.webhookUrl) {
        return {
          isValid: false,
          responseTime: 0,
          error: 'No webhook URL configured',
          testPayload: this.generateTestPayload()
        };
      }

      const testPayload = this.generateTestPayload();
      const startTime = Date.now();

      // Simulate webhook delivery for testing
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey || '',
          'User-Agent': 'E-commerce-Chat/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      const responseTime = Date.now() - startTime;

      return {
        isValid: response.ok,
        responseTime,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        testPayload
      };

    } catch (error) {
      return {
        isValid: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Connection test failed',
        testPayload: this.generateTestPayload()
      };
    }
  }

  /**
   * Retry failed webhooks manually
   * @param queueIds Array of queue IDs to retry
   * @returns Retry results
   */
  async retryFailedWebhooks(queueIds: string[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      queueId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const queueId of queueIds) {
        try {
          const retryResult = await this.retryWebhook(queueId);
          if (retryResult) {
            successful++;
            results.push({ queueId, success: true });
          } else {
            failed++;
            results.push({ 
              queueId, 
              success: false, 
              error: 'Not eligible for retry' 
            });
          }
        } catch (error) {
          failed++;
          results.push({ 
            queueId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Retry failed' 
          });
        }
      }

      return { successful, failed, results };

    } catch (error) {
      console.error('Failed to retry webhooks:', error);
      throw error;
    }
  }
}

// Singleton instance
export const webhookService = new WebhookService();