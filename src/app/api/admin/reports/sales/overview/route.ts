/**

export const dynamic = 'force-dynamic';

 * Sales Overview API Endpoint
 * GET /api/admin/reports/sales/overview
 * Returns comprehensive sales overview data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { salesAnalyticsService } from '@/lib/services/sales-analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Authentication and authorization check
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
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

    // Get sales overview data
    const overview = await salesAnalyticsService.getSalesOverview(startDate, endDate);

    return NextResponse.json({ 
      success: true, 
      data: overview 
    });
    
  } catch (error) {
    console.error('🚨 Sales overview API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    return NextResponse.json(
      { 
        message: 'Failed to fetch sales overview',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}