/**
 * Telegram Monitoring API - Malaysian E-commerce Platform
 * Provides real system metrics following @CLAUDE.md principles
 * Single source of truth for monitoring data - NO HARDCODED VALUES
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramMonitoringService } from '@/lib/monitoring/telegram-monitoring';

/**
 * GET /api/admin/telegram/monitoring - Get comprehensive Telegram system metrics
 * Following systematic architecture - centralized data source
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get real metrics from centralized service - Single source of truth
    const systemMetrics = await telegramMonitoringService.getSystemMetrics();
    const healthSummary = await telegramMonitoringService.getHealthSummary();

    // Return systematic, real data - NO hardcoded values
    return NextResponse.json({
      success: true,
      metrics: systemMetrics,
      healthSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching Telegram monitoring data:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch monitoring data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telegram/monitoring - Record manual metrics update
 * For testing or manual metric recording
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'record_message':
        telegramMonitoringService.recordMessageSent(
          data.success,
          data.responseTime
        );
        break;
      
      case 'health_check':
        telegramMonitoringService.updateHealthCheck();
        break;
      
      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} recorded successfully`,
    });
  } catch (error) {
    console.error('Error recording monitoring data:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to record monitoring data'
      },
      { status: 500 }
    );
  }
}