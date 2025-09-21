/**
 * Chat Data Management Jobs
 * Centralized background job definitions
 */

export const chatDataManagementJobs = {
  monthlyBackup: {
    name: 'chat-monthly-backup',
    cron: '0 2 1 * *', // 2 AM on 1st of each month
    timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
    description: 'Create monthly backup of chat data',
  },

  dailyCleanup: {
    name: 'chat-daily-cleanup',
    cron: '0 3 * * *', // 3 AM daily
    timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
    description: 'Clean up old chat data based on retention policy',
  },

  weeklyHealthCheck: {
    name: 'chat-weekly-health-check',
    cron: '0 1 * * 1', // 1 AM every Monday
    timezone: process.env.TIMEZONE || 'Asia/Kuala_Lumpur',
    description: 'Verify backup integrity and system health',
  },
};

export interface JobContext {
  jobName: string;
  startTime: Date;
  metadata?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  duration: number;
  message?: string;
  error?: string;
  data?: Record<string, any>;
}

export const createJobContext = (jobName: string, metadata?: Record<string, any>): JobContext => ({
  jobName,
  startTime: new Date(),
  metadata,
});

export const createJobResult = (
  context: JobContext,
  success: boolean,
  message?: string,
  error?: string,
  data?: Record<string, any>
): JobResult => ({
  success,
  duration: Date.now() - context.startTime.getTime(),
  message,
  error,
  data,
});

export const logJobStart = (context: JobContext): void => {
  console.log(`[Job ${context.jobName}] Started at ${context.startTime.toISOString()}`);
  if (context.metadata) {
    console.log(`[Job ${context.jobName}] Metadata:`, context.metadata);
  }
};

export const logJobEnd = (context: JobContext, result: JobResult): void => {
  const status = result.success ? 'SUCCESS' : 'FAILED';
  console.log(`[Job ${context.jobName}] ${status} - Duration: ${result.duration}ms`);

  if (result.message) {
    console.log(`[Job ${context.jobName}] Message: ${result.message}`);
  }

  if (result.error) {
    console.error(`[Job ${context.jobName}] Error: ${result.error}`);
  }

  if (result.data) {
    console.log(`[Job ${context.jobName}] Data:`, result.data);
  }
};