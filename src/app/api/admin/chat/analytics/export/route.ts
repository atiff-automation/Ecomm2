import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { ChatAnalyticsEngine, AnalyticsPerformanceMonitor } from '@/lib/analytics/chat-analytics';
import { ReportGenerator } from '@/lib/analytics/report-generators';
import { ReportConfig } from '@/types/chat';

/**
 * Analytics Export API Endpoint
 * Export analytics reports in various formats
 * @CLAUDE.md - Systematic approach with comprehensive export functionality
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const config: ReportConfig = {
      title: body.title || 'Chat Analytics Report',
      subtitle: body.subtitle,
      timeRange: body.timeRange || '24h',
      includeCharts: body.includeCharts !== false,
      includeSummary: body.includeSummary !== false,
      includeDetails: body.includeDetails !== false,
      format: body.format || 'pdf',
      branding: body.branding,
    };

    // Validate export format
    const validFormats = ['json', 'csv', 'pdf'];
    if (!validFormats.includes(config.format)) {
      return NextResponse.json(
        { error: `Invalid export format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Get analytics data
    const analytics = await AnalyticsPerformanceMonitor.measureAnalyticsQuery(
      'analytics-for-export',
      () => ChatAnalyticsEngine.getAnalyticsData(config.timeRange)
    );

    // Generate report
    const exportData = await AnalyticsPerformanceMonitor.measureAnalyticsQuery(
      'report-generation',
      () => ReportGenerator.generateReport(analytics, config)
    );

    // Set appropriate headers for file download
    const headers = new Headers({
      'Content-Type': exportData.mimeType,
      'Content-Disposition': `attachment; filename="${exportData.filename}"`,
      'Content-Length': exportData.size.toString(),
    });

    // Return file content
    return new NextResponse(exportData.content, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Analytics Export API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate export',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get export preview
 * Preview export content before downloading
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
    const format = searchParams.get('format') || 'json';

    // Get analytics data for preview
    const analytics = await AnalyticsPerformanceMonitor.measureAnalyticsQuery(
      'analytics-for-preview',
      () => ChatAnalyticsEngine.getAnalyticsData(timeRange)
    );

    // Generate quick summary for preview
    const summary = ReportGenerator.generateQuickSummary(analytics);

    return NextResponse.json({
      success: true,
      preview: {
        summary,
        recordCount: analytics.sessionMetrics.totalSessions,
        timeRange: analytics.timeRange,
        estimatedSize: `${Math.round(analytics.sessionMetrics.totalSessions * 0.5)}KB`, // Rough estimate
        format,
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics Export Preview API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export preview' },
      { status: 500 }
    );
  }
}