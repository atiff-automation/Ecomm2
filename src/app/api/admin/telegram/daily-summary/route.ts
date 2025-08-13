/**
 * Daily Summary API - Malaysian E-commerce Platform
 * Manual trigger and management for daily summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { dailySummaryCron } from '@/lib/cron/daily-summary';

/**
 * POST /api/admin/telegram/daily-summary - Manually trigger daily summary
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetDate = body.date ? new Date(body.date) : new Date();

    // Manually trigger daily summary
    const success = await dailySummaryCron.triggerManual(targetDate);

    return NextResponse.json({
      success,
      message: success
        ? 'Daily summary sent successfully'
        : 'Failed to send daily summary',
      date: targetDate.toDateString(),
    });
  } catch (error) {
    console.error('Error triggering daily summary:', error);
    return NextResponse.json(
      { message: 'Failed to trigger daily summary' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/telegram/daily-summary - Get daily summary status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      cronEnabled: true,
      schedule: '00:00 Malaysian Time (UTC+8)',
      timezone: 'Asia/Kuala_Lumpur',
      description: 'Sends daily order summary at midnight',
    });
  } catch (error) {
    console.error('Error getting daily summary status:', error);
    return NextResponse.json(
      { message: 'Failed to get daily summary status' },
      { status: 500 }
    );
  }
}
