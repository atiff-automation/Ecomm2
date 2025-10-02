/**

export const dynamic = 'force-dynamic';

 * Simplified Test Order Notification API - Malaysian E-commerce Platform
 * CENTRALIZED test functionality using simplified service
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

/**
 * POST /api/admin/telegram/simple-test-order - Send test order notification
 * DRY: Uses same notification format as production
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // NO HARDCODE: Dynamic test data with Malaysian context
    const now = new Date();
    const mockOrderData = {
      orderNumber: `ORD-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-TEST`,
      customerName: 'Ahmad Bin Ali',
      total: 185.50,
      items: [
        {
          name: 'Wireless Bluetooth Earbuds Pro',
          quantity: 1,
          price: 129.90,
        },
        {
          name: 'Phone Case - Clear TPU with Corner Protection',
          quantity: 2,
          price: 27.80,
        },
      ],
      paymentMethod: 'TOYYIBPAY',
      createdAt: now,
    };

    // DRY: Use simplified service
    const success = await simplifiedTelegramService.sendNewOrderNotification(mockOrderData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test order notification sent successfully!',
        data: mockOrderData,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test order notification',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test order notification:', error);
    return NextResponse.json(
      { message: 'Failed to send test order notification' },
      { status: 500 }
    );
  }
}