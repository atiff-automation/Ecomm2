/**
 * Telegram Health Status API - Malaysian E-commerce Platform
 * Get real-time connection health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramService } from '@/lib/telegram/telegram-service';

/**
 * GET /api/admin/telegram/health - Get Telegram connection health
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

    const healthStatus = telegramService.getHealthStatus();
    const isConfigured = await telegramService.isConfigured();

    // If no health check has run yet but system is configured, assume healthy
    const effectivelyHealthy = healthStatus.healthy || (isConfigured && !healthStatus.lastCheck);

    return NextResponse.json({
      configured: isConfigured,
      healthy: effectivelyHealthy,
      lastCheck: healthStatus.lastCheck,
      queuedMessages: healthStatus.queuedMessages,
      status: !isConfigured 
        ? 'not_configured' 
        : effectivelyHealthy 
          ? 'healthy' 
          : 'unhealthy',
    });

  } catch (error) {
    console.error('Error checking Telegram health:', error);
    return NextResponse.json(
      { message: 'Failed to check Telegram health' },
      { status: 500 }
    );
  }
}