/**

export const dynamic = 'force-dynamic';

 * Chat Data Cleanup API
 * Manual and preview cleanup operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ChatCleanupService } from '@/lib/chat/cleanup-service';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cleanup preview
    const cleanupService = ChatCleanupService.getInstance();
    const preview = await cleanupService.getCleanupPreview();
    const stats = await cleanupService.getRetentionStats();

    return NextResponse.json({
      success: true,
      preview,
      stats: {
        ...stats,
        config: {
          ...stats.config,
          retentionDays: stats.config.retentionDays,
          gracePeriodDays: stats.config.gracePeriodDays,
          autoDeleteEnabled: stats.config.autoDeleteEnabled,
          backupEnabled: stats.config.backupEnabled,
        },
      },
    });
  } catch (error) {
    console.error('Cleanup preview API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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
    const { action, beforeDate } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const cleanupService = ChatCleanupService.getInstance();

    switch (action) {
      case 'scheduled':
        // Perform scheduled cleanup according to retention policy
        const scheduledResult = await cleanupService.performScheduledCleanup();
        return NextResponse.json({
          success: scheduledResult.success,
          result: scheduledResult,
        });

      case 'force':
        // Force cleanup before specific date
        if (!beforeDate) {
          return NextResponse.json(
            { error: 'beforeDate is required for force cleanup' },
            { status: 400 }
          );
        }

        const forceDate = new Date(beforeDate);
        if (isNaN(forceDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid beforeDate format' },
            { status: 400 }
          );
        }

        const forceResult = await cleanupService.forceCleanupBefore(forceDate);
        return NextResponse.json({
          success: forceResult.success,
          result: forceResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be "scheduled" or "force"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
