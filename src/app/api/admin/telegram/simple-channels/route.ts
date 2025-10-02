/**

export const dynamic = 'force-dynamic';

 * Simplified Telegram Channels Status API - Malaysian E-commerce Platform
 * CENTRALIZED channel status for admin telegram configuration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';
import { adminTelegramConfigService } from '@/lib/services/admin-telegram-config.service';

/**
 * GET /api/admin/telegram/simple-channels - Get simplified channel status
 * SINGLE SOURCE OF TRUTH: Uses admin configuration only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // SINGLE SOURCE OF TRUTH: Check admin configuration
    const ordersConfigured = await simplifiedTelegramService.isOrdersChannelConfigured();
    const inventoryConfigured = await simplifiedTelegramService.isInventoryChannelConfigured();
    const chatManagementConfigured = await simplifiedTelegramService.isChatManagementChannelConfigured();
    const systemAlertsConfigured = await simplifiedTelegramService.isSystemAlertsChannelConfigured();
    const config = await adminTelegramConfigService.getActiveConfig();

    // NO HARDCODE: Dynamic channel definitions
    const channels = [
      {
        id: 'orders',
        name: 'Order Notifications',
        description: 'New orders and payment confirmations',
        configured: ordersConfigured,
        enabled: ordersConfigured && (config?.ordersEnabled ?? true),
        chatId: config?.ordersChatId || null,
      },
      {
        id: 'inventory',
        name: 'Inventory Alerts',
        description: 'Low stock and reorder notifications',
        configured: inventoryConfigured,
        enabled: inventoryConfigured && (config?.inventoryEnabled ?? true),
        chatId: config?.inventoryChatId || null,
      },
      {
        id: 'chat-management',
        name: 'Chat Management',
        description: 'Chat backups, cleanup, and data management notifications',
        configured: chatManagementConfigured,
        enabled: chatManagementConfigured && (config?.chatManagementEnabled ?? true),
        chatId: config?.chatManagementChatId || null,
      },
      {
        id: 'system-alerts',
        name: 'System Alerts',
        description: 'System health, job failures, and critical alerts',
        configured: systemAlertsConfigured,
        enabled: systemAlertsConfigured && (config?.systemAlertsEnabled ?? true),
        chatId: config?.systemAlertsChatId || null,
      },
    ];

    // DRY: Bot configuration status
    const botConfigured = !!(config?.botToken);

    return NextResponse.json({
      channels,
      botConfigured,
      hasActiveConfig: !!config,
      configId: config?.id || null
    });
  } catch (error) {
    console.error('Error fetching simplified channel status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch channel status' },
      { status: 500 }
    );
  }
}