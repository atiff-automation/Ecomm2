/**

export const dynamic = 'force-dynamic';

 * Daily Summary Test API - Malaysian E-commerce Platform
 * CENTRALIZED admin telegram daily summary testing
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { dailySummaryCron } from '@/lib/cron/daily-summary';

/**
 * POST /api/admin/telegram/daily-summary - Manually trigger daily summary for testing
 * CENTRALIZED: Admin-only testing endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date } = body;

    // Parse date if provided, otherwise use current date
    const targetDate = date ? new Date(date) : new Date();

    // DRY: Use existing daily summary service
    const success = await dailySummaryCron.triggerManual(targetDate);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Daily summary sent successfully',
        date: targetDate.toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to send daily summary - check Telegram configuration' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send daily summary' 
      },
      { status: 500 }
    );
  }
}