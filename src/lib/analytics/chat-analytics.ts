/**
 * Chat Analytics Utilities
 * Centralized analytics calculations following DRY principles
 * @CLAUDE.md - Systematic approach with one source of truth
 */

import { prisma } from '@/lib/db/prisma';
import { PerformanceMonitor } from '@/lib/db/performance-utils';

export interface AnalyticsData {
  // Core session metrics
  sessionMetrics: {
    totalSessions: number;
    activeSessions: number;
    endedSessions: number;
    averageSessionDuration: number;
    sessionGrowth: number;
  };
  
  // Message analytics
  messageMetrics: {
    totalMessages: number;
    messagesPerSession: number;
    botMessages: number;
    userMessages: number;
    messageGrowth: number;
  };
  
  // Performance metrics
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    queueProcessingTime: number;
    errorRate: number;
  };
  
  // User engagement metrics
  engagementMetrics: {
    peakHours: Array<{ hour: number; sessions: number }>;
    userTypes: { authenticated: number; guest: number };
    sessionLengthDistribution: Array<{ range: string; count: number }>;
    returnUserRate: number;
  };
  
  // Trend data for charts
  trendData: {
    sessionsOverTime: Array<{ date: string; sessions: number; messages: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    dailyComparison: Array<{ day: string; current: number; previous: number }>;
  };
  
  // Meta information
  timeRange: string;
  generatedAt: string;
  periodComparison?: {
    previousPeriod: string;
    growth: {
      sessions: number;
      messages: number;
      avgDuration: number;
    };
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  color?: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string;
  format?: 'number' | 'percentage' | 'duration' | 'date';
}

/**
 * Centralized chat analytics engine
 * Following performance-utils pattern for consistency
 */
export class ChatAnalyticsEngine {
  /**
   * Get time range boundaries for analytics calculations
   * Centralized time range logic - no hardcoded values
   */
  static getTimeRangeBoundaries(timeRange: string) {
    const now = new Date();
    const ranges = {
      '1h': {
        start: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        previous: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        label: 'Last Hour',
        unit: 'hour'
      },
      '24h': {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        previous: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        label: 'Last 24 Hours', 
        unit: 'day'
      },
      '7d': {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        previous: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        label: 'Last 7 Days',
        unit: 'day'
      },
      '30d': {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        previous: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        label: 'Last 30 Days',
        unit: 'day'
      },
      '90d': {
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        previous: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        label: 'Last 90 Days',
        unit: 'week'
      },
      'all': {
        start: new Date(0),
        previous: null,
        label: 'All Time',
        unit: 'month'
      }
    };

    return ranges[timeRange as keyof typeof ranges] || ranges['24h'];
  }

  /**
   * Get comprehensive analytics data with optimized parallel queries
   * Following performance-utils pattern for efficient data fetching
   */
  static async getAnalyticsData(timeRange: string = '24h'): Promise<AnalyticsData> {
    const boundaries = this.getTimeRangeBoundaries(timeRange);
    const now = new Date();

    // Execute all analytics queries in parallel for performance
    const [
      sessionMetrics,
      messageMetrics,
      performanceMetrics,
      engagementMetrics,
      trendData,
      periodComparison
    ] = await Promise.all([
      this.getSessionMetrics(boundaries.start, now),
      this.getMessageMetrics(boundaries.start, now),
      this.getPerformanceMetrics(boundaries.start, now),
      this.getEngagementMetrics(boundaries.start, now, boundaries.unit),
      this.getTrendData(boundaries.start, now, boundaries.unit),
      boundaries.previous ? this.getPeriodComparison(boundaries.previous, boundaries.start, boundaries.start, now) : null
    ]);

    return {
      sessionMetrics,
      messageMetrics,
      performanceMetrics,
      engagementMetrics,
      trendData,
      timeRange,
      generatedAt: now.toISOString(),
      periodComparison
    };
  }

  /**
   * Get session metrics with growth calculations
   */
  private static async getSessionMetrics(startDate: Date, endDate: Date) {
    const [totalSessions, activeSessions, sessionDurations] = await Promise.all([
      prisma.chatSession.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.chatSession.count({
        where: { 
          createdAt: { gte: startDate, lte: endDate },
          status: 'active'
        }
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          AVG(EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60) as avg_duration
        FROM "chat_sessions" 
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND "status" IN ('ended', 'expired', 'archived', 'completed')
      `
    ]);

    const durationResult = sessionDurations[0] as any;
    const averageSessionDuration = Number(durationResult?.avg_duration) || 0;
    const endedSessions = totalSessions - activeSessions;

    return {
      totalSessions,
      activeSessions,
      endedSessions,
      averageSessionDuration: Math.round(averageSessionDuration * 60), // Convert to seconds
      sessionGrowth: 0 // Will be calculated in period comparison
    };
  }

  /**
   * Get message metrics with sender type breakdown
   */
  private static async getMessageMetrics(startDate: Date, endDate: Date) {
    const [totalMessages, senderBreakdown] = await Promise.all([
      prisma.chatMessage.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.chatMessage.groupBy({
        by: ['senderType'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { senderType: true }
      })
    ]);

    const senderCounts = senderBreakdown.reduce((acc, item) => {
      acc[item.senderType] = item._count.senderType;
      return acc;
    }, {} as Record<string, number>);

    const totalSessions = await prisma.chatSession.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    return {
      totalMessages,
      messagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
      botMessages: senderCounts['bot'] || 0,
      userMessages: senderCounts['user'] || 0,
      messageGrowth: 0 // Will be calculated in period comparison
    };
  }

  /**
   * Get performance metrics from queue and response data
   */
  private static async getPerformanceMetrics(startDate: Date, endDate: Date) {
    const [queueStats, responseTimeData] = await Promise.all([
      prisma.chatWebhookQueue.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
        _avg: { attempts: true }
      }),
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_responses,
          AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as avg_response_time,
          COUNT(CASE WHEN "status" = 'completed' THEN 1 END) as successful_responses,
          COUNT(CASE WHEN "status" = 'failed' THEN 1 END) as failed_responses
        FROM "chat_webhook_queue" 
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
      `
    ]);

    const responseStats = responseTimeData[0] as any;
    const totalResponses = Number(responseStats?.total_responses) || 0;
    const successfulResponses = Number(responseStats?.successful_responses) || 0;
    const failedResponses = Number(responseStats?.failed_responses) || 0;

    return {
      averageResponseTime: Number(responseStats?.avg_response_time) || 0,
      successRate: totalResponses > 0 ? (successfulResponses / totalResponses) * 100 : 100,
      queueProcessingTime: Number(queueStats._avg.attempts) || 0,
      errorRate: totalResponses > 0 ? (failedResponses / totalResponses) * 100 : 0
    };
  }

  /**
   * Get user engagement metrics
   */
  private static async getEngagementMetrics(startDate: Date, endDate: Date, unit: string) {
    const [peakHoursData, userTypesData, sessionLengthData] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*) as sessions
        FROM "chat_sessions"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour
      `,
      prisma.chatSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { userId: true }
      }),
      prisma.$queryRaw`
        SELECT
          CASE
            WHEN EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60 < 5 THEN '0-5 min'
            WHEN EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60 < 15 THEN '5-15 min'
            WHEN EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60 < 30 THEN '15-30 min'
            WHEN EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60 < 60 THEN '30-60 min'
            ELSE '60+ min'
          END as range,
          COUNT(*) as count
        FROM "chat_sessions"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
          AND "status" IN ('ended', 'expired', 'archived', 'completed')
        GROUP BY 1
        ORDER BY 1
      `
    ]);

    const peakHours = (peakHoursData as any[]).map(row => ({
      hour: Number(row.hour),
      sessions: Number(row.sessions)
    }));

    const userTypes = userTypesData.reduce((acc, item) => {
      if (item.userId) {
        acc.authenticated++;
      } else {
        acc.guest++;
      }
      return acc;
    }, { authenticated: 0, guest: 0 });

    const sessionLengthDistribution = (sessionLengthData as any[]).map(row => ({
      range: row.range,
      count: Number(row.count)
    }));

    return {
      peakHours,
      userTypes,
      sessionLengthDistribution,
      returnUserRate: 0 // Calculate based on repeat sessions if needed
    };
  }

  /**
   * Get trend data for charts
   */
  private static async getTrendData(startDate: Date, endDate: Date, unit: string) {
    const interval = unit === 'hour' ? 'hour' : unit === 'week' ? 'week' : 'day';

    // Build the query string with proper escaping for the interval
    const sessionsOverTimeQuery = `
      SELECT
        DATE_TRUNC('${interval}', s."createdAt") as date,
        COUNT(*) as sessions,
        COALESCE(SUM(msg_counts.message_count), 0) as messages
      FROM "chat_sessions" s
      LEFT JOIN (
        SELECT "sessionId", COUNT(*) as message_count
        FROM "chat_messages"
        GROUP BY "sessionId"
      ) msg_counts ON s."sessionId" = msg_counts."sessionId"
      WHERE s."createdAt" >= $1
        AND s."createdAt" <= $2
      GROUP BY DATE_TRUNC('${interval}', s."createdAt")
      ORDER BY date
    `;

    const [sessionsOverTime, hourlyDistribution] = await Promise.all([
      prisma.$queryRawUnsafe(sessionsOverTimeQuery, startDate, endDate),
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*) as count
        FROM "chat_sessions"
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour
      `
    ]);

    const sessionsData = (sessionsOverTime as any[]).map(row => ({
      date: row.date.toISOString().split('T')[0],
      sessions: Number(row.sessions),
      messages: Number(row.messages) || 0
    }));

    const hourlyData = (hourlyDistribution as any[]).map(row => ({
      hour: Number(row.hour),
      count: Number(row.count)
    }));

    return {
      sessionsOverTime: sessionsData,
      hourlyDistribution: hourlyData,
      dailyComparison: [] // Will be filled by period comparison if available
    };
  }

  /**
   * Get period-over-period comparison data
   */
  private static async getPeriodComparison(
    prevStart: Date, 
    prevEnd: Date, 
    currStart: Date, 
    currEnd: Date
  ) {
    const [prevData, currData] = await Promise.all([
      this.getBasicMetrics(prevStart, prevEnd),
      this.getBasicMetrics(currStart, currEnd)
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      previousPeriod: `${prevStart.toLocaleDateString()} - ${prevEnd.toLocaleDateString()}`,
      growth: {
        sessions: calculateGrowth(currData.sessions, prevData.sessions),
        messages: calculateGrowth(currData.messages, prevData.messages),
        avgDuration: calculateGrowth(currData.avgDuration, prevData.avgDuration)
      }
    };
  }

  /**
   * Get basic metrics for comparison calculations
   */
  private static async getBasicMetrics(startDate: Date, endDate: Date) {
    const [sessions, messages, durationData] = await Promise.all([
      prisma.chatSession.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.chatMessage.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (COALESCE("endedAt", "lastActivity") - "createdAt"))/60) as avg_duration
        FROM "chat_sessions"
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND "status" IN ('ended', 'expired', 'archived', 'completed')
      `
    ]);

    const avgDuration = Number((durationData[0] as any)?.avg_duration) || 0;

    return {
      sessions,
      messages,
      avgDuration: avgDuration * 60 // Convert to seconds
    };
  }

  /**
   * Generate optimized chart data for frontend consumption
   * Centralized chart data transformation
   */
  static generateChartData(analytics: AnalyticsData): ChartData[] {
    return [
      {
        type: 'line',
        title: 'Sessions Over Time',
        data: analytics.trendData.sessionsOverTime.map(item => ({
          label: item.date,
          value: item.sessions,
          date: item.date
        })),
        xAxis: 'Date',
        yAxis: 'Sessions',
        format: 'number'
      },
      {
        type: 'bar',
        title: 'Hourly Activity Distribution',
        data: analytics.trendData.hourlyDistribution.map(item => ({
          label: `${item.hour}:00`,
          value: item.count
        })),
        xAxis: 'Hour',
        yAxis: 'Sessions',
        format: 'number'
      },
      {
        type: 'pie',
        title: 'User Types Distribution',
        data: [
          {
            label: 'Authenticated Users',
            value: analytics.engagementMetrics.userTypes.authenticated,
            color: '#3B82F6'
          },
          {
            label: 'Guest Users',
            value: analytics.engagementMetrics.userTypes.guest,
            color: '#10B981'
          }
        ],
        format: 'number'
      },
      {
        type: 'bar',
        title: 'Session Length Distribution',
        data: analytics.engagementMetrics.sessionLengthDistribution.map(item => ({
          label: item.range,
          value: item.count
        })),
        xAxis: 'Duration',
        yAxis: 'Sessions',
        format: 'number'
      }
    ];
  }
}

/**
 * Analytics performance monitoring
 * Following PerformanceMonitor pattern
 */
export class AnalyticsPerformanceMonitor {
  static async measureAnalyticsQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    return await PerformanceMonitor.measureQueryTime(
      `analytics-${queryName}`,
      queryFn
    );
  }
}