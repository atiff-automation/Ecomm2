import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { ChatAnalyticsEngine, AnalyticsPerformanceMonitor } from '@/lib/analytics/chat-analytics';

/**
 * Analytics Charts API Endpoint
 * Chart-specific data retrieval for optimized chart rendering
 * @CLAUDE.md - Systematic approach with chart data optimization
 */
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
    const timeRange = searchParams.get('range') || '24h';

    // Get analytics data and generate chart data
    const [analytics, chartData] = await Promise.all([
      AnalyticsPerformanceMonitor.measureAnalyticsQuery(
        'analytics-for-charts',
        () => ChatAnalyticsEngine.getAnalyticsData(timeRange)
      ),
      AnalyticsPerformanceMonitor.measureAnalyticsQuery(
        'chart-data-generation',
        async () => {
          const data = await ChatAnalyticsEngine.getAnalyticsData(timeRange);
          return ChatAnalyticsEngine.generateChartData(data);
        }
      ),
    ]);

    return NextResponse.json({
      success: true,
      charts: chartData,
      analytics: {
        // Include key metrics for chart context
        sessionMetrics: analytics.sessionMetrics,
        messageMetrics: analytics.messageMetrics,
        timeRange: analytics.timeRange,
        generatedAt: analytics.generatedAt,
      },
      timeRange,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics Charts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}