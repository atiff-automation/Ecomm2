/**
 * Centralized Audit Logging with Error Handling and Queueing
 * Ensures audit logs are never silently lost
 */

import { prisma } from '@/lib/db/prisma';

export interface AuditLogData {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT';
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Queue for failed audit logs
const auditQueue: AuditLogData[] = [];
let isProcessingQueue = false;
let queueProcessInterval: NodeJS.Timeout | null = null;

/**
 * Log audit event with proper error handling and queueing
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    // CRITICAL: Audit log failure is a system issue
    console.error('🚨 CRITICAL: Audit log failed:', error);

    // Log to external monitoring if available
    if (process.env.SENTRY_DSN && typeof window === 'undefined') {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            severity: 'critical',
            type: 'audit_log_failure',
          },
          extra: data,
        });
      } catch (sentryError) {
        console.error('Failed to send audit error to Sentry:', sentryError);
      }
    }

    // Queue for retry
    auditQueue.push(data);

    // Start queue processing if not already running
    if (!isProcessingQueue) {
      processAuditQueue();
    }
  }
}

/**
 * Process queued audit logs with exponential backoff
 */
async function processAuditQueue(): Promise<void> {
  if (isProcessingQueue || auditQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  console.log(`📝 Processing audit log queue (${auditQueue.length} items)`);

  let successCount = 0;
  let failCount = 0;

  while (auditQueue.length > 0) {
    const item = auditQueue[0];

    try {
      await prisma.auditLog.create({ data: item });
      auditQueue.shift(); // Remove successful item
      successCount++;
    } catch (error) {
      console.error('Failed to process queued audit log:', error);
      failCount++;

      // If we've failed too many times, stop and try again later
      if (failCount >= 3) {
        console.error(
          `⚠️ Audit queue processing paused after ${failCount} failures`
        );
        break;
      }

      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  isProcessingQueue = false;

  if (successCount > 0) {
    console.log(`✅ Successfully processed ${successCount} audit logs`);
  }

  // Schedule next queue processing if items remain
  if (auditQueue.length > 0) {
    if (!queueProcessInterval) {
      queueProcessInterval = setInterval(() => {
        if (auditQueue.length > 0) {
          processAuditQueue();
        } else {
          // Clear interval if queue is empty
          if (queueProcessInterval) {
            clearInterval(queueProcessInterval);
            queueProcessInterval = null;
          }
        }
      }, 60000); // Retry every minute
    }
  }
}

/**
 * Get audit queue status for monitoring
 */
export function getAuditQueueStatus() {
  return {
    queueLength: auditQueue.length,
    isProcessing: isProcessingQueue,
    healthy: auditQueue.length < 100, // Alert if queue grows too large
  };
}

/**
 * Force flush audit queue (useful for graceful shutdown)
 */
export async function flushAuditQueue(): Promise<void> {
  if (auditQueue.length === 0) {
    return;
  }

  console.log(`🔄 Flushing audit queue (${auditQueue.length} items)...`);
  await processAuditQueue();
}

/**
 * Helper function to extract IP address from request
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Helper function to extract user agent from request
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown';
}
