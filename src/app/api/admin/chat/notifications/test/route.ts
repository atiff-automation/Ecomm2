/**
 * Chat Notification Test API
 * Test notification system functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ChatNotificationService } from '@/lib/notifications/chat-notifications';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    const notificationService = ChatNotificationService.getInstance();

    switch (type) {
      case 'test':
        const success = await notificationService.testNotification();
        return NextResponse.json({
          success,
          message: success
            ? 'Test notification sent successfully'
            : 'Test notification failed',
        });

      case 'system_health':
        await notificationService.notifySystemHealth(
          'Chat data management system is operating normally',
          'info'
        );
        return NextResponse.json({
          success: true,
          message: 'System health notification sent',
        });

      case 'storage_warning':
        await notificationService.notifyStorageWarning(85, 80);
        return NextResponse.json({
          success: true,
          message: 'Storage warning notification sent',
        });

      case 'job_failure':
        await notificationService.notifyJobFailure(
          'test-job',
          'This is a test job failure notification'
        );
        return NextResponse.json({
          success: true,
          message: 'Job failure notification sent',
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid notification type. Must be "test", "system_health", "storage_warning", or "job_failure"',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Notification test API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
