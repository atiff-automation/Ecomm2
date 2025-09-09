/**
 * Customer Insights API Endpoint
 * GET /api/admin/reports/sales/customers
 * Returns customer analytics and insights
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

    // Get customer insights data
    const insights = await salesAnalyticsService.getCustomerInsights(startDate, endDate);

    return NextResponse.json({ 
      success: true, 
      data: insights 
    });
    
  } catch (error) {
    console.error('Customer insights API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch customer insights' },
      { status: 500 }
    );
  }
}