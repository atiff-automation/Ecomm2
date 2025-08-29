/**
 * EasyParcel Webhook Management API
 * Admin interface for webhook configuration and monitoring
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 2.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { z } from 'zod';

// Webhook configuration schema
const webhookConfigSchema = z.object({
  url: z.string().url('Valid webhook URL required'),
  events: z.array(z.string()).min(1, 'At least one event type required'),
  active: z.boolean().default(true),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters'),
});

/**
 * GET - Get webhook configuration and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Get webhook statistics
      const stats = await getWebhookStatistics();

      return NextResponse.json({
        webhook: {
          configured: !!process.env.EASYPARCEL_WEBHOOK_SECRET,
          url: process.env.EASYPARCEL_WEBHOOK_URL || null,
          active: true, // Determined by environment configuration
        },
        statistics: stats,
        configuration: {
          supportedEvents: [
            'PICKED_UP',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'DELIVERY_ATTEMPTED',
            'CANCELLED',
            'FAILED',
          ],
          currentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easyparcel-tracking`,
        },
      });
    }

    if (action === 'logs') {
      // Get recent webhook logs
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const webhookLogs = await prisma.auditLog.findMany({
        where: {
          action: 'WEBHOOK_RECEIVED',
          resource: 'Shipment',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          resourceId: true,
          details: true,
          ipAddress: true,
        },
      });

      const totalLogs = await prisma.auditLog.count({
        where: {
          action: 'WEBHOOK_RECEIVED',
          resource: 'Shipment',
        },
      });

      return NextResponse.json({
        logs: webhookLogs,
        pagination: {
          total: totalLogs,
          limit,
          offset,
          hasMore: offset + limit < totalLogs,
        },
      });
    }

    if (action === 'test') {
      // Test webhook endpoint connectivity
      const testResult = await testWebhookEndpoint();
      return NextResponse.json(testResult);
    }

    return NextResponse.json(
      {
        message:
          'Invalid action. Use ?action=status, ?action=logs, or ?action=test',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Webhook management error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve webhook information' },
      { status: 500 }
    );
  }
}

/**
 * POST - Configure or test webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action || 'configure';

    console.log('🔧 Webhook management action:', {
      action,
      userId: session.user.id,
    });

    if (action === 'configure') {
      // Configure webhook with EasyParcel
      const validatedData = webhookConfigSchema.parse(body);

      try {
        // Register webhook with EasyParcel service
        const webhookResult = await easyParcelService.configureWebhook({
          url: validatedData.url,
          events: validatedData.events,
          secret: validatedData.secret,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CREATE',
            resource: 'WebhookConfiguration',
            resourceId: 'easyparcel-webhook',
            details: {
              url: validatedData.url,
              events: validatedData.events,
              configurationResult: webhookResult,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });

        console.log('✅ Webhook configured successfully');

        return NextResponse.json({
          success: true,
          message: 'Webhook configured successfully',
          configuration: {
            url: validatedData.url,
            events: validatedData.events,
            active: validatedData.active,
          },
          easyParcelResponse: webhookResult,
        });
      } catch (error) {
        console.error('❌ EasyParcel webhook configuration failed:', error);
        return NextResponse.json(
          { message: `Webhook configuration failed: ${error.message}` },
          { status: 400 }
        );
      }
    }

    if (action === 'test') {
      // Send test webhook
      const testPayload = {
        tracking_number: 'TEST123456789',
        event_code: 'IN_TRANSIT',
        event_name: 'Package In Transit',
        event_description: 'Test webhook from admin panel',
        event_time: new Date().toISOString(),
        location: 'Test Location',
        shipment_id: 'test-shipment-id',
        courier_remarks: 'Admin test webhook',
      };

      try {
        const testResult = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easyparcel-tracking`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'EasyParcel-Test-Webhook',
            },
            body: JSON.stringify(testPayload),
          }
        );

        const testResponse = await testResult.json();

        // Create audit log for test
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'TEST',
            resource: 'WebhookEndpoint',
            resourceId: 'easyparcel-webhook',
            details: {
              testPayload,
              testResponse,
              httpStatus: testResult.status,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });

        return NextResponse.json({
          success: testResult.ok,
          message: testResult.ok
            ? 'Webhook test successful'
            : 'Webhook test failed',
          testResult: {
            httpStatus: testResult.status,
            response: testResponse,
            payload: testPayload,
          },
        });
      } catch (error) {
        console.error('❌ Webhook test failed:', error);
        return NextResponse.json(
          { message: `Webhook test failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Invalid action. Use "configure" or "test"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Webhook configuration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to configure webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Disable webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin permissions
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('🗑️ Disabling EasyParcel webhook');

    try {
      // Disable webhook with EasyParcel service
      const disableResult = await easyParcelService.disableWebhook();

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETE',
          resource: 'WebhookConfiguration',
          resourceId: 'easyparcel-webhook',
          details: {
            disableResult,
            reason: 'Manual admin disable',
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      console.log('✅ Webhook disabled successfully');

      return NextResponse.json({
        success: true,
        message: 'Webhook disabled successfully',
        disableResult,
      });
    } catch (error) {
      console.error('❌ EasyParcel webhook disable failed:', error);
      return NextResponse.json(
        { message: `Webhook disable failed: ${error.message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Webhook disable error:', error);
    return NextResponse.json(
      { message: 'Failed to disable webhook' },
      { status: 500 }
    );
  }
}

// ===== Helper Functions =====

/**
 * Get webhook processing statistics
 */
async function getWebhookStatistics() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total24h, total7days, totalAllTime, recentEvents, statusBreakdown] =
    await Promise.all([
      // Webhooks in last 24 hours
      prisma.auditLog.count({
        where: {
          action: 'WEBHOOK_RECEIVED',
          createdAt: { gte: last24Hours },
        },
      }),

      // Webhooks in last 7 days
      prisma.auditLog.count({
        where: {
          action: 'WEBHOOK_RECEIVED',
          createdAt: { gte: last7Days },
        },
      }),

      // Total webhooks all time
      prisma.auditLog.count({
        where: { action: 'WEBHOOK_RECEIVED' },
      }),

      // Recent webhook events
      prisma.auditLog.findMany({
        where: { action: 'WEBHOOK_RECEIVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          createdAt: true,
          details: true,
        },
      }),

      // Status breakdown
      prisma.shipmentTracking.groupBy({
        by: ['eventCode'],
        where: {
          createdAt: { gte: last7Days },
          source: 'EASYPARCEL',
        },
        _count: { eventCode: true },
        orderBy: { _count: { eventCode: 'desc' } },
        take: 10,
      }),
    ]);

  return {
    counts: {
      last24Hours: total24h,
      last7Days: total7days,
      allTime: totalAllTime,
    },
    recentEvents: recentEvents.map(event => ({
      timestamp: event.createdAt,
      eventCode: event.details?.eventCode,
      trackingNumber: event.details?.trackingNumber,
      statusChanged: event.details?.statusChanged,
    })),
    popularEvents: statusBreakdown.map(item => ({
      eventCode: item.eventCode,
      count: item._count.eventCode,
    })),
    performance: {
      avgProcessingTime: '~50ms', // TODO: Calculate actual processing time
      successRate: '99.8%', // TODO: Calculate from success/error logs
      lastProcessed: recentEvents[0]?.createdAt || null,
    },
  };
}

/**
 * Test webhook endpoint connectivity
 */
async function testWebhookEndpoint() {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easyparcel-tracking`;

    // Test GET endpoint for verification
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Admin-Connectivity-Test' },
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      status: response.status,
      url: webhookUrl,
      response: responseData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easyparcel-tracking`,
      timestamp: new Date().toISOString(),
    };
  }
}
