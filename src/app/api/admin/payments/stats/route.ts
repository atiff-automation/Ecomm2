/**

export const dynamic = 'force-dynamic';

 * Admin Payment Statistics API
 * Provides centralized payment metrics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { getServerSession } from 'next-auth/next';
import { PaymentMetricsService } from '@/lib/services/payment-metrics.service';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/payments/stats
 * Returns comprehensive payment statistics and metrics
 * 
 * Query Parameters:
 * - startDate: ISO date string for start of period
 * - endDate: ISO date string for end of period
 * - includeTrends: boolean to include trend data
 * - includeMethodBreakdown: boolean to include payment method stats
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - Admin/Staff only
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPERADMIN &&
      session.user.role !== UserRole.STAFF
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const includeTrends = searchParams.get('includeTrends') === 'true';
    const includeMethodBreakdown = searchParams.get('includeMethodBreakdown') === 'true';

    // Validate and parse dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use ISO date string.' },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use ISO date string.' },
          { status: 400 }
        );
      }
    }

    // Execute all required data fetches in parallel
    const promises = [
      PaymentMetricsService.getPaymentMetrics(startDate, endDate),
    ];

    if (includeTrends) {
      promises.push(PaymentMetricsService.getPaymentTrends('monthly', 6));
    }

    if (includeMethodBreakdown) {
      promises.push(PaymentMetricsService.getPaymentMethodStats(startDate, endDate));
    }

    const results = await Promise.all(promises);
    
    // Structure response
    const response: any = {
      metrics: results[0],
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
        isAllTime: !startDate && !endDate,
      },
      generatedAt: new Date().toISOString(),
    };

    let resultIndex = 1;
    if (includeTrends) {
      response.trends = results[resultIndex++];
    }

    if (includeMethodBreakdown) {
      response.paymentMethods = results[resultIndex++];
    }

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Payment stats API error:', error);
    
    // Determine if this is a database connection issue
    const isDatabaseError = error instanceof Error && 
      (error.message.includes('database') || error.message.includes('connection'));

    return NextResponse.json(
      {
        error: 'Failed to fetch payment statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        type: isDatabaseError ? 'database_error' : 'server_error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments/stats/refresh
 * Triggers cache refresh for payment statistics (if caching is implemented)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPERADMIN
    ) {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    // Force refresh of current metrics
    const refreshedMetrics = await PaymentMetricsService.getPaymentMetrics();
    
    return NextResponse.json({
      success: true,
      message: 'Payment statistics refreshed successfully',
      data: {
        metrics: refreshedMetrics,
        refreshedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Payment stats refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh payment statistics' },
      { status: 500 }
    );
  }
}