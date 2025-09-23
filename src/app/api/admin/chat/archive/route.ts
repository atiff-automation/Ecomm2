/**
 * Chat Archive API
 * Handles archived session data retrieval and management
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch archived sessions
    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: {
          status: 'archived',
          archivedAt: {
            not: null,
          },
        },
        select: {
          id: true,
          sessionId: true,
          status: true,
          createdAt: true,
          archivedAt: true,
          endedAt: true,
          userId: true,
          guestEmail: true,
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          archivedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.chatSession.count({
        where: {
          status: 'archived',
          archivedAt: {
            not: null,
          },
        },
      }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Archive API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionIds } = await request.json();

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs array is required' },
        { status: 400 }
      );
    }

    // Delete sessions and their messages
    const result = await prisma.$transaction(async tx => {
      // Delete messages first
      await tx.chatMessage.deleteMany({
        where: {
          sessionId: {
            in: sessionIds,
          },
        },
      });

      // Delete sessions
      const deletedSessions = await tx.chatSession.deleteMany({
        where: {
          id: {
            in: sessionIds,
          },
          status: 'archived',
        },
      });

      return deletedSessions;
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Archive deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
