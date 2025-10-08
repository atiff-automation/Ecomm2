/**
 * Tracking Update Cron Job
 *
 * GET /api/cron/update-tracking
 *
 * Automatically updates tracking information for all active shipments.
 * Designed to run every 4 hours via Railway Cron.
 *
 * Railway Cron Configuration:
 * Schedule: "0 star-slash-4 * * *" (every 4 hours - replace star-slash with asterisk-slash)
 * Command: curl https://your-domain.com/api/cron/update-tracking
 *
 * @route GET /api/cron/update-tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShippingSettings } from '@/lib/shipping/shipping-settings';
import {
  createEasyParcelService,
  EasyParcelError,
} from '@/lib/shipping/easyparcel-service';

/**
 * Map EasyParcel tracking status to order status
 */
function mapTrackingStatusToOrderStatus(trackingStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'READY_TO_SHIP',
    booked: 'READY_TO_SHIP',
    picked_up: 'IN_TRANSIT',
    in_transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    exception: 'IN_TRANSIT',
    cancelled: 'CANCELLED',
  };

  return statusMap[trackingStatus.toLowerCase()] || 'IN_TRANSIT';
}

/**
 * GET - Update tracking for all active shipments
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Cron] Starting tracking update job...');

    // Step 1: Get shipping settings
    const settings = await getShippingSettings();

    if (!settings) {
      console.error('[Cron] Shipping settings not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'Shipping settings not configured',
          stats: { processed: 0, updated: 0, failed: 0, skipped: 0 },
        },
        { status: 400 }
      );
    }

    // Check global auto-update setting
    if (!settings.autoUpdateOrderStatus) {
      console.log(
        '[Cron] Auto-update is disabled globally in shipping settings'
      );
      return NextResponse.json({
        success: true,
        message: 'Auto-update is disabled. Skipping tracking update.',
        stats: {
          processed: 0,
          updated: 0,
          failed: 0,
          skipped: 0,
          duration: Date.now() - startTime,
        },
      });
    }

    // Step 2: Find all orders with tracking numbers that are not delivered or cancelled
    // Only update orders where autoStatusUpdate is enabled (default: true)
    const activeOrders = await prisma.order.findMany({
      where: {
        trackingNumber: { not: null },
        status: {
          notIn: ['DELIVERED', 'CANCELLED', 'PENDING'],
        },
        autoStatusUpdate: true, // NEW: Respect per-order auto-update flag
      },
      select: {
        id: true,
        orderNumber: true,
        trackingNumber: true,
        status: true,
        courierName: true,
        shippedAt: true,
        autoStatusUpdate: true,
      },
      orderBy: {
        updatedAt: 'asc', // Update oldest first
      },
    });

    console.log(`[Cron] Found ${activeOrders.length} active orders to update`);

    if (activeOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active shipments to update',
        stats: {
          processed: 0,
          updated: 0,
          failed: 0,
          skipped: 0,
          duration: Date.now() - startTime,
        },
      });
    }

    // Step 3: Initialize EasyParcel service
    const easyParcelService = createEasyParcelService(settings);

    // Step 4: Update tracking for each order
    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ orderNumber: string; error: string }>,
    };

    for (const order of activeOrders) {
      if (!order.trackingNumber) {
        results.skipped++;
        continue;
      }

      try {
        results.processed++;

        console.log(`[Cron] Updating tracking for order ${order.orderNumber}`);

        // Fetch tracking data
        const trackingResponse = await easyParcelService.getTracking(
          order.trackingNumber
        );
        const trackingData = trackingResponse.data;

        // Determine new status
        const newStatus = mapTrackingStatusToOrderStatus(
          trackingData.current_status || ''
        );

        // Update order if status changed
        if (newStatus !== order.status) {
          console.log(
            `[Cron] Status change detected for ${order.orderNumber}: ${order.status} → ${newStatus}`
          );

          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: newStatus,
              // Update delivery timestamp if delivered
              deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
              // Update shipped timestamp if in transit and not already set
              shippedAt:
                (newStatus === 'IN_TRANSIT' ||
                  newStatus === 'OUT_FOR_DELIVERY') &&
                !order.shippedAt
                  ? new Date()
                  : order.shippedAt,
              // Store latest tracking status description
              adminNotes: `Tracking updated: ${trackingData.status_description || trackingData.current_status}`,
            },
          });

          results.updated++;

          console.log(`[Cron] Successfully updated order ${order.orderNumber}`);

          // Note: No email notifications per spec (line 1245: "No email notifications (only on first tracking)")
          // Email #1: Order Confirmation (when PAID)
          // Email #2: Shipment Tracking (when READY_TO_SHIP)
          // No email for DELIVERED status
        } else {
          console.log(`[Cron] No status change for order ${order.orderNumber}`);
        }

        // Rate limiting: Add small delay between API calls (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;

        const errorMessage =
          error instanceof EasyParcelError ? error.message : 'Unknown error';

        console.error(
          `[Cron] Failed to update tracking for ${order.orderNumber}:`,
          errorMessage
        );

        results.errors.push({
          orderNumber: order.orderNumber,
          error: errorMessage,
        });

        // Continue processing other orders even if one fails
        continue;
      }
    }

    const duration = Date.now() - startTime;

    console.log('[Cron] Tracking update job completed:', {
      ...results,
      duration: `${duration}ms`,
    });

    // Return success with statistics
    return NextResponse.json({
      success: true,
      message: `Tracking update completed. Updated ${results.updated} of ${results.processed} orders.`,
      stats: {
        processed: results.processed,
        updated: results.updated,
        failed: results.failed,
        skipped: results.skipped,
        duration,
      },
      // Include errors only if there are any
      ...(results.errors.length > 0 && { errors: results.errors }),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron] Unexpected error in tracking update job:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Tracking update job failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          processed: 0,
          updated: 0,
          failed: 0,
          skipped: 0,
          duration,
        },
      },
      { status: 500 }
    );
  }
}
