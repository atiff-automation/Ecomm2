/**
 * Test System Alerts Telegram Channel API
 * CENTRALIZED test for system alerts notifications
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

/**
 * POST /api/admin/telegram/simple-test-system-alerts - Test system alerts notification
 * CENTRALIZED: Uses unified telegram service
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // SINGLE SOURCE OF TRUTH: Check if system alerts channel is configured
    const isConfigured = await simplifiedTelegramService.isSystemAlertsChannelConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        message: 'System alerts channel not configured'
      });
    }

    // DRY: Send test notification using centralized service
    const success = await simplifiedTelegramService.sendSystemAlertNotification(
      '🧪 Test System Alert Notification',
      `This is a test notification for system alerts channel.

If you receive this message, your system alerts notifications are working correctly! ✅

This channel will receive:
• Critical system health alerts
• Job failure notifications
• Application error notifications
• Infrastructure monitoring alerts`,
      'info'
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  } catch (error) {
    console.error('Error sending test system alerts notification:', error);
    return NextResponse.json(
      { message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}