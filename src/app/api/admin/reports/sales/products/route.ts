/**

export const dynamic = 'force-dynamic';

 * Product Performance API Endpoint
 * GET /api/admin/reports/sales/products
 * Returns product performance analytics
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

    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20;

    // Validate date range
    if (startDate >= endDate) {
      return NextResponse.json(
        { message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { message: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get product performance data
    const products = await salesAnalyticsService.getProductPerformance(
      startDate,
      endDate,
      limit
    );

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Product performance API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product performance' },
      { status: 500 }
    );
  }
}
