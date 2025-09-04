/**
 * User Telegram Test API
 * MULTI-TENANT endpoint for user-specific Telegram connection testing
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';

/**
 * POST /api/user/telegram/test - Test user's Telegram configuration
 * SYSTEMATIC: User-scoped connection testing
 */
export async function POST() {
  try {
    // AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // CENTRALIZED: Get user-scoped service
    const telegramService = await TelegramServiceFactory.getServiceForUser(userId);
    
    // VALIDATION: Check if user has configured service
    if (!(await telegramService.isConfigured())) {
      return NextResponse.json({
        success: false,
        message: 'Telegram not configured. Please configure your bot token and chat channels first.',
        configured: false
      }, { status: 400 });
    }

    // TESTING: Perform connection test
    const testResult = await telegramService.testConnection();
    
    // HEALTH CHECK: Update health status after test
    const healthStatus = telegramService.getHealthStatus();

    // RESPONSE: Return comprehensive test results
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      configured: true,
      health: {
        healthy: healthStatus.healthy,
        lastCheck: healthStatus.lastCheck,
        queuedMessages: healthStatus.queuedMessages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing user Telegram connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test Telegram connection',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}