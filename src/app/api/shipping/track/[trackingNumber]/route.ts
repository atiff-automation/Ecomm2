/**

export const dynamic = 'force-dynamic';

 * Shipment Tracking API
 * Provides real-time tracking information from EasyParcel
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

interface RouteParams {
  params: {
    trackingNumber: string;
  };
}

/**
 * GET - Track shipment by tracking number
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { trackingNumber } = params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const source = searchParams.get('source') || 'customer'; // customer, admin, webhook

    console.log('📍 Tracking request:', {
      trackingNumber,
      refresh,
      source,
    });

    // Get shipment from database
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            status: true,
            paymentStatus: true,
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 20, // Latest 20 events
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found with this tracking number' },
        { status: 404 }
      );
    }

    // Verify access rights (for non-admin requests)
    if (source === 'customer') {
      const session = await getServerSession(authOptions);
      const isAdmin =
        session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';
      const isOwner =
        session?.user?.id && shipment.order.userId === session.user.id;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { message: 'Unauthorized access to tracking information' },
          { status: 403 }
        );
      }
    }

    // Get fresh tracking data from EasyParcel if requested or if data is stale
    let liveTrackingData = null;
    const shouldRefreshTracking =
      refresh ||
      !shipment.updatedAt ||
      Date.now() - shipment.updatedAt.getTime() > 30 * 60 * 1000; // 30 minutes

    if (shouldRefreshTracking && shipment.easyParcelShipmentId) {
      try {
        console.log('🔄 Fetching live tracking data from EasyParcel...');
        liveTrackingData =
          await easyParcelService.trackShipment(trackingNumber);

        // Update shipment status if changed
        if (
          liveTrackingData.status &&
          liveTrackingData.status !== shipment.status
        ) {
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              status: liveTrackingData.status,
              statusDescription:
                liveTrackingData.status_description || liveTrackingData.status,
              actualDelivery: liveTrackingData.delivered_at
                ? new Date(liveTrackingData.delivered_at)
                : null,
              lastTrackedAt: new Date(),
            },
          });
        }

        // Update tracking events with new data
        if (
          liveTrackingData.tracking_events &&
          liveTrackingData.tracking_events.length > 0
        ) {
          await updateTrackingEvents(
            shipment.id,
            liveTrackingData.tracking_events
          );
        }

        console.log('✅ Live tracking data updated');
      } catch (error) {
        console.warn('⚠️ Failed to fetch live tracking data:', error.message);
        // Continue with cached data if live fetch fails
      }
    }

    // Prepare comprehensive tracking response
    const trackingResponse = {
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        orderNumber: shipment.order.orderNumber,

        // Status information
        status: shipment.status,
        statusDescription: shipment.statusDescription,

        // Delivery information
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,

        // Courier information
        courierName: shipment.courierName,
        serviceName: shipment.serviceName,
        serviceType: shipment.serviceType,

        // Progress indicators
        progress: calculateDeliveryProgress(shipment.status),
        isDelivered: ['DELIVERED', 'COMPLETED'].includes(shipment.status),
        inTransit: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(
          shipment.status
        ),

        // Timestamps
        createdAt: shipment.createdAt,
        lastTrackedAt: shipment.lastTrackedAt || shipment.updatedAt,

        // Customer information (for admin view)
        ...(source === 'admin' && {
          customerName: shipment.order.user
            ? `${shipment.order.user.firstName} ${shipment.order.user.lastName}`
            : 'Guest Customer',
          customerEmail:
            shipment.order.user?.email || shipment.order.guestEmail,
        }),
      },

      // Enhanced tracking events with categorization
      trackingEvents: shipment.trackingEvents.map(event => ({
        id: event.id,
        eventCode: event.eventCode,
        eventName: event.eventName,
        description: event.description,
        location: event.location,
        eventTime: event.eventTime,
        source: event.source,
        category: categorizeTrackingEvent(event.eventCode),
        isImportant: isImportantEvent(event.eventCode),
      })),

      // Delivery details
      delivery: {
        pickupAddress: {
          city: shipment.pickupAddress?.city,
          state: shipment.pickupAddress?.state,
        },
        deliveryAddress: {
          city: shipment.deliveryAddress?.city,
          state: shipment.deliveryAddress?.state,
          zone: getDeliveryZone(shipment.deliveryAddress?.state),
        },
        parcelDetails: {
          weight: shipment.parcelDetails?.weight,
          value: shipment.parcelDetails?.value,
          quantity: shipment.parcelDetails?.quantity,
          content: shipment.parcelDetails?.content,
        },
      },

      // Live data from EasyParcel (if available)
      ...(liveTrackingData && {
        liveData: {
          courierTrackingUrl: liveTrackingData.courier_tracking_url,
          estimatedDeliveryUpdated: liveTrackingData.estimated_delivery,
          lastUpdated: new Date().toISOString(),
          courierRemarks: liveTrackingData.courier_remarks,
        },
      }),

      // Additional information
      metadata: {
        dataSource: liveTrackingData ? 'live' : 'cached',
        lastRefreshed: new Date().toISOString(),
        refreshAvailable: !!shipment.easyParcelShipmentId,
        trackingUrl: `/api/shipping/track/${trackingNumber}`,
      },
    };

    return NextResponse.json(trackingResponse);
  } catch (error) {
    console.error('❌ Tracking API error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { message: 'Tracking number not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to retrieve tracking information' },
      { status: 500 }
    );
  }
}

/**
 * POST - Manual tracking update (webhook or admin)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { trackingNumber } = params;
    const body = await request.json();
    const session = await getServerSession(authOptions);

    console.log('📝 Manual tracking update:', {
      trackingNumber,
      source: body.source || 'unknown',
    });

    // Verify admin access for manual updates
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Admin access required for manual tracking updates' },
        { status: 403 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Update shipment status
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: body.status || shipment.status,
        statusDescription: body.statusDescription || shipment.statusDescription,
        actualDelivery: body.deliveredAt
          ? new Date(body.deliveredAt)
          : shipment.actualDelivery,
        lastTrackedAt: new Date(),
      },
    });

    // Create tracking event
    if (body.eventCode && body.eventName) {
      await prisma.shipmentTracking.create({
        data: {
          shipmentId: shipment.id,
          eventCode: body.eventCode,
          eventName: body.eventName,
          description:
            body.description || `Manual update by ${session.user.firstName}`,
          location: body.location || 'System Update',
          eventTime: body.eventTime ? new Date(body.eventTime) : new Date(),
          source: 'MANUAL',
          courierRemarks: body.courierRemarks,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'Shipment',
        resourceId: shipment.id,
        details: {
          trackingNumber,
          oldStatus: shipment.status,
          newStatus: body.status,
          reason: body.reason || 'Manual tracking update',
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    console.log('✅ Manual tracking update completed');

    return NextResponse.json({
      success: true,
      message: 'Tracking information updated successfully',
      shipment: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.trackingNumber,
        status: updatedShipment.status,
        statusDescription: updatedShipment.statusDescription,
        lastTrackedAt: updatedShipment.lastTrackedAt,
      },
    });
  } catch (error) {
    console.error('❌ Manual tracking update error:', error);
    return NextResponse.json(
      { message: 'Failed to update tracking information' },
      { status: 500 }
    );
  }
}

// ===== Helper Functions =====

/**
 * Update tracking events with new data from EasyParcel
 */
async function updateTrackingEvents(shipmentId: string, newEvents: any[]) {
  for (const event of newEvents) {
    // Check if event already exists
    const existingEvent = await prisma.shipmentTracking.findFirst({
      where: {
        shipmentId,
        eventCode: event.event_code,
        eventTime: new Date(event.event_time),
      },
    });

    if (!existingEvent) {
      await prisma.shipmentTracking.create({
        data: {
          shipmentId,
          eventCode: event.event_code,
          eventName: event.event_name,
          description: event.description,
          location: event.location,
          eventTime: new Date(event.event_time),
          source: 'EASYPARCEL',
          courierRemarks: event.courier_remarks,
        },
      });
    }
  }
}

/**
 * Calculate delivery progress percentage
 */
function calculateDeliveryProgress(status: string): number {
  const progressMap: Record<string, number> = {
    BOOKED: 10,
    LABEL_GENERATED: 20,
    PICKUP_SCHEDULED: 30,
    PICKED_UP: 40,
    IN_TRANSIT: 60,
    OUT_FOR_DELIVERY: 80,
    DELIVERED: 100,
    COMPLETED: 100,
    CANCELLED: 0,
    FAILED: 0,
  };

  return progressMap[status] || 0;
}

/**
 * Categorize tracking events for better UI organization
 */
function categorizeTrackingEvent(eventCode: string): string {
  if (['BOOKED', 'LABEL_GENERATED'].includes(eventCode)) {
    return 'preparation';
  }
  if (['PICKUP_SCHEDULED', 'PICKED_UP'].includes(eventCode)) {
    return 'pickup';
  }
  if (
    ['IN_TRANSIT', 'ARRIVED_AT_HUB', 'DEPARTED_FROM_HUB'].includes(eventCode)
  ) {
    return 'transit';
  }
  if (['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED'].includes(eventCode)) {
    return 'delivery';
  }
  if (['DELIVERED', 'COMPLETED'].includes(eventCode)) {
    return 'completed';
  }
  if (['CANCELLED', 'FAILED', 'RETURNED'].includes(eventCode)) {
    return 'exception';
  }
  return 'other';
}

/**
 * Identify important events for notifications
 */
function isImportantEvent(eventCode: string): boolean {
  const importantEvents = [
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_ATTEMPTED',
    'CANCELLED',
    'FAILED',
  ];
  return importantEvents.includes(eventCode);
}

/**
 * Determine delivery zone from state
 */
function getDeliveryZone(state: string): 'west' | 'east' | 'unknown' {
  if (!state) {
    return 'unknown';
  }
  const eastStates = ['SBH', 'SWK', 'LBN'];
  return eastStates.includes(state) ? 'east' : 'west';
}
