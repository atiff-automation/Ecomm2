/**
 * Daily Summary Cron Job - Malaysian E-commerce Platform
 * Sends automated daily summary to Telegram at 00:00 Malaysian time
 */

import cron from 'node-cron';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

class DailySummaryCron {
  private isRunning: boolean = false;
  private cronTask: any = null;

  /**
   * Start the daily summary cron job
   * Runs at 00:00 Malaysian time (UTC+8) every day
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📅 Daily summary cron job is already running');
      return;
    }

    // Destroy any existing cron task first (prevents multiple schedules)
    if (this.cronTask) {
      this.cronTask.destroy();
      this.cronTask = null;
    }

    // Cron pattern: "0 0 * * *" = At 00:00 every day
    // Since Malaysian time is UTC+8, we need to adjust for server timezone
    // If server is in UTC, we need to run at 16:00 UTC (00:00 UTC+8)
    // If server is in Malaysian time, we run at 00:00 local time

    const timezone = 'Asia/Kuala_Lumpur';

    this.cronTask = cron.schedule(
      '0 0 * * *',
      async () => {
        await this.runDailySummary();
      },
      {
        scheduled: true,
        timezone: timezone,
      }
    );

    this.isRunning = true;
    console.log(`📅 Daily summary cron job started (${timezone})`);
  }

  /**
   * Stop the cron job
   */
  public stop(): void {
    if (this.cronTask) {
      this.cronTask.destroy();
      this.cronTask = null;
    }
    this.isRunning = false;
    console.log('📅 Daily summary cron job stopped');
  }

  /**
   * Execute the daily summary task
   */
  private async runDailySummary(): Promise<void> {
    try {
      console.log('📊 Running daily summary task...');

      // Get yesterday's date (since this runs at 00:00, we want previous day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const success =
        await simplifiedTelegramService.sendDailySummary(yesterday);

      if (success) {
        console.log(
          `✅ Daily summary sent successfully for ${yesterday.toDateString()}`
        );
      } else {
        console.error(
          `❌ Failed to send daily summary for ${yesterday.toDateString()}`
        );
      }
    } catch (error) {
      console.error('❌ Error in daily summary cron job:', error);
    }
  }

  /**
   * Manually trigger daily summary (for testing)
   */
  public async triggerManual(date?: Date): Promise<boolean> {
    try {
      const targetDate = date || new Date();
      console.log(
        `📊 Manually triggering daily summary for ${targetDate.toDateString()}...`
      );

      const success =
        await simplifiedTelegramService.sendDailySummary(targetDate);

      if (success) {
        console.log(`✅ Manual daily summary sent successfully`);
      } else {
        console.error(`❌ Failed to send manual daily summary`);
      }

      return success;
    } catch (error) {
      console.error('❌ Error in manual daily summary trigger:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dailySummaryCron = new DailySummaryCron();
