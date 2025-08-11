/**
 * Cron Jobs Initialization - Malaysian E-commerce Platform
 * Initialize all scheduled tasks
 */

import { dailySummaryCron } from './daily-summary';

/**
 * Start all cron jobs
 */
export function initializeCronJobs(): void {
  console.log('🚀 Initializing cron jobs...');
  
  // Start daily summary cron job
  dailySummaryCron.start();
  
  console.log('✅ All cron jobs initialized');
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs(): void {
  console.log('🛑 Stopping cron jobs...');
  
  // Stop daily summary cron job
  dailySummaryCron.stop();
  
  console.log('✅ All cron jobs stopped');
}