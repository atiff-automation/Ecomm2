import { prisma } from '@/lib/db/prisma';
import { generateWebhookSignature } from './security';
import { CHAT_CONFIG } from './validation';
import { createChatError } from './errors';
import { getWebhookConfig, getChatConfig } from './config';

export interface QueueItem {
  id: string;
  messageId: string;
  webhookUrl: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
}

export interface ErrorClassification {
  type: 'network' | 'timeout' | 'auth' | 'validation' | 'server' | 'rate_limit' | 'unknown';
  isRetriable: boolean;
  backoffMultiplier: number;
  priority: number;
}

export class QueueProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Circuit breaker properties
  private circuitBreaker: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: null,
    nextAttemptTime: null
  };
  
  // Configuration constants (centralized, no hardcoding per CLAUDE.md)
  private readonly CIRCUIT_BREAKER_CONFIG = {
    FAILURE_THRESHOLD: 5,           // Open circuit after 5 consecutive failures
    TIMEOUT_MS: 30000,             // 30 seconds before half-open
    SUCCESS_THRESHOLD: 3           // Close circuit after 3 consecutive successes
  };
  
  private readonly RETRY_CONFIG = {
    BASE_DELAY_MS: 1000,           // Base retry delay
    MAX_DELAY_MS: 300000,          // Maximum retry delay (5 minutes)
    JITTER_FACTOR: 0.1             // Add randomization to prevent thundering herd
  };

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
        this.recordCircuitBreakerFailure();
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

    // Check circuit breaker state
    if (!this.isCircuitBreakerClosed()) {
      console.log(`Circuit breaker is ${this.circuitBreaker.state}, skipping queue processing`);
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending items ready for processing
      const items = await this.getPendingItems();
      
      if (items.length === 0) {
        return;
      }

      console.log(`Processing ${items.length} webhook queue items (Circuit breaker: ${this.circuitBreaker.state})`);

      // Process items in parallel with controlled concurrency
      const promises = items.map(item => this.processItem(item));
      const results = await Promise.allSettled(promises);

      // Analyze results for circuit breaker
      const failures = results.filter(result => result.status === 'rejected').length;
      const successes = results.length - failures;

      if (failures > successes * 0.5) {
        // More than 50% failure rate
        this.recordCircuitBreakerFailure();
      } else if (successes > 0) {
        this.recordCircuitBreakerSuccess();
      }

    } catch (error) {
      console.error('Queue processing batch error:', error);
      this.recordCircuitBreakerFailure();
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
    const errorClassification = this.classifyError(error);
    
    // Check if error is retriable based on classification
    const shouldRetry = newAttempts < item.maxAttempts && errorClassification.isRetriable;

    if (shouldRetry) {
      // Calculate intelligent backoff based on error type
      const backoffMs = this.calculateBackoffDelay(newAttempts, errorClassification);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.chatWebhookQueue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          attempts: newAttempts,
          lastError: error,
          nextRetryAt,
          updatedAt: new Date()
        }
      });

      console.log(`Webhook retry scheduled for ${item.messageId} in ${backoffMs}ms (attempt ${newAttempts}/${item.maxAttempts}) [${errorClassification.type}]`);
    } else {
      // Max attempts reached or non-retriable error
      const finalError = errorClassification.isRetriable 
        ? `Max attempts reached: ${error}`
        : `Non-retriable error: ${error}`;

      await prisma.chatWebhookQueue.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          attempts: newAttempts,
          lastError: finalError,
          updatedAt: new Date()
        }
      });

      console.error(`Webhook permanently failed for ${item.messageId} after ${newAttempts} attempts: ${error} [${errorClassification.type}]`);
      
      // Update health status if critical error
      if (errorClassification.type === 'auth' || errorClassification.type === 'validation') {
        await this.updateSystemHealthStatus('UNHEALTHY', error);
      }
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

  /**
   * Enhanced error handling and reliability methods for Phase 4
   */

  /**
   * Classify errors for intelligent retry strategies
   */
  private classifyError(error: string): ErrorClassification {
    const errorLower = error.toLowerCase();

    // Network errors - highly retriable
    if (errorLower.includes('network') || errorLower.includes('econnreset') || 
        errorLower.includes('enotfound') || errorLower.includes('etimedout')) {
      return {
        type: 'network',
        isRetriable: true,
        backoffMultiplier: 2.0,
        priority: 1
      };
    }

    // Timeout errors - moderately retriable
    if (errorLower.includes('timeout') || errorLower.includes('aborted')) {
      return {
        type: 'timeout',
        isRetriable: true,
        backoffMultiplier: 1.5,
        priority: 2
      };
    }

    // Rate limiting - highly retriable with longer delay
    if (errorLower.includes('429') || errorLower.includes('rate limit') || 
        errorLower.includes('too many requests')) {
      return {
        type: 'rate_limit',
        isRetriable: true,
        backoffMultiplier: 3.0,
        priority: 3
      };
    }

    // Server errors (5xx) - moderately retriable
    if (errorLower.includes('500') || errorLower.includes('502') || 
        errorLower.includes('503') || errorLower.includes('504')) {
      return {
        type: 'server',
        isRetriable: true,
        backoffMultiplier: 2.5,
        priority: 2
      };
    }

    // Authentication errors - not retriable
    if (errorLower.includes('401') || errorLower.includes('403') || 
        errorLower.includes('unauthorized') || errorLower.includes('forbidden')) {
      return {
        type: 'auth',
        isRetriable: false,
        backoffMultiplier: 1.0,
        priority: 5
      };
    }

    // Validation errors - not retriable
    if (errorLower.includes('400') || errorLower.includes('invalid') || 
        errorLower.includes('malformed') || errorLower.includes('bad request')) {
      return {
        type: 'validation',
        isRetriable: false,
        backoffMultiplier: 1.0,
        priority: 5
      };
    }

    // Unknown errors - retriable with conservative approach
    return {
      type: 'unknown',
      isRetriable: true,
      backoffMultiplier: 1.8,
      priority: 4
    };
  }

  /**
   * Calculate intelligent backoff delay with jitter
   */
  private calculateBackoffDelay(attempts: number, errorClassification: ErrorClassification): number {
    // Base exponential backoff
    const exponentialDelay = Math.pow(2, attempts - 1) * this.RETRY_CONFIG.BASE_DELAY_MS;
    
    // Apply error-specific multiplier
    const adjustedDelay = exponentialDelay * errorClassification.backoffMultiplier;
    
    // Cap at maximum delay
    const cappedDelay = Math.min(adjustedDelay, this.RETRY_CONFIG.MAX_DELAY_MS);
    
    // Add jitter to prevent thundering herd (±10%)
    const jitter = cappedDelay * this.RETRY_CONFIG.JITTER_FACTOR * (Math.random() - 0.5) * 2;
    
    return Math.max(1000, cappedDelay + jitter); // Minimum 1 second delay
  }

  /**
   * Circuit breaker state management
   */
  private isCircuitBreakerClosed(): boolean {
    const now = new Date();
    
    switch (this.circuitBreaker.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        // Check if timeout period has passed
        if (this.circuitBreaker.nextAttemptTime && now >= this.circuitBreaker.nextAttemptTime) {
          this.circuitBreaker.state = 'HALF_OPEN';
          console.log('Circuit breaker transitioning to HALF_OPEN state');
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return false;
    }
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = new Date();

    if (this.circuitBreaker.state === 'CLOSED' && 
        this.circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) {
      
      // Open the circuit
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttemptTime = new Date(
        Date.now() + this.CIRCUIT_BREAKER_CONFIG.TIMEOUT_MS
      );
      
      console.warn(`Circuit breaker OPENED after ${this.circuitBreaker.failureCount} failures. Next attempt at ${this.circuitBreaker.nextAttemptTime}`);
      
      // Update system health status
      this.updateSystemHealthStatus('DEGRADED', 'Circuit breaker opened due to failures').catch(console.error);
    }
    
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      // Failed in half-open state, go back to open
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttemptTime = new Date(
        Date.now() + this.CIRCUIT_BREAKER_CONFIG.TIMEOUT_MS
      );
      
      console.warn('Circuit breaker returned to OPEN state after failure in HALF_OPEN');
    }
  }

  private recordCircuitBreakerSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      // Success in half-open state, close the circuit
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.lastFailureTime = null;
      this.circuitBreaker.nextAttemptTime = null;
      
      console.log('Circuit breaker CLOSED after successful operation in HALF_OPEN state');
      
      // Update system health status
      this.updateSystemHealthStatus('HEALTHY', 'Circuit breaker closed - system recovered').catch(console.error);
    } else if (this.circuitBreaker.state === 'CLOSED') {
      // Reset failure count on success
      this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
    }
  }

  /**
   * Automatic health recovery system
   */
  private async updateSystemHealthStatus(status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY', reason: string): Promise<void> {
    try {
      await prisma.chatConfig.updateMany({
        where: { isActive: true },
        data: {
          healthStatus: status,
          lastHealthCheck: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`System health status updated to ${status}: ${reason}`);
    } catch (error) {
      console.error('Failed to update system health status:', error);
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): CircuitBreakerState & { 
    config: typeof this.CIRCUIT_BREAKER_CONFIG;
    isHealthy: boolean;
  } {
    return {
      ...this.circuitBreaker,
      config: this.CIRCUIT_BREAKER_CONFIG,
      isHealthy: this.circuitBreaker.state === 'CLOSED' && this.circuitBreaker.failureCount < 3
    };
  }

  /**
   * Manual circuit breaker reset (for admin intervention)
   */
  async resetCircuitBreaker(): Promise<void> {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = null;
    this.circuitBreaker.nextAttemptTime = null;

    console.log('Circuit breaker manually reset to CLOSED state');
    
    // Update system health
    await this.updateSystemHealthStatus('HEALTHY', 'Circuit breaker manually reset');
  }

  /**
   * Enhanced queue health monitoring
   */
  async performHealthCheck(): Promise<{
    isHealthy: boolean;
    status: string;
    metrics: {
      queueSize: number;
      pendingItems: number;
      failedItems: number;
      circuitBreakerState: string;
      avgProcessingTime: number;
    };
    issues: string[];
  }> {
    try {
      const stats = await this.getQueueStats();
      const circuitBreakerStatus = this.getCircuitBreakerStatus();
      
      // Calculate average processing time for recent completed items
      const recentCompleted = await prisma.chatWebhookQueue.findMany({
        where: {
          status: 'completed',
          updatedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        select: {
          createdAt: true,
          updatedAt: true
        },
        take: 100
      });

      const avgProcessingTime = recentCompleted.length > 0
        ? recentCompleted.reduce((acc, item) => 
            acc + (item.updatedAt.getTime() - item.createdAt.getTime()), 0
          ) / recentCompleted.length
        : 0;

      const issues: string[] = [];
      let isHealthy = true;
      let status = 'HEALTHY';

      // Check various health indicators
      if (circuitBreakerStatus.state !== 'CLOSED') {
        issues.push(`Circuit breaker is ${circuitBreakerStatus.state}`);
        isHealthy = false;
        status = 'DEGRADED';
      }

      if (stats.pending > 100) {
        issues.push(`High queue size: ${stats.pending} pending items`);
        isHealthy = false;
        status = status === 'HEALTHY' ? 'DEGRADED' : status;
      }

      if (stats.failed > stats.completed * 0.1) {
        issues.push(`High failure rate: ${stats.failed} failed vs ${stats.completed} completed`);
        isHealthy = false;
        status = 'UNHEALTHY';
      }

      // Update system health in database
      await this.updateSystemHealthStatus(status as any, issues.join('; ') || 'System healthy');

      return {
        isHealthy,
        status,
        metrics: {
          queueSize: stats.total,
          pendingItems: stats.pending,
          failedItems: stats.failed,
          circuitBreakerState: circuitBreakerStatus.state,
          avgProcessingTime: Math.round(avgProcessingTime)
        },
        issues
      };

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        isHealthy: false,
        status: 'UNHEALTHY',
        metrics: {
          queueSize: 0,
          pendingItems: 0,
          failedItems: 0,
          circuitBreakerState: 'UNKNOWN',
          avgProcessingTime: 0
        },
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
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