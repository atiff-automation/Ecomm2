import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

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

    // Parse query parameters for time range
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h'; // 24h, 7d, 30d, 90d

    // Calculate date ranges
    const now = new Date();
    const ranges = {
      '1h': new Date(now.getTime() - 1 * 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    };
    
    const startDate = ranges[timeRange as keyof typeof ranges] || ranges['24h'];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel queries for better performance
    const [
      totalSessions,
      activeSessions,
      totalMessages,
      sessionDurations,
      todaysSessions,
      messagesByHour,
      sessionsByStatus,
      responseTimeData,
    ] = await Promise.all([
      // Total sessions count
      prisma.chatSession.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Active sessions count (mapping database values to expected values)
      prisma.chatSession.count({
        where: {
          status: {
            in: ['active', 'inactive'], // 'inactive' is essentially 'active' in our system
          },
        },
      }),

      // Total messages count
      prisma.chatMessage.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // Session durations for average calculation
      prisma.chatSession.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          endedAt: {
            not: null,
          },
        },
        select: {
          createdAt: true,
          endedAt: true,
        },
      }),

      // Today's sessions
      prisma.chatSession.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),

      // Messages by hour (for activity graph)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*) as count
        FROM "chat_messages"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour DESC
        LIMIT 24
      `,

      // Sessions by status
      prisma.chatSession.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          status: true,
        },
      }),

      // Response time data (time between user message and bot response)
      prisma.$queryRaw`
        SELECT 
          AVG(
            EXTRACT(EPOCH FROM (
              SELECT MIN("createdAt") 
              FROM "chat_messages" bot_msg 
              WHERE bot_msg."sessionId" = user_msg."sessionId" 
                AND bot_msg."senderType" = 'bot' 
                AND bot_msg."createdAt" > user_msg."createdAt"
            ) - user_msg."createdAt")
          ) as avg_response_time
        FROM "chat_messages" user_msg
        WHERE user_msg."senderType" = 'user'
          AND user_msg."createdAt" >= ${startDate}
          AND EXISTS (
            SELECT 1 FROM "chat_messages" bot_msg 
            WHERE bot_msg."sessionId" = user_msg."sessionId" 
              AND bot_msg."senderType" = 'bot' 
              AND bot_msg."createdAt" > user_msg."createdAt"
          )
      `,
    ]);

    // Calculate average session duration
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, session) => {
          const duration = session.endedAt!.getTime() - session.createdAt.getTime();
          return sum + duration;
        }, 0) / sessionDurations.length
      : 0;

    // Calculate average response time (in seconds)
    const avgResponseTime = responseTimeData && responseTimeData[0] && responseTimeData[0].avg_response_time
      ? Math.round(parseFloat(responseTimeData[0].avg_response_time))
      : 0;

    // Transform message activity data
    const messageActivity = (messagesByHour as any[]).map(item => ({
      hour: item.hour,
      count: parseInt(item.count),
      timestamp: new Date(item.hour).getTime(),
    })).reverse();

    // Transform status distribution - map database values to expected frontend values
    const statusDistribution = sessionsByStatus.reduce((acc, item) => {
      let mappedStatus: string;
      switch (item.status) {
        case 'active':
        case 'inactive':
          mappedStatus = 'active';
          break;
        case 'expired':
        case 'ended':
        case 'archived':
          mappedStatus = 'ended';
          break;
        default:
          mappedStatus = 'idle';
      }
      acc[mappedStatus] = (acc[mappedStatus] || 0) + item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Calculate additional metrics
    const metrics = {
      // Core metrics
      totalSessions,
      activeSessions,
      totalMessages,
      averageSessionDuration: Math.round(averageSessionDuration / 1000), // Convert to seconds
      todaysSessions,
      responseTime: avgResponseTime,
      
      // Engagement metrics
      messagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
      
      // Activity data for charts
      messageActivity,
      statusDistribution,
      
      // Additional insights
      peakHour: messageActivity.length > 0 
        ? messageActivity.reduce((prev, current) => 
            prev.count > current.count ? prev : current
          ).hour
        : null,
      
      // Performance indicators
      metrics: {
        engagement: totalSessions > 0 ? Math.round((totalMessages / totalSessions) * 100) / 100 : 0,
        completion: statusDistribution.ended 
          ? Math.round((statusDistribution.ended / totalSessions) * 100)
          : 0,
        satisfaction: 85, // Placeholder - could be calculated from user feedback
      }
    };

    return NextResponse.json({
      success: true,
      metrics,
      timeRange,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin chat metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat metrics' },
      { status: 500 }
    );
  }
}