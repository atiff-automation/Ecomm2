/**
 * Tracking API Route
 *
 * GET /api/shipping/track/[trackingNumber]
 *
 * Fetches real-time tracking information from EasyParcel API.
 * Updates order status based on tracking events.
 *
 * @route GET /api/shipping/track/[trackingNumber]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShippingSettings } from '@/lib/shipping/shipping-settings';
import { createEasyParcelService, EasyParcelError } from '@/lib/shipping/easyparcel-service';
import { SHIPPING_ERROR_CODES } from '@/lib/shipping/constants';

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
    exception: 'IN_TRANSIT', // Keep as IN_TRANSIT, admin can manually update if needed
    cancelled: 'CANCELLED',
  };

  return statusMap[trackingStatus.toLowerCase()] || 'IN_TRANSIT';
}

/**
 * GET - Fetch tracking information
 *
 * Steps:
 * 1. Find order by tracking number
 * 2. Get shipping settings
 * 3. Call EasyParcel tracking API
 * 4. Update order status based on tracking
 * 5. Return tracking data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const trackingNumber = params.trackingNumber;

    console.log(`[Tracking] Fetching tracking for: ${trackingNumber}`);

    // Step 1: Find order by tracking number
    const order = await prisma.order.findFirst({
      where: {
        trackingNumber: trackingNumber,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        airwayBillNumber: true,
        courierName: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found with this tracking number',
          code: SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Step 2: Get shipping settings
    const settings = await getShippingSettings();

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shipping settings not configured',
          code: SHIPPING_ERROR_CODES.NOT_CONFIGURED,
        },
        { status: 400 }
      );
    }

    // Step 3: Call EasyParcel tracking API
    const easyParcelService = createEasyParcelService(settings);

    let trackingResponse;
    try {
      trackingResponse = await easyParcelService.getTracking(trackingNumber);
    } catch (error) {
      console.error('[Tracking] EasyParcel API error:', error);

      // Handle specific error codes
      if (error instanceof EasyParcelError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            code: error.code,
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            },
          },
          { status: 400 }
        );
      }

      // Unknown error
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch tracking information',
          code: SHIPPING_ERROR_CODES.TRACKING_UPDATE_FAILED,
        },
        { status: 500 }
      );
    }

    // Step 4: Update order status based on tracking
    const trackingData = trackingResponse.data;
    const newStatus = mapTrackingStatusToOrderStatus(trackingData.current_status || '');

    // Only update if status has changed
    let updatedOrder = order;
    if (newStatus !== order.status) {
      console.log(`[Tracking] Updating order status: ${order.status} → ${newStatus}`);

      updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          // Update delivery timestamp if delivered
          deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
          // Update shipped timestamp if in transit and not already set
          shippedAt:
            (newStatus === 'IN_TRANSIT' || newStatus === 'OUT_FOR_DELIVERY') && !order.status
              ? new Date()
              : undefined,
        },
      });
    }

    console.log('[Tracking] Tracking fetched successfully:', {
      trackingNumber,
      currentStatus: trackingData.current_status,
      eventsCount: trackingData.events?.length || 0,
      orderStatus: updatedOrder.status,
    });

    // Step 5: Return tracking data
    return NextResponse.json({
      success: true,
      tracking: {
        trackingNumber: trackingData.tracking_number,
        courierName: trackingData.courier_name || order.courierName,
        currentStatus: trackingData.current_status,
        statusDescription: trackingData.status_description,
        estimatedDelivery: trackingData.estimated_delivery,
        actualDelivery: trackingData.actual_delivery,
        events: trackingData.events || [],
        lastUpdated: trackingData.last_updated || new Date().toISOString(),
      },
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        awbNumber: updatedOrder.airwayBillNumber,
      },
    });
  } catch (error) {
    console.error('[Tracking] Unexpected error:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while fetching tracking information',
        code: SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
      },
      { status: 500 }
    );
  }
}
