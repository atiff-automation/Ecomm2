/**
 * Telegram Testing API Routes
 * Handles testing endpoints for Telegram configuration
 * Tests actual message delivery and system health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { z } from 'zod';

const testMessageSchema = z.object({
  type: z.enum(['connection', 'channel', 'integration', 'custom']),
  chatId: z.string().optional(),
  message: z.string().optional(),
});

/**
 * POST /api/admin/telegram/test
 * Test Telegram configuration with various test types
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
    const { type, chatId, message } = testMessageSchema.parse(body);

    switch (type) {
      case 'connection': {
        // Test basic bot connectivity
        const result = await telegramConfigService.testConfiguration();
        
        return NextResponse.json({
          success: true,
          type: 'connection',
          result,
        });
      }

      case 'channel': {
        if (!chatId) {
          return NextResponse.json(
            { error: 'Chat ID is required for channel testing' },
            { status: 400 }
          );
        }

        const config = await telegramConfigService.getFullConfiguration();
        if (!config.botToken) {
          return NextResponse.json({
            success: false,
            type: 'channel',
            error: 'Bot token not configured',
          });
        }

        // Test sending actual message to channel
        const testMessage = `🧪 Test Message from ${process.env.NEXT_PUBLIC_SITE_NAME}\n\n` +
          `This is a test message to verify Telegram integration.\n` +
          `Sent at: ${new Date().toLocaleString()}\n` +
          `From: Admin Panel`;

        try {
          const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: testMessage,
              parse_mode: 'HTML',
            }),
            signal: AbortSignal.timeout(config.timeoutMs || 30000),
          });

          const data = await response.json();

          if (!response.ok || !data.ok) {
            return NextResponse.json({
              success: false,
              type: 'channel',
              error: `Message sending failed: ${data.description || 'Unknown error'}`,
              details: data,
            });
          }

          return NextResponse.json({
            success: true,
            type: 'channel',
            result: {
              success: true,
              message: 'Test message sent successfully',
              timestamp: new Date(),
              details: {
                messageId: data.result.message_id,
                chatId: data.result.chat.id,
                chatTitle: data.result.chat.title || data.result.chat.first_name,
              },
            },
          });

        } catch (error) {
          return NextResponse.json({
            success: false,
            type: 'channel',
            error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      case 'integration': {
        // Test full integration including all configured channels
        const config = await telegramConfigService.getFullConfiguration();
        
        if (!config.botToken) {
          return NextResponse.json({
            success: false,
            type: 'integration',
            error: 'Bot token not configured',
          });
        }

        const results: any[] = [];
        
        // Test orders channel if configured
        if (config.ordersChatId && config.ordersEnabled) {
          try {
            const testMessage = `🛍️ Orders Channel Test\n\n` +
              `This is a test of order notifications.\n` +
              `Sent at: ${new Date().toLocaleString()}`;

            const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: config.ordersChatId,
                text: testMessage,
              }),
              signal: AbortSignal.timeout(config.timeoutMs || 30000),
            });

            const data = await response.json();
            results.push({
              channel: 'orders',
              success: response.ok && data.ok,
              error: !response.ok || !data.ok ? data.description : null,
              messageId: data.ok ? data.result.message_id : null,
            });
          } catch (error) {
            results.push({
              channel: 'orders',
              success: false,
              error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Test inventory channel if configured
        if (config.inventoryChatId && config.inventoryEnabled) {
          try {
            const testMessage = `📦 Inventory Channel Test\n\n` +
              `This is a test of inventory notifications.\n` +
              `Sent at: ${new Date().toLocaleString()}`;

            const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: config.inventoryChatId,
                text: testMessage,
              }),
              signal: AbortSignal.timeout(config.timeoutMs || 30000),
            });

            const data = await response.json();
            results.push({
              channel: 'inventory',
              success: response.ok && data.ok,
              error: !response.ok || !data.ok ? data.description : null,
              messageId: data.ok ? data.result.message_id : null,
            });
          } catch (error) {
            results.push({
              channel: 'inventory',
              success: false,
              error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        const successfulTests = results.filter(r => r.success).length;
        const totalTests = results.length;

        return NextResponse.json({
          success: true,
          type: 'integration',
          result: {
            success: successfulTests === totalTests && totalTests > 0,
            message: totalTests === 0 
              ? 'No channels configured for testing' 
              : `${successfulTests}/${totalTests} channels tested successfully`,
            timestamp: new Date(),
            details: {
              totalChannels: totalTests,
              successfulChannels: successfulTests,
              failedChannels: totalTests - successfulTests,
              results,
            },
          },
        });
      }

      case 'custom': {
        if (!chatId || !message) {
          return NextResponse.json(
            { error: 'Chat ID and message are required for custom testing' },
            { status: 400 }
          );
        }

        const config = await telegramConfigService.getFullConfiguration();
        if (!config.botToken) {
          return NextResponse.json({
            success: false,
            type: 'custom',
            error: 'Bot token not configured',
          });
        }

        try {
          const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
            }),
            signal: AbortSignal.timeout(config.timeoutMs || 30000),
          });

          const data = await response.json();

          if (!response.ok || !data.ok) {
            return NextResponse.json({
              success: false,
              type: 'custom',
              error: `Custom message sending failed: ${data.description || 'Unknown error'}`,
            });
          }

          return NextResponse.json({
            success: true,
            type: 'custom',
            result: {
              success: true,
              message: 'Custom message sent successfully',
              timestamp: new Date(),
              details: {
                messageId: data.result.message_id,
                chatId: data.result.chat.id,
              },
            },
          });

        } catch (error) {
          return NextResponse.json({
            success: false,
            type: 'custom',
            error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid test type. Supported types: connection, channel, integration, custom' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failed to test Telegram configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid test request',
          details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/telegram/test
 * Get system health status
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

    const healthStatus = await telegramConfigService.getHealthStatus();

    return NextResponse.json({
      success: true,
      data: healthStatus,
    });

  } catch (error) {
    console.error('Failed to get Telegram health status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve health status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
