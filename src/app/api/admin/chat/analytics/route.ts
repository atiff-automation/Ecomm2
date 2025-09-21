import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { ChatAnalyticsEngine, AnalyticsPerformanceMonitor } from '@/lib/analytics/chat-analytics';

/**
 * Analytics API Endpoint
 * Centralized analytics data retrieval following DRY principles
 * @CLAUDE.md - Systematic approach with performance optimization
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

    // Get comprehensive analytics data using centralized engine
    const analytics = await AnalyticsPerformanceMonitor.measureAnalyticsQuery(
      'comprehensive-analytics',
      () => ChatAnalyticsEngine.getAnalyticsData(timeRange)
    );

    return NextResponse.json({
      success: true,
      analytics,
      timeRange,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}