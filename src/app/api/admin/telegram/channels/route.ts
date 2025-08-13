/**
 * Telegram Channels Configuration API - Malaysian E-commerce Platform
 * Get the status of each notification channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramService } from '@/lib/telegram/telegram-service';

/**
 * GET /api/admin/telegram/channels - Get channel configuration status
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

    // Check configuration for each channel
    const ordersConfigured = await telegramService.isOrdersChannelConfigured();
    const inventoryConfigured =
      await telegramService.isInventoryChannelConfigured();

    const channels = [
      {
        id: 'orders',
        name: 'Order Notifications',
        description: 'New orders and payment confirmations',
        configured: ordersConfigured,
        enabled: ordersConfigured, // If configured, assume enabled
        envVar: 'TELEGRAM_ORDERS_CHAT_ID',
      },
      {
        id: 'inventory',
        name: 'Inventory Alerts',
        description: 'Low stock and reorder notifications',
        configured: inventoryConfigured,
        enabled: inventoryConfigured, // If configured, assume enabled
        envVar: 'TELEGRAM_INVENTORY_CHAT_ID',
      },
    ];

    return NextResponse.json({
      channels,
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    });
  } catch (error) {
    console.error('Error fetching channel status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch channel status' },
      { status: 500 }
    );
  }
}
