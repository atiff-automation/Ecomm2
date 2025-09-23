/**
 * Chat Archive Stats API
 * Provides statistics about archived chat sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get archive statistics
    const [
      totalArchivedSessions,
      totalArchivedMessages,
      oldestArchive,
      newestArchive,
      sizeByMonth,
    ] = await Promise.all([
      // Total archived sessions
      prisma.chatSession.count({
        where: {
          status: 'archived',
          archivedAt: {
            not: null,
          },
        },
      }),

      // Total archived messages
      prisma.chatMessage.count({
        where: {
          session: {
            status: 'archived',
            archivedAt: {
              not: null,
            },
          },
        },
      }),

      // Oldest archive
      prisma.chatSession.findFirst({
        where: {
          status: 'archived',
          archivedAt: {
            not: null,
          },
        },
        orderBy: {
          archivedAt: 'asc',
        },
        select: {
          archivedAt: true,
        },
      }),

      // Newest archive
      prisma.chatSession.findFirst({
        where: {
          status: 'archived',
          archivedAt: {
            not: null,
          },
        },
        orderBy: {
          archivedAt: 'desc',
        },
        select: {
          archivedAt: true,
        },
      }),

      // Archive size by month
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "archivedAt") as month,
          COUNT(*) as sessions,
          COUNT(m.id) as messages
        FROM "chat_sessions" cs
        LEFT JOIN "chat_messages" m ON cs.id = m."sessionId"
        WHERE cs.status = 'archived'
          AND cs."archivedAt" IS NOT NULL
        GROUP BY DATE_TRUNC('month', "archivedAt")
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    // Calculate storage estimates (rough approximation)
    const avgMessageSize = 200; // bytes
    const avgSessionSize = 1000; // bytes
    const estimatedStorageBytes =
      totalArchivedMessages * avgMessageSize +
      totalArchivedSessions * avgSessionSize;
    const estimatedStorageMB =
      Math.round((estimatedStorageBytes / 1024 / 1024) * 100) / 100;

    const stats = {
      totalSessions: totalArchivedSessions,
      totalMessages: totalArchivedMessages,
      estimatedStorageMB,
      oldestArchive: oldestArchive?.archivedAt || null,
      newestArchive: newestArchive?.archivedAt || null,
      monthlyBreakdown: sizeByMonth,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Archive stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
