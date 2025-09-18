import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { ChatPerformanceUtils, PerformanceMonitor } from '@/lib/db/performance-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use optimized performance utilities - centralized approach
    const [sessions, totalCount] = await Promise.all([
      PerformanceMonitor.measureQueryTime(
        'chat-sessions-fetch',
        () => ChatPerformanceUtils.getOptimizedChatSessions({ status, limit, offset })
      ),
      PerformanceMonitor.measureQueryTime(
        'chat-sessions-count',
        () => {
          const whereClause: any = {};
          if (status && status !== 'all') {
            switch (status) {
              case 'active':
                whereClause.status = { in: ['active', 'inactive'] };
                break;
              case 'ended':
                whereClause.status = { in: ['expired', 'ended', 'archived'] };
                break;
              case 'idle':
                whereClause.status = 'idle';
                break;
              default:
                whereClause.status = status;
            }
          }
          return ChatPerformanceUtils.getOptimizedSessionCount(whereClause);
        }
      ),
    ]);

    // Transform using centralized utility
    const transformedSessions = ChatPerformanceUtils.transformSessionData(sessions);

    // Debug logging (remove in production)
    // console.log('🔍 Sessions API Debug:', {
    //   totalSessions: sessions.length,
    //   transformedSessions: transformedSessions.length,
    //   totalCount,
    // });

    return NextResponse.json({
      sessions: transformedSessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Admin chat sessions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// End a specific chat session
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    
    switch (action) {
      case 'end':
        updateData = {
          status: 'ended',
          endedAt: new Date(),
          lastActivity: new Date(),
        };
        break;
      case 'archive':
        updateData = {
          status: 'archived',
          lastActivity: new Date(),
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the session
    const updatedSession = await prisma.chatSession.update({
      where: { sessionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        sessionId: updatedSession.sessionId,
        status: updatedSession.status,
        lastActivity: updatedSession.lastActivity.toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin chat session action error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}