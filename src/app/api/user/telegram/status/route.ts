/**
 * User Telegram Status API  
 * MULTI-TENANT endpoint for user-specific Telegram status monitoring
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';
import { telegramConfigService } from '@/lib/services/telegram-config.service';

/**
 * GET /api/user/telegram/status - Get user's Telegram status
 * SYSTEMATIC: User-scoped status monitoring with health data
 */
export async function GET() {
  try {
    // AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // CONFIGURATION CHECK: Verify user has configured service
    const isConfigured = await TelegramServiceFactory.isUserConfigured(userId);
    
    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        status: 'NOT_CONFIGURED',
        message: 'Telegram not configured for this user',
        health: {
          healthy: false,
          lastCheck: null,
          queuedMessages: 0
        },
        channels: {
          orders: { enabled: false, configured: false },
          inventory: { enabled: false, configured: false }
        }
      });
    }

    // CENTRALIZED: Get user-scoped service and configuration
    const telegramService = await TelegramServiceFactory.getServiceForUser(userId);
    const config = await telegramConfigService.getUserConfig(userId);
    
    // HEALTH STATUS: Get current service health
    const healthStatus = telegramService.getHealthStatus();
    
    // CHANNEL STATUS: Check individual channel configurations
    const ordersConfigured = await telegramService.isOrdersChannelConfigured();
    const inventoryConfigured = await telegramService.isInventoryChannelConfigured();

    // COMPREHENSIVE STATUS: Return complete status information
    return NextResponse.json({
      configured: true,
      status: healthStatus.healthy ? 'HEALTHY' : 'UNHEALTHY',
      message: healthStatus.healthy 
        ? 'Telegram service is operational' 
        : 'Telegram service has connectivity issues',
      health: {
        healthy: healthStatus.healthy,
        lastCheck: healthStatus.lastCheck,
        queuedMessages: healthStatus.queuedMessages
      },
      channels: {
        orders: {
          enabled: config?.ordersEnabled || false,
          configured: ordersConfigured,
          chatId: config?.ordersChatId ? '***masked***' : null
        },
        inventory: {
          enabled: config?.inventoryEnabled || false,
          configured: inventoryConfigured,
          chatId: config?.inventoryChatId ? '***masked***' : null
        }
      },
      notifications: {
        dailySummary: {
          enabled: config?.dailySummaryEnabled || false,
          time: config?.summaryTime || null,
          timezone: config?.timezone || 'Asia/Kuala_Lumpur'
        }
      },
      metadata: {
        verified: config?.verified || false,
        healthStatus: config?.healthStatus || 'UNKNOWN',
        lastHealthCheck: config?.lastHealthCheck || null,
        lastUpdated: config?.updatedAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching user Telegram status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Telegram status',
        configured: false,
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}