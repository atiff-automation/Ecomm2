/**

export const dynamic = 'force-dynamic';

 * Cron Job: Cleanup Expired Pending Memberships
 * This endpoint should be called periodically to clean up expired pending memberships
 * Can be triggered by external cron services like GitHub Actions, Vercel Cron, or server cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredPendingMemberships } from '@/lib/membership/pending-cleanup';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn('CRON_SECRET not configured, skipping authorization check');
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting cleanup of expired pending memberships...');

    const result = await cleanupExpiredPendingMemberships();

    if (result.error) {
      console.error('Cleanup failed:', result.error);
      return NextResponse.json(
        {
          message: 'Cleanup failed',
          error: result.error,
          deletedCount: result.deletedCount,
        },
        { status: 500 }
      );
    }

    console.log(
      `Cleanup completed successfully. Deleted ${result.deletedCount} expired records.`
    );

    return NextResponse.json({
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Pending membership cleanup cron job endpoint',
    usage: 'Send POST request with proper authorization to trigger cleanup',
    lastModified: new Date().toISOString(),
  });
}
