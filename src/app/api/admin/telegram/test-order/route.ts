/**
 * Test Order Notification API - Malaysian E-commerce Platform
 * Create a test order notification to verify Telegram integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramService } from '@/lib/telegram/telegram-service';

/**
 * POST /api/admin/telegram/test-order - Send test order notification
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

    // Create a mock order notification
    const mockOrderData = {
      orderNumber: 'ORD-20250811-TEST',
      customerName: 'John Doe',
      total: 125.5,
      items: [
        {
          name: 'Wireless Bluetooth Headphones',
          quantity: 1,
          price: 89.9,
        },
        {
          name: 'Phone Case - Clear TPU',
          quantity: 2,
          price: 17.8,
        },
      ],
      paymentMethod: 'BILLPLZ',
      createdAt: new Date(),
    };

    // Send the test notification
    const success =
      await telegramService.sendNewOrderNotification(mockOrderData);

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
