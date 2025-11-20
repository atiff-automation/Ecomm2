/**
 * Landing Page Scheduler Cron Job - Malaysian E-commerce Platform
 * Automatically publishes and unpublishes scheduled landing pages
 * Runs every 15 minutes
 */

import cron from 'node-cron';
import { processScheduledLandingPages } from '@/lib/services/landing-page-scheduler';

class LandingPageSchedulerCron {
  private isRunning: boolean = false;
  private cronTask: any = null;

  /**
   * Start the landing page scheduler cron job
   * Runs every 15 minutes in Malaysian timezone
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📅 Landing page scheduler cron job is already running');
      return;
    }

    // Destroy any existing cron task first (prevents multiple schedules)
    if (this.cronTask) {
      this.cronTask.destroy();
      this.cronTask = null;
    }

    // Cron pattern: "*/15 * * * *" = Every 15 minutes
    const timezone = 'Asia/Kuala_Lumpur';

    this.cronTask = cron.schedule(
      '*/15 * * * *',
      async () => {
        await this.runScheduler();
      },
      {
        scheduled: true,
        timezone: timezone,
      }
    );

    this.isRunning = true;
    console.log(`📅 Landing page scheduler cron job started (runs every 15 minutes in ${timezone})`);
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
    console.log('📅 Landing page scheduler cron job stopped');
  }

  /**
   * Execute the scheduler task
   */
  private async runScheduler(): Promise<void> {
    try {
      console.log('📅 [Landing Page Scheduler] Running scheduled page processing...');

      const result = await processScheduledLandingPages();

      if (result.published > 0 || result.unpublished > 0) {
        console.log(
          `✅ [Landing Page Scheduler] Completed: ${result.published} published, ${result.unpublished} unpublished`
        );
      }

      if (result.errors.length > 0) {
        console.error(
          `⚠️ [Landing Page Scheduler] Encountered ${result.errors.length} errors:`,
          result.errors
        );
      }
    } catch (error) {
      console.error('❌ [Landing Page Scheduler] Error in cron job:', error);
    }
  }

  /**
   * Manually trigger scheduler (for testing)
   */
  public async triggerManual(): Promise<boolean> {
    try {
      console.log('📅 [Landing Page Scheduler] Manually triggering scheduler...');

      const result = await processScheduledLandingPages();

      console.log(
        `✅ [Landing Page Scheduler] Manual trigger completed: ${result.published} published, ${result.unpublished} unpublished, ${result.errors.length} errors`
      );

      return result.errors.length === 0;
    } catch (error) {
      console.error('❌ [Landing Page Scheduler] Error in manual trigger:', error);
      return false;
    }
  }
}

// Export singleton instance
export const landingPageSchedulerCron = new LandingPageSchedulerCron();
