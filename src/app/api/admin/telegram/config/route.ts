/**
 * Telegram Configuration API Routes
 * Handles CRUD operations for Telegram configuration
 * Implements secure configuration management with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { TelegramConfiguration } from '@/lib/types/telegram-config.types';
import { z } from 'zod';

const configSchema = z.object({
  botToken: z.string().optional(),
  ordersChatId: z.string().optional(),
  inventoryChatId: z.string().optional(),
  ordersEnabled: z.boolean().optional(),
  inventoryEnabled: z.boolean().optional(),
  dailySummaryEnabled: z.boolean().optional(),
  retryAttempts: z.number().min(1).max(10).optional(),
  timeoutMs: z.number().min(5000).max(120000).optional(),
  healthCheckInterval: z.number().min(60000).max(3600000).optional(),
});

/**
 * POST /api/admin/telegram/config
 * Create or update Telegram configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const config = configSchema.parse(body);

    // Update configuration
    await telegramConfigService.updateConfiguration(config, session.user.email);

    // Get updated configuration for response (sanitized)
    const updatedConfig = await telegramConfigService.getFullConfiguration();
    const sanitizedConfig = {
      ...updatedConfig,
      botToken: updatedConfig.botToken ? '***CONFIGURED***' : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: sanitizedConfig,
    });

  } catch (error) {
    console.error('Failed to update Telegram configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration data',
          details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/telegram/config
 * Retrieve current Telegram configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const config = await telegramConfigService.getFullConfiguration();
    
    // Sanitize sensitive data for response
    const sanitizedConfig = {
      ...config,
      botToken: config.botToken ? '***CONFIGURED***' : null,
    };

    return NextResponse.json({ 
      success: true, 
      data: sanitizedConfig 
    });

  } catch (error) {
    console.error('Failed to get Telegram configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/telegram/config
 * Full configuration replacement
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const config = configSchema.parse(body);

    // Full validation for replacement
    if (!config.botToken) {
      return NextResponse.json(
        { error: 'Bot token is required for full configuration' },
        { status: 400 }
      );
    }

    // Reset and configure
    await telegramConfigService.resetConfiguration(session.user.email);
    await telegramConfigService.updateConfiguration(config, session.user.email);

    // Get final configuration for response (sanitized)
    const finalConfig = await telegramConfigService.getFullConfiguration();
    const sanitizedConfig = {
      ...finalConfig,
      botToken: finalConfig.botToken ? '***CONFIGURED***' : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration replaced successfully',
      data: sanitizedConfig,
    });

  } catch (error) {
    console.error('Failed to replace Telegram configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration data',
          details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to replace configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/telegram/config
 * Reset configuration to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin authorization check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await telegramConfigService.resetConfiguration(session.user.email);

    return NextResponse.json({
      success: true,
      message: 'Configuration reset to defaults successfully',
    });

  } catch (error) {
    console.error('Failed to reset Telegram configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
