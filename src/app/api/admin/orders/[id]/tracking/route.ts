import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        shipment: {
          include: {
            trackingEvents: {
              orderBy: { eventTime: 'desc' },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shipment?.trackingNumber) {
      return NextResponse.json(
        { error: 'No tracking available for this order' },
        { status: 404 }
      );
    }

    // Return cached tracking data
    return NextResponse.json({
      success: true,
      tracking: {
        trackingNumber: order.shipment.trackingNumber,
        status: order.shipment.status,
        statusDescription: order.shipment.statusDescription,
        courierName: order.shipment.courierName,
        serviceName: order.shipment.serviceName,
        estimatedDelivery: order.shipment.estimatedDelivery,
        actualDelivery: order.shipment.actualDelivery,
        trackingEvents: order.shipment.trackingEvents.map(event => ({
          timestamp: event.eventTime.toISOString(),
          status: event.eventName,
          location: event.location,
          description: event.description,
        })),
        lastTrackedAt: order.shipment.updatedAt,
        updatedAt: order.shipment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        shipment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shipment?.trackingNumber) {
      return NextResponse.json(
        { error: 'No tracking available for this order' },
        { status: 404 }
      );
    }

    // Force refresh tracking from EasyParcel API
    try {
      const trackingData = await easyParcelService.trackShipment(
        order.shipment.trackingNumber
      );

      // Update database with fresh tracking data
      const updatedShipment = await prisma.shipment.update({
        where: { id: order.shipment.id },
        data: {
          status: trackingData.status as any, // Cast to match enum
          statusDescription: trackingData.description || trackingData.status,
          estimatedDelivery: trackingData.estimated_delivery
            ? new Date(trackingData.estimated_delivery)
            : null,
          actualDelivery: trackingData.actual_delivery
            ? new Date(trackingData.actual_delivery)
            : null,
        },
      });

      // Update tracking events if available
      if (
        trackingData.tracking_events &&
        trackingData.tracking_events.length > 0
      ) {
        // Clear existing events and add new ones
        await prisma.shipmentTracking.deleteMany({
          where: { shipmentId: order.shipment.id },
        });

        await prisma.shipmentTracking.createMany({
          data: trackingData.tracking_events.map((event: any) => ({
            shipmentId: order.shipment.id,
            eventCode: event.event_code || event.status,
            eventName: event.event_name || event.status,
            description: event.description || event.event_name || event.status,
            location: event.location,
            eventTime: new Date(event.timestamp || event.event_time),
            source: 'EASYPARCEL',
          })),
        });
      }

      // Log tracking refresh activity
      await prisma.auditLog.create({
        data: {
          action: 'TRACKING_REFRESHED',
          resource: 'ORDER',
          resourceId: order.id,
          userId: session.user.id,
          details: {
            trackingNumber: order.shipment.trackingNumber,
            previousStatus: order.shipment.status,
            newStatus: trackingData.status,
            eventsCount: trackingData.tracking_events?.length || 0,
          },
        },
      });

      // Fetch updated data with events
      const refreshedOrder = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          shipment: {
            include: {
              trackingEvents: {
                orderBy: { eventTime: 'desc' },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Tracking data refreshed successfully',
        tracking: {
          trackingNumber: refreshedOrder!.shipment!.trackingNumber,
          status: refreshedOrder!.shipment!.status,
          statusDescription: refreshedOrder!.shipment!.statusDescription,
          courierName: refreshedOrder!.shipment!.courierName,
          serviceName: refreshedOrder!.shipment!.serviceName,
          estimatedDelivery: refreshedOrder!.shipment!.estimatedDelivery,
          actualDelivery: refreshedOrder!.shipment!.actualDelivery,
          trackingEvents: refreshedOrder!.shipment!.trackingEvents.map(
            event => ({
              timestamp: event.eventTime.toISOString(),
              status: event.eventName,
              location: event.location,
              description: event.description,
            })
          ),
          lastTrackedAt: refreshedOrder!.shipment!.updatedAt,
          updatedAt: refreshedOrder!.shipment!.updatedAt,
        },
      });
    } catch (trackingError) {
      console.error('Error refreshing tracking:', trackingError);

      // Return existing data with error flag
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to refresh tracking from courier',
          tracking: {
            trackingNumber: order.shipment.trackingNumber,
            status: order.shipment.status,
            statusDescription: order.shipment.statusDescription,
            courierName: order.shipment.courierName,
            serviceName: order.shipment.serviceName,
            estimatedDelivery: order.shipment.estimatedDelivery,
            actualDelivery: order.shipment.actualDelivery,
            trackingEvents: [],
            lastTrackedAt: order.shipment.updatedAt,
            updatedAt: order.shipment.updatedAt,
          },
        },
        { status: 206 }
      ); // 206 Partial Content
    }
  } catch (error) {
    console.error('Error in tracking refresh:', error);
    return NextResponse.json(
      { error: 'Failed to refresh tracking data' },
      { status: 500 }
    );
  }
}
