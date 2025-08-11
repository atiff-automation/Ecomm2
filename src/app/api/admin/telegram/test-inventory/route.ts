/**
 * Test Inventory Telegram Notification API - Malaysian E-commerce Platform
 * Test inventory alert notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramService } from '@/lib/telegram/telegram-service';

/**
 * POST /api/admin/telegram/test-inventory - Send test inventory alert
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

    // Check if inventory channel is configured
    const isConfigured = await telegramService.isInventoryChannelConfigured();
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        message: 'Inventory channel not configured. Please set TELEGRAM_INVENTORY_CHAT_ID in your environment variables.',
      });
    }

    // Send test low stock alert
    const success = await telegramService.sendLowStockAlert(
      'Test Product - Gaming Mouse',
      5, // Current stock
      'GM-001-TEST'
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test inventory alert sent successfully!',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test inventory alert. Please check your bot token and inventory chat ID.',
      });
    }

  } catch (error) {
    console.error('Error testing inventory notification:', error);
    return NextResponse.json(
      { message: 'Failed to test inventory notification' },
      { status: 500 }
    );
  }
}