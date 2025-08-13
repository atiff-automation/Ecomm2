/**
 * Telegram Health Check API - Malaysian E-commerce Platform
 * Provides health status and ensures Telegram service is running
 */

import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram/telegram-service';
import { ensureServerInitialized } from '@/lib/server/init';

/**
 * GET /api/health/telegram - Get Telegram service health status
 */
export async function GET() {
  try {
    // Ensure server services are initialized
    await ensureServerInitialized();

    // Get health status
    const healthStatus = telegramService.getHealthStatus();
    const isConfigured = await telegramService.isConfigured();
    const ordersChannel = await telegramService.isOrdersChannelConfigured();
    const inventoryChannel =
      await telegramService.isInventoryChannelConfigured();

    return NextResponse.json({
      status: 'ok',
      telegram: {
        configured: isConfigured,
        healthy: healthStatus.healthy,
        lastHealthCheck: healthStatus.lastCheck,
        queuedMessages: healthStatus.queuedMessages,
        channels: {
          orders: ordersChannel,
          inventory: inventoryChannel,
        },
      },
      message: isConfigured
        ? 'Telegram service is running'
        : 'Telegram service not configured',
    });
  } catch (error) {
    console.error('Error checking Telegram health:', error);
    return NextResponse.json(
      {
        status: 'error',
        telegram: {
          configured: false,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        message: 'Failed to check Telegram service health',
      },
      { status: 500 }
    );
  }
}
