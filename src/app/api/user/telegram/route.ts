/**
 * User Telegram Configuration API
 * MULTI-TENANT endpoint for user-specific Telegram management
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';
import { z } from 'zod';

// VALIDATION: Schema for Telegram configuration updates
const TelegramConfigSchema = z.object({
  // Bot Configuration
  botToken: z.string().optional(),
  botUsername: z.string().optional(),
  
  // Channel Settings
  ordersEnabled: z.boolean().default(false),
  ordersChatId: z.string().optional(),
  inventoryEnabled: z.boolean().default(false),
  inventoryChatId: z.string().optional(),
  
  // Notification Preferences
  dailySummaryEnabled: z.boolean().default(false),
  summaryTime: z.string().optional(), // "09:00" format
  timezone: z.string().default('Asia/Kuala_Lumpur'),
});

/**
 * GET /api/user/telegram - Get user's Telegram configuration
 * SYSTEMATIC: User-scoped configuration with fallback
 */
export async function GET() {
  try {
    // AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // CENTRALIZED: Load user configuration via service
    const config = await telegramConfigService.getUserConfig(userId);
    
    if (!config) {
      // FALLBACK: Return default configuration structure
      return NextResponse.json({
        userId,
        configured: false,
        config: {
          botToken: null,
          botUsername: null,
          ordersEnabled: false,
          ordersChatId: null,
          inventoryEnabled: false,
          inventoryChatId: null,
          dailySummaryEnabled: false,
          summaryTime: null,
          timezone: 'Asia/Kuala_Lumpur',
          verified: false,
          healthStatus: 'UNKNOWN'
        }
      });
    }

    // SECURITY: Return configuration without exposing sensitive data fully
    return NextResponse.json({
      userId,
      configured: !!config.botToken,
      config: {
        botToken: config.botToken ? '***masked***' : null,
        botUsername: config.botUsername,
        ordersEnabled: config.ordersEnabled,
        ordersChatId: config.ordersChatId,
        inventoryEnabled: config.inventoryEnabled,
        inventoryChatId: config.inventoryChatId,
        dailySummaryEnabled: config.dailySummaryEnabled,
        summaryTime: config.summaryTime,
        timezone: config.timezone,
        verified: config.verified,
        healthStatus: config.healthStatus,
        lastHealthCheck: config.lastHealthCheck,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user Telegram config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/telegram - Update user's Telegram configuration  
 * SYSTEMATIC: User-scoped configuration management
 */
export async function POST(request: NextRequest) {
  try {
    // AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // VALIDATION: Parse and validate request body
    const body = await request.json();
    const validatedData = TelegramConfigSchema.parse(body);

    // CENTRALIZED: Update configuration via service
    const updatedConfig = await telegramConfigService.updateUserConfig(userId, validatedData);
    
    // CACHE INVALIDATION: Clear service cache for user
    TelegramServiceFactory.clearUserService(userId);

    // SUCCESS: Return updated configuration (masked)
    return NextResponse.json({
      success: true,
      message: 'Telegram configuration updated successfully',
      config: {
        botToken: updatedConfig.botToken ? '***masked***' : null,
        botUsername: updatedConfig.botUsername,
        ordersEnabled: updatedConfig.ordersEnabled,
        ordersChatId: updatedConfig.ordersChatId,
        inventoryEnabled: updatedConfig.inventoryEnabled,
        inventoryChatId: updatedConfig.inventoryChatId,
        dailySummaryEnabled: updatedConfig.dailySummaryEnabled,
        summaryTime: updatedConfig.summaryTime,
        timezone: updatedConfig.timezone,
        verified: updatedConfig.verified,
        healthStatus: updatedConfig.healthStatus,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('Error updating user Telegram config:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/telegram - Delete user's Telegram configuration
 * SYSTEMATIC: User-scoped configuration removal
 */
export async function DELETE() {
  try {
    // AUTHENTICATION: Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // CENTRALIZED: Delete configuration via service
    const deleted = await telegramConfigService.deleteUserConfig(userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Telegram configuration not found' },
        { status: 404 }
      );
    }

    // CACHE INVALIDATION: Clear service cache for user
    TelegramServiceFactory.clearUserService(userId);

    // SUCCESS: Confirmation response
    return NextResponse.json({
      success: true,
      message: 'Telegram configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user Telegram config:', error);
    return NextResponse.json(
      { error: 'Failed to delete Telegram configuration' },
      { status: 500 }
    );
  }
}