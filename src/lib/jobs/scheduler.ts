/**
 * Chat Data Management Job Scheduler
 * Cron-based job scheduling system
 */

import * as cron from 'node-cron';
import { chatDataManagementJobs } from './chat-data-management';
import { handleMonthlyBackup } from './handlers/monthly-backup-handler';
import { handleDailyCleanup } from './handlers/daily-cleanup-handler';

class ChatDataJobScheduler {
  private static instance: ChatDataJobScheduler;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  private constructor() {}

  public static getInstance(): ChatDataJobScheduler {
    if (!ChatDataJobScheduler.instance) {
      ChatDataJobScheduler.instance = new ChatDataJobScheduler();
    }
    return ChatDataJobScheduler.instance;
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Chat data job scheduler is already running');
      return;
    }

    console.log('Starting chat data management job scheduler...');

    // Schedule monthly backup job
    const monthlyBackupTask = cron.schedule(
      chatDataManagementJobs.monthlyBackup.cron,
      async () => {
        console.log('🗓️ Running monthly backup job...');
        try {
          await handleMonthlyBackup();
        } catch (error) {
          console.error('Monthly backup job error:', error);
        }
      },
      {
        scheduled: false,
        timezone: chatDataManagementJobs.monthlyBackup.timezone,
      }
    );

    // Schedule daily cleanup job
    const dailyCleanupTask = cron.schedule(
      chatDataManagementJobs.dailyCleanup.cron,
      async () => {
        console.log('🗓️ Running daily cleanup job...');
        try {
          await handleDailyCleanup();
        } catch (error) {
          console.error('Daily cleanup job error:', error);
        }
      },
      {
        scheduled: false,
        timezone: chatDataManagementJobs.dailyCleanup.timezone,
      }
    );

    // Store references to scheduled tasks
    this.scheduledJobs.set(chatDataManagementJobs.monthlyBackup.name, monthlyBackupTask);
    this.scheduledJobs.set(chatDataManagementJobs.dailyCleanup.name, dailyCleanupTask);

    // Start all scheduled tasks
    monthlyBackupTask.start();
    dailyCleanupTask.start();

    this.isRunning = true;

    console.log('Chat data management jobs scheduled:');
    console.log(`- Monthly Backup: ${chatDataManagementJobs.monthlyBackup.cron} (${chatDataManagementJobs.monthlyBackup.timezone})`);
    console.log(`- Daily Cleanup: ${chatDataManagementJobs.dailyCleanup.cron} (${chatDataManagementJobs.dailyCleanup.timezone})`);
  }

  public stop(): void {
    if (!this.isRunning) {
      console.log('Chat data job scheduler is not running');
      return;
    }

    console.log('Stopping chat data management job scheduler...');

    // Stop all scheduled tasks
    for (const [jobName, task] of this.scheduledJobs) {
      task.stop();
      console.log(`Stopped job: ${jobName}`);
    }

    this.scheduledJobs.clear();
    this.isRunning = false;

    console.log('Chat data management job scheduler stopped');
  }

  public getJobStatus(): Record<string, any> {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      jobDefinitions: {
        monthlyBackup: {
          ...chatDataManagementJobs.monthlyBackup,
          nextRun: this.getNextRunTime(chatDataManagementJobs.monthlyBackup.cron),
        },
        dailyCleanup: {
          ...chatDataManagementJobs.dailyCleanup,
          nextRun: this.getNextRunTime(chatDataManagementJobs.dailyCleanup.cron),
        },
      },
    };
  }

  public async runJobManually(jobName: string): Promise<any> {
    console.log(`Manually running job: ${jobName}`);

    switch (jobName) {
      case chatDataManagementJobs.monthlyBackup.name:
        return await handleMonthlyBackup();

      case chatDataManagementJobs.dailyCleanup.name:
        return await handleDailyCleanup();

      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  private getNextRunTime(cronExpression: string): string | null {
    try {
      // This is a simplified calculation
      // In production, you might want to use a more sophisticated cron parser
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      return nextHour.toISOString();
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return null;
    }
  }

  public isJobRunning(): boolean {
    return this.isRunning;
  }

  public getJobList(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }
}

export default ChatDataJobScheduler;