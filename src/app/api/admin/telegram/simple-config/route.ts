/**
 * Simplified Admin Telegram Configuration API - Malaysian E-commerce Platform
 * CENTRALIZED admin telegram configuration management
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH | CENTRALIZED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { adminTelegramConfigService } from '@/lib/services/admin-telegram-config.service';

/**
 * GET /api/admin/telegram/simple-config - Get current admin telegram configuration
 * SINGLE SOURCE OF TRUTH: Returns active configuration only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // SINGLE SOURCE OF TRUTH: Get active configuration
    const config = await adminTelegramConfigService.getActiveConfig();
    
    if (!config) {
      return NextResponse.json({
        configured: false,
        config: null,
        message: 'No telegram configuration found'
      });
    }

    // NO HARDCODE: Return actual configuration (exclude sensitive bot token)
    return NextResponse.json({
      configured: true,
      config: {
        id: config.id,
        ordersChatId: config.ordersChatId,
        inventoryChatId: config.inventoryChatId,
        chatManagementChatId: config.chatManagementChatId,
        systemAlertsChatId: config.systemAlertsChatId,
        ordersEnabled: config.ordersEnabled,
        inventoryEnabled: config.inventoryEnabled,
        chatManagementEnabled: config.chatManagementEnabled,
        systemAlertsEnabled: config.systemAlertsEnabled,
        dailySummaryEnabled: config.dailySummaryEnabled,
        timezone: config.timezone,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Error getting admin telegram config:', error);
    return NextResponse.json(
      { message: 'Failed to get telegram configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telegram/simple-config - Create/Update admin telegram configuration
 * CENTRALIZED: Single endpoint for all config management
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

    const body = await request.json();

    // DRY: Validation schema (no hardcoded values)
    const {
      botToken,
      ordersChatId,
      inventoryChatId,
      chatManagementChatId,
      systemAlertsChatId,
      ordersEnabled = true,
      inventoryEnabled = true,
      chatManagementEnabled = true,
      systemAlertsEnabled = true,
      dailySummaryEnabled = true,
      timezone = 'Asia/Kuala_Lumpur'
    } = body;

    // NO HARDCODE: Validate required fields
    if (!botToken?.trim()) {
      return NextResponse.json(
        { message: 'Bot token is required' },
        { status: 400 }
      );
    }

    if (!ordersChatId?.trim()) {
      return NextResponse.json(
        { message: 'Orders chat ID is required' },
        { status: 400 }
      );
    }

    // CENTRALIZED: Save configuration using service (simplified - optional user tracking)
    const config = await adminTelegramConfigService.upsertConfig(
      {
        botToken: botToken.trim(),
        ordersChatId: ordersChatId.trim(),
        inventoryChatId: inventoryChatId?.trim() || undefined,
        chatManagementChatId: chatManagementChatId?.trim() || undefined,
        systemAlertsChatId: systemAlertsChatId?.trim() || undefined,
        ordersEnabled,
        inventoryEnabled,
        chatManagementEnabled,
        systemAlertsEnabled,
        dailySummaryEnabled,
        timezone
      },
      session.user?.id
    );

    return NextResponse.json({
      success: true,
      message: 'Telegram configuration saved successfully',
      config: {
        id: config.id,
        ordersChatId: config.ordersChatId,
        inventoryChatId: config.inventoryChatId,
        chatManagementChatId: config.chatManagementChatId,
        systemAlertsChatId: config.systemAlertsChatId,
        ordersEnabled: config.ordersEnabled,
        inventoryEnabled: config.inventoryEnabled,
        chatManagementEnabled: config.chatManagementEnabled,
        systemAlertsEnabled: config.systemAlertsEnabled,
        dailySummaryEnabled: config.dailySummaryEnabled,
        timezone: config.timezone,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Error saving admin telegram config:', error);
    return NextResponse.json(
      { message: 'Failed to save telegram configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/telegram/simple-config - Test configuration before saving
 * DRY: Validation logic reused from service
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { botToken, ordersChatId, inventoryChatId, chatManagementChatId, systemAlertsChatId } = body;

    // Check if configuration already exists to use saved bot token
    const existingConfig = await adminTelegramConfigService.getActiveConfig();
    
    // NO HARDCODE: Validate required fields
    if (!botToken?.trim() && !existingConfig?.botToken) {
      return NextResponse.json(
        { success: false, message: 'Bot token is required' },
        { status: 400 }
      );
    }

    if (!ordersChatId?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Orders chat ID is required' },
        { status: 400 }
      );
    }

    // DRY: Use service test method
    const testResult = await adminTelegramConfigService.testConfig({
      botToken: botToken?.trim() || existingConfig?.botToken || '',
      ordersChatId: ordersChatId.trim(),
      inventoryChatId: inventoryChatId?.trim(),
      chatManagementChatId: chatManagementChatId?.trim(),
      systemAlertsChatId: systemAlertsChatId?.trim()
    });

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing admin telegram config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to test configuration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/telegram/simple-config - Reload service configuration
 * CENTRALIZED: Force service to reload config after database changes
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Force service reload
    const { simplifiedTelegramService } = await import('@/lib/telegram/simplified-telegram-service');
    await simplifiedTelegramService.reloadConfiguration();

    return NextResponse.json({
      success: true,
      message: 'Service configuration reloaded successfully'
    });
  } catch (error) {
    console.error('Error reloading telegram service:', error);
    return NextResponse.json(
      { message: 'Failed to reload service configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/telegram/simple-config - Delete configuration
 * CENTRALIZED: Admin-only deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const configId = url.searchParams.get('id');

    if (!configId) {
      return NextResponse.json(
        { message: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // CENTRALIZED: Delete using service
    const success = await adminTelegramConfigService.deleteConfig(configId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Telegram configuration deleted successfully'
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to delete telegram configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting admin telegram config:', error);
    return NextResponse.json(
      { message: 'Failed to delete telegram configuration' },
      { status: 500 }
    );
  }
}