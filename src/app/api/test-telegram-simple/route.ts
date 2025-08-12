/**
 * Simple Telegram Test (No Auth Required)
 */

import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/telegram/telegram-service';

export async function GET() {
  try {
    // Test basic message
    await telegramService.sendMessage({
      message: '🧪 **TEST MESSAGE**\n\nThis is a simple test to verify Telegram is working.\n\nTime: ' + new Date().toLocaleString('en-MY'),
      channel: 'orders'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test Telegram message sent successfully!' 
    });

  } catch (error) {
    console.error('❌ Telegram test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Test order notification format
    await telegramService.sendNewOrderNotification({
      orderNumber: 'TEST-ORDER-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerName: 'Test Customer',
      total: 125.50,
      items: [
        {
          name: 'Test Product 1',
          quantity: 2,
          price: 45.00,
        },
        {
          name: 'Test Product 2', 
          quantity: 1,
          price: 35.50,
        },
      ],
      paymentMethod: 'TEST',
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test order notification sent successfully!' 
    });

  } catch (error) {
    console.error('❌ Telegram order test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}