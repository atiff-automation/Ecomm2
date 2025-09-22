import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import {
  ChatPerformanceUtils,
  PerformanceMonitor,
} from '@/lib/db/performance-utils';
import {
  validateQueryParams,
  checkRateLimit,
  getClientIP,
  ChatValidationRules,
} from '@/lib/security/input-validation';
import { logger } from '@/lib/logger/production-logger';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      windowMs: 60000, // 1 minute
      maxRequests: 30, // 30 requests per minute for admin
    });

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for admin sessions endpoint', {
        component: 'admin-sessions-api',
        clientIP,
      });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Input validation
    const validationResult = validateQueryParams(request, [
      ChatValidationRules.status,
      ChatValidationRules.limit,
      ChatValidationRules.offset,
      ChatValidationRules.search,
    ]);

    if (!validationResult.isValid) {
      logger.warn('Invalid input parameters', {
        component: 'admin-sessions-api',
        errors: validationResult.errors,
      });
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.errors },
        { status: 400 }
      );
    }

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

    // Use validated and sanitized parameters
    const { status, limit = 50, offset = 0 } = validationResult.sanitizedData;

    // Use optimized performance utilities - centralized approach
    const [sessions, totalCount] = await Promise.all([
      PerformanceMonitor.measureQueryTime('chat-sessions-fetch', () =>
        ChatPerformanceUtils.getOptimizedChatSessions({ status, limit, offset })
      ),
      PerformanceMonitor.measureQueryTime('chat-sessions-count', () => {
        const whereClause: any = {};
        if (status && status !== 'all') {
          switch (status) {
            case 'active':
              whereClause.status = 'active';
              break;
            case 'ended':
              whereClause.status = {
                in: [
                  'ended',
                  'expired',
                  'archived',
                  'completed',
                  'inactive',
                  'pending',
                ],
              };
              break;
            default:
              whereClause.status = status;
          }
        }
        return ChatPerformanceUtils.getOptimizedSessionCount(whereClause);
      }),
    ]);

    // Transform using centralized utility
    const transformedSessions =
      ChatPerformanceUtils.transformSessionData(sessions);

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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
