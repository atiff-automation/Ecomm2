/**

export const dynamic = 'force-dynamic';

 * Revenue Analytics API Endpoint
 * GET /api/admin/reports/sales/revenue
 * Returns detailed revenue analytics with trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { salesAnalyticsService } from '@/lib/services/sales-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication and authorization check
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Default to last 30 days if no dates provided
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    // Validate date range
    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get revenue analytics data
    const revenueAnalytics = await salesAnalyticsService.getRevenueAnalytics(
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: revenueAnalytics,
    });
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
