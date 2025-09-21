/**
 * Monthly Backup Job Handler
 * Systematic backup creation and notification
 */

import { ChatBackupService } from '@/lib/chat/backup-service';
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

export async function handleMonthlyBackup(): Promise<JobResult> {
  const context = createJobContext('chat-monthly-backup');
  logJobStart(context);

  try {
    const config = getDataManagementConfig();

    if (!config.backupEnabled) {
      const result = createJobResult(context, true, 'Backup is disabled in configuration');
      logJobEnd(context, result);
      return result;
    }

    // Calculate previous month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    // Create backup for previous month
    const backupService = ChatBackupService.getInstance();
    const backupResult = await backupService.createMonthlyBackup(year, month);

    if (!backupResult.success) {
      const result = createJobResult(
        context,
        false,
        'Monthly backup failed',
        backupResult.error
      );
      logJobEnd(context, result);

      // Send failure notification
      try {
        const notificationService = ChatNotificationService.getInstance();
        await notificationService.notifyBackupFailed(year, month, backupResult.error || 'Unknown error');
      } catch (notificationError) {
        console.warn('Failed to send backup failure notification:', notificationError);
      }

      return result;
    }

    const result = createJobResult(
      context,
      true,
      `Monthly backup created successfully for ${year}-${month.toString().padStart(2, '0')}`,
      undefined,
      {
        year,
        month,
        filename: backupResult.filename,
        fileSize: backupResult.fileSize,
        sessionCount: backupResult.sessionCount,
      }
    );

    logJobEnd(context, result);

    // Send success notification
    try {
      const notificationService = ChatNotificationService.getInstance();
      const backup = await backupService.getBackupByFilename(backupResult.filename!);
      if (backup) {
        await notificationService.notifyBackupComplete(backup);
      }
    } catch (notificationError) {
      console.warn('Backup notification failed:', notificationError);
      // Don't fail the job if notification fails
    }

    return result;
  } catch (error) {
    const result = createJobResult(
      context,
      false,
      'Monthly backup job failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    logJobEnd(context, result);
    return result;
  }
}

