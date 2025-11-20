/**
 * Cron Jobs Initialization - Malaysian E-commerce Platform
 * Initialize all scheduled tasks
 */

import { dailySummaryCron } from './daily-summary';
import { landingPageSchedulerCron } from './landing-page-scheduler';

// Declare global type to avoid TypeScript errors
declare global {
  var __cronJobsInitialized: boolean | undefined;
}

/**
 * Start all cron jobs (with persistent singleton protection across Next.js hot reloads)
 */
export function initializeCronJobs(): void {
  if (global.__cronJobsInitialized) {
    console.log('📅 Cron jobs already initialized, skipping...');
    return;
  }

  console.log('🚀 Initializing cron jobs...');

  // Start daily summary cron job
  dailySummaryCron.start();

  // Start landing page scheduler cron job
  landingPageSchedulerCron.start();

  global.__cronJobsInitialized = true;
  console.log('✅ All cron jobs initialized');
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs(): void {
  console.log('🛑 Stopping cron jobs...');

  // Stop daily summary cron job
  dailySummaryCron.stop();

  // Stop landing page scheduler cron job
  landingPageSchedulerCron.stop();

  // Reset global flag
  global.__cronJobsInitialized = false;

  console.log('✅ All cron jobs stopped');
}

// Register cleanup on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received - stopping all cron jobs...');
    stopCronJobs();
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received - stopping all cron jobs...');
    stopCronJobs();
  });
}
