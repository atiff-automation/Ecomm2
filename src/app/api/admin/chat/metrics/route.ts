import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import {
  ChatPerformanceUtils,
  PerformanceMonitor,
} from '@/lib/db/performance-utils';

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
    const timeRange = searchParams.get('range') || '24h';

    // Use optimized metrics calculation - centralized approach
    const metrics = await PerformanceMonitor.measureQueryTime(
      'chat-metrics-calculation',
      () => ChatPerformanceUtils.getOptimizedMetrics(timeRange)
    );

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
