/**
 * Daily Cleanup Job Handler
 * Systematic data deletion following retention policy
 */

import { ChatCleanupService } from '@/lib/chat/cleanup-service';
import { getDataManagementConfig } from '@/lib/chat/data-management';
import { ChatNotificationService } from '@/lib/notifications/chat-notifications';
import {
  JobContext,
  JobResult,
  createJobContext,
  createJobResult,
  logJobStart,
  logJobEnd
} from '../chat-data-management';

export async function handleDailyCleanup(): Promise<JobResult> {
  const context = createJobContext('chat-daily-cleanup');
  logJobStart(context);

  try {
    const config = getDataManagementConfig();

    if (!config.autoDeleteEnabled) {
      const result = createJobResult(context, true, 'Auto delete is disabled in configuration');
      logJobEnd(context, result);
      return result;
    }

    // Perform cleanup
    const cleanupService = ChatCleanupService.getInstance();
    const cleanupResult = await cleanupService.performScheduledCleanup();

    if (!cleanupResult.success) {
      const result = createJobResult(
        context,
        false,
        'Daily cleanup failed',
        cleanupResult.error
      );
      logJobEnd(context, result);
      return result;
    }

    const result = createJobResult(
      context,
      true,
      `Daily cleanup completed - Deleted ${cleanupResult.deletedSessionsCount} sessions and ${cleanupResult.deletedMessagesCount} messages`,
      undefined,
      {
        deletedSessionsCount: cleanupResult.deletedSessionsCount,
        deletedMessagesCount: cleanupResult.deletedMessagesCount,
        retentionDays: config.retentionDays,
        gracePeriodDays: config.gracePeriodDays,
      }
    );

    logJobEnd(context, result);

    // Send notifications
    try {
      const notificationService = ChatNotificationService.getInstance();
      await notificationService.notifyDataDeletion(cleanupResult);
    } catch (notificationError) {
      console.warn('Cleanup notification failed:', notificationError);
      // Don't fail the job if notification fails
    }

    return result;
  } catch (error) {
    const result = createJobResult(
      context,
      false,
      'Daily cleanup job failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    logJobEnd(context, result);
    return result;
  }
}

