/**
 * Telegram Test API - Malaysian E-commerce Platform
 * Allows admin to test Telegram notification functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramService } from '@/lib/telegram/telegram-service';

/**
 * POST /api/admin/telegram/test - Test Telegram connection
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

    // Test the Telegram connection
    const result = await telegramService.testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      configured: await telegramService.isConfigured(),
    });
  } catch (error) {
    console.error('Error testing Telegram connection:', error);
    return NextResponse.json(
      { message: 'Failed to test Telegram connection' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/telegram/test - Check Telegram configuration status
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

    return NextResponse.json({
      configured: await telegramService.isConfigured(),
      hasToken: await telegramService.isConfigured(), // Simplified - if configured, has both
      hasChatId: await telegramService.isConfigured(), // Simplified - if configured, has both
    });
  } catch (error) {
    console.error('Error checking Telegram configuration:', error);
    return NextResponse.json(
      { message: 'Failed to check Telegram configuration' },
      { status: 500 }
    );
  }
}
