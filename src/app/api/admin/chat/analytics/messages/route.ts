/**
 * Messages Analytics API Endpoint
 * Provides message count data aggregated by time periods for chart visualization
 * Following @CLAUDE.md DRY principles with centralized architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
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

    const userRole = (session.user as { role: UserRole })?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h';
    const period = searchParams.get('period') || 'hour'; // hour, day, week, month

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let intervalUnit: string;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD HH24:MI';
        intervalUnit = '10 minutes';
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD HH24';
        intervalUnit = '1 hour';
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD';
        intervalUnit = '1 day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD';
        intervalUnit = '1 day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-WW';
        intervalUnit = '1 week';
        break;
      case 'all':
        // Get the oldest message date
        const oldestMessage = await prisma.chatMessage.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        });
        startDate =
          oldestMessage?.createdAt ||
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM';
        intervalUnit = '1 month';
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateFormat = 'YYYY-MM-DD HH24';
        intervalUnit = '1 hour';
    }

    // Simplified query using Prisma aggregation
    const messages = await prisma.chatMessage.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group messages by time buckets
    const messageBuckets = new Map<string, number>();

    messages.forEach(message => {
      const date = new Date(message.createdAt);
      let bucketKey: string;

      // Create time bucket based on interval
      switch (timeRange) {
        case '1h':
          // Round to nearest 10 minutes
          const minutes = Math.floor(date.getMinutes() / 10) * 10;
          date.setMinutes(minutes, 0, 0);
          bucketKey = date.toISOString();
          break;
        case '24h':
          // Round to nearest hour
          date.setMinutes(0, 0, 0);
          bucketKey = date.toISOString();
          break;
        case '7d':
        case '30d':
          // Round to day
          date.setHours(0, 0, 0, 0);
          bucketKey = date.toISOString();
          break;
        case '90d':
          // Round to week start (Monday)
          const dayOfWeek = date.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          date.setDate(date.getDate() - daysToMonday);
          date.setHours(0, 0, 0, 0);
          bucketKey = date.toISOString();
          break;
        case 'all':
          // Round to month
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          bucketKey = date.toISOString();
          break;
        default:
          date.setHours(0, 0, 0, 0);
          bucketKey = date.toISOString();
      }

      messageBuckets.set(bucketKey, (messageBuckets.get(bucketKey) || 0) + 1);
    });

    // Generate time series with gaps filled
    const messagesOverTime: Array<{
      time_bucket: Date;
      message_count: number;
    }> = [];
    const current = new Date(startDate);

    // Round start date to match bucketing logic
    switch (timeRange) {
      case '1h':
        const minutes = Math.floor(current.getMinutes() / 10) * 10;
        current.setMinutes(minutes, 0, 0);
        break;
      case '24h':
        current.setMinutes(0, 0, 0);
        break;
      case '7d':
      case '30d':
        current.setHours(0, 0, 0, 0);
        break;
      case '90d':
        const dayOfWeek = current.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        current.setDate(current.getDate() - daysToMonday);
        current.setHours(0, 0, 0, 0);
        break;
      case 'all':
        current.setDate(1);
        current.setHours(0, 0, 0, 0);
        break;
      default:
        current.setHours(0, 0, 0, 0);
    }

    while (current <= now) {
      const bucketKey = current.toISOString();
      const messageCount = messageBuckets.get(bucketKey) || 0;

      messagesOverTime.push({
        time_bucket: new Date(current),
        message_count: messageCount,
      });

      // Increment current by interval
      switch (timeRange) {
        case '1h':
          current.setMinutes(current.getMinutes() + 10);
          break;
        case '24h':
          current.setHours(current.getHours() + 1);
          break;
        case '7d':
        case '30d':
          current.setDate(current.getDate() + 1);
          break;
        case '90d':
          current.setDate(current.getDate() + 7);
          break;
        case 'all':
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    // Transform data for chart consumption
    const chartData = messagesOverTime.map(row => {
      const date = new Date(row.time_bucket);
      let label: string;

      // Format label based on time range
      switch (timeRange) {
        case '1h':
          label = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          break;
        case '24h':
          label = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          break;
        case '7d':
        case '30d':
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          break;
        case '90d':
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          break;
        case 'all':
          label = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          break;
        default:
          label = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
      }

      return {
        time: date.toISOString(),
        label,
        messages: row.message_count,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format for tooltips
      };
    });

    // Calculate total messages in period for context
    const totalMessages = chartData.reduce(
      (sum, item) => sum + item.messages,
      0
    );

    // Calculate peak and average
    const messageCounts = chartData.map(item => item.messages);
    const peakMessages = Math.max(...messageCounts);
    const averageMessages =
      messageCounts.length > 0
        ? Math.round(totalMessages / messageCounts.length)
        : 0;

    return NextResponse.json({
      success: true,
      data: chartData,
      metadata: {
        timeRange,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalMessages,
        peakMessages,
        averageMessages,
        dataPoints: chartData.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Messages analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message analytics data' },
      { status: 500 }
    );
  }
}
