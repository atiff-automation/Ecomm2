/**
 * Chat Data Management Notifications
 * Following existing Telegram notification pattern
 */

import { ChatBackup } from '@prisma/client';
import { DeletionResult } from '@/lib/chat/data-management';

export interface NotificationConfig {
  telegramEnabled: boolean;
  emailEnabled: boolean;
  notificationEmail?: string;
}

export interface BackupNotification {
  type: 'backup_completed' | 'backup_failed';
  period: string;
  filename?: string;
  sessionCount?: number;
  fileSize?: number;
  error?: string;
  timestamp: string;
}

export interface CleanupNotification {
  type: 'cleanup_completed' | 'cleanup_failed';
  deletedSessionsCount: number;
  deletedMessagesCount: number;
  error?: string;
  timestamp: string;
}

export interface SystemNotification {
  type: 'system_health' | 'storage_warning' | 'job_failure';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export class ChatNotificationService {
  private static instance: ChatNotificationService;

  private constructor() {}

  public static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }

  async notifyBackupComplete(backup: ChatBackup): Promise<void> {
    const notification: BackupNotification = {
      type: 'backup_completed',
      period: `${backup.year}-${backup.month.toString().padStart(2, '0')}`,
      filename: backup.filename,
      sessionCount: backup.sessionCount,
      fileSize: Number(backup.fileSize),
      timestamp: new Date().toISOString(),
    };

    await this.sendNotification('📦 Chat Backup Completed', this.formatBackupMessage(notification));
  }

  async notifyBackupFailed(year: number, month: number, error: string): Promise<void> {
    const notification: BackupNotification = {
      type: 'backup_failed',
      period: `${year}-${month.toString().padStart(2, '0')}`,
      error,
      timestamp: new Date().toISOString(),
    };

    await this.sendNotification('❌ Chat Backup Failed', this.formatBackupMessage(notification));
  }

  async notifyDataDeletion(deletionResult: DeletionResult): Promise<void> {
    if (!deletionResult.success) {
      const notification: CleanupNotification = {
        type: 'cleanup_failed',
        deletedSessionsCount: 0,
        deletedMessagesCount: 0,
        error: deletionResult.error,
        timestamp: new Date().toISOString(),
      };

      await this.sendNotification('❌ Data Cleanup Failed', this.formatCleanupMessage(notification));
      return;
    }

    // Only notify for significant cleanup (configurable thresholds)
    const shouldNotify = this.shouldNotifyCleanup(deletionResult);
    if (!shouldNotify) {
      return;
    }

    const notification: CleanupNotification = {
      type: 'cleanup_completed',
      deletedSessionsCount: deletionResult.deletedSessionsCount,
      deletedMessagesCount: deletionResult.deletedMessagesCount,
      timestamp: new Date().toISOString(),
    };

    await this.sendNotification('🧹 Data Cleanup Completed', this.formatCleanupMessage(notification));
  }

  async notifySystemHealth(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const notification: SystemNotification = {
      type: 'system_health',
      message,
      severity,
      timestamp: new Date().toISOString(),
    };

    const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    await this.sendNotification(`${emoji} Chat System Alert`, this.formatSystemMessage(notification));
  }

  async notifyStorageWarning(usagePercent: number, threshold: number): Promise<void> {
    const notification: SystemNotification = {
      type: 'storage_warning',
      message: `Storage usage at ${usagePercent}% (threshold: ${threshold}%)`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
    };

    await this.sendNotification('💾 Storage Warning', this.formatSystemMessage(notification));
  }

  async notifyJobFailure(jobName: string, error: string): Promise<void> {
    const notification: SystemNotification = {
      type: 'job_failure',
      message: `Job "${jobName}" failed: ${error}`,
      severity: 'error',
      timestamp: new Date().toISOString(),
    };

    await this.sendNotification('⚙️ Job Failure', this.formatSystemMessage(notification));
  }

  private async sendNotification(title: string, message: string): Promise<void> {
    try {
      // Use existing Telegram notification system
      await this.sendTelegramNotification(title, message);

      // Log the notification for debugging
      console.log(`[Chat Notification] ${title}:\n${message}`);
    } catch (error) {
      console.error('Failed to send chat notification:', error);
      // Don't throw - notifications shouldn't break the main functionality
    }
  }

  private async sendTelegramNotification(title: string, message: string): Promise<void> {
    // Check if Telegram notifications are configured
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ORDERS_CHAT_ID;

    if (!telegramToken || !chatId) {
      console.warn('Telegram notifications not configured for chat data management');
      return;
    }

    try {
      const fullMessage = `*${title}*\n\n${message}`;

      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: fullMessage,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
      throw error;
    }
  }

  private formatBackupMessage(notification: BackupNotification): string {
    if (notification.type === 'backup_failed') {
      return `❌ *Backup Failed*
📅 Period: ${notification.period}
⚠️ Error: ${notification.error}
🕐 Time: ${new Date(notification.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`;
    }

    return `✅ *Backup Completed Successfully*
📅 Period: ${notification.period}
📁 File: ${notification.filename}
📊 Sessions: ${notification.sessionCount?.toLocaleString()}
💾 Size: ${this.formatFileSize(notification.fileSize || 0)}
🕐 Time: ${new Date(notification.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`;
  }

  private formatCleanupMessage(notification: CleanupNotification): string {
    if (notification.type === 'cleanup_failed') {
      return `❌ *Cleanup Failed*
⚠️ Error: ${notification.error}
🕐 Time: ${new Date(notification.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`;
    }

    return `✅ *Data Cleanup Completed*
🗑️ Sessions Deleted: ${notification.deletedSessionsCount.toLocaleString()}
💬 Messages Deleted: ${notification.deletedMessagesCount.toLocaleString()}
🕐 Time: ${new Date(notification.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`;
  }

  private formatSystemMessage(notification: SystemNotification): string {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨',
    };

    return `${severityEmoji[notification.severity]} *System Alert*
📋 Type: ${notification.type.replace('_', ' ').toUpperCase()}
💬 Message: ${notification.message}
🕐 Time: ${new Date(notification.timestamp).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}`;
  }

  private shouldNotifyCleanup(deletionResult: DeletionResult): boolean {
    // Configurable thresholds for cleanup notifications
    const sessionThreshold = parseInt(process.env.CLEANUP_NOTIFICATION_SESSION_THRESHOLD || '50');
    const messageThreshold = parseInt(process.env.CLEANUP_NOTIFICATION_MESSAGE_THRESHOLD || '500');

    return (
      deletionResult.deletedSessionsCount >= sessionThreshold ||
      deletionResult.deletedMessagesCount >= messageThreshold
    );
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  async testNotification(): Promise<boolean> {
    try {
      await this.sendNotification(
        '🧪 Test Notification',
        'This is a test notification from the Chat Data Management system.'
      );
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
}