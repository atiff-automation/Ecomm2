/**
 * Landing Page Scheduler Cron Job
 *
 * GET /api/cron/landing-page-scheduler
 *
 * Automatically publishes and unpublishes landing pages based on schedule.
 * Designed to run every 15 minutes via Vercel Cron or Railway Cron.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/landing-page-scheduler",
 *     "schedule": "star-slash-15 * * * *"
 *   }]
 * }
 *
 * Railway Cron Configuration:
 * Schedule: "star-slash-15 * * * *" (every 15 minutes - replace star-slash with asterisk-slash)
 * Command: curl https://your-domain.com/api/cron/landing-page-scheduler
 *
 * @route GET /api/cron/landing-page-scheduler
 */

import { NextResponse } from 'next/server';
import { processScheduledLandingPages } from '@/lib/services/landing-page-scheduler';

/**
 * GET - Process all scheduled landing pages
 * No authentication required (cron job access)
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Landing Page Scheduler] Starting scheduled page processing...');

    // Process all scheduled landing pages
    const result = await processScheduledLandingPages();

    const duration = Date.now() - startTime;

    // Return results
    return NextResponse.json({
      success: true,
      message: 'Landing page scheduling processed successfully',
      result: {
        published: result.published,
        unpublished: result.unpublished,
        errors: result.errors,
        processedAt: result.processedAt,
      },
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Landing Page Scheduler] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled landing pages',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Runtime configuration
 * maxDuration: Maximum function execution time (60 seconds for cron jobs)
 */
export const maxDuration = 60;

/**
 * Route segment config
 * dynamic: Force dynamic rendering for cron endpoints
 */
export const dynamic = 'force-dynamic';
