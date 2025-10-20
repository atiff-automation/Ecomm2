/**
 * Simplified Telegram Health Status API - Malaysian E-commerce Platform
 * CENTRALIZED health status for admin telegram configuration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';
import { adminTelegramConfigService } from '@/lib/services/admin-telegram-config.service';

/**
 * GET /api/admin/telegram/simple-health - Get simplified telegram health status
 * SINGLE SOURCE OF TRUTH: Uses simplified service only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // DRY: Get health status from simplified service
    const healthStatus = simplifiedTelegramService.getHealthStatus();
    const isConfigured = await simplifiedTelegramService.isConfigured();

    // NO HARDCODE: Dynamic status based on actual state
    const effectivelyHealthy =
      healthStatus.healthy || (isConfigured && !healthStatus.lastCheck);

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
    console.error('Error checking simplified telegram health:', error);
    return NextResponse.json(
      { message: 'Failed to check telegram health' },
      { status: 500 }
    );
  }
}
