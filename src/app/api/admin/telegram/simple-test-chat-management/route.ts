/**
 * Test Chat Management Telegram Channel API
 * CENTRALIZED test for chat management notifications
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

/**
 * POST /api/admin/telegram/simple-test-chat-management - Test chat management notification
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

    // SINGLE SOURCE OF TRUTH: Check if chat management channel is configured
    const isConfigured = await simplifiedTelegramService.isChatManagementChannelConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        message: 'Chat management channel not configured'
      });
    }

    // DRY: Send test notification using centralized service
    const success = await simplifiedTelegramService.sendChatManagementNotification(
      '🧪 Test Chat Management Notification',
      `This is a test notification for chat management channel.

If you receive this message, your chat management notifications are working correctly! ✅

This channel will receive:
• Chat backup completion/failure notifications
• Data cleanup operation results
• Chat system maintenance alerts`
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
    console.error('Error sending test chat management notification:', error);
    return NextResponse.json(
      { message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}