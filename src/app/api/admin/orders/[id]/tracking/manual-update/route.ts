import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, description, location, timestamp } = await request.json();

    if (!status || !description) {
      return NextResponse.json(
        { error: 'Status and description are required' },
        { status: 400 }
      );
    }

    // Find the order and its shipment
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { shipment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shipment) {
      return NextResponse.json(
        { error: 'No shipment found for this order' },
        { status: 404 }
      );
    }

    // Update shipment status
    await prisma.shipment.update({
      where: { id: order.shipment.id },
      data: {
        status: status,
        statusDescription: description,
      },
    });

    // Add manual tracking event
    await prisma.shipmentTracking.create({
      data: {
        shipmentId: order.shipment.id,
        eventCode: status.toUpperCase(),
        eventName: status,
        description: description,
        location: location || null,
        eventTime: timestamp ? new Date(timestamp) : new Date(),
        source: 'MANUAL',
      },
    });

    // Log manual update
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_TRACKING_UPDATE',
        resource: 'ORDER',
        resourceId: order.id,
        userId: session.user.id,
        details: {
          trackingNumber: order.shipment.trackingNumber,
          status: status,
          description: description,
          location: location,
          timestamp: timestamp,
        },
      },
    });

    // Fetch updated order data
    const updatedOrder = await prisma.order.findUnique({
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
      message: 'Tracking status updated successfully',
      tracking: {
        trackingNumber: updatedOrder!.shipment!.trackingNumber,
        status: updatedOrder!.shipment!.status,
        statusDescription: updatedOrder!.shipment!.statusDescription,
        courierName: updatedOrder!.shipment!.courierName,
        serviceName: updatedOrder!.shipment!.serviceName,
        estimatedDelivery: updatedOrder!.shipment!.estimatedDelivery,
        actualDelivery: updatedOrder!.shipment!.actualDelivery,
        trackingEvents: updatedOrder!.shipment!.trackingEvents.map(event => ({
          timestamp: event.eventTime.toISOString(),
          status: event.eventName,
          location: event.location,
          description: event.description,
        })),
        lastTrackedAt: updatedOrder!.shipment!.updatedAt,
        updatedAt: updatedOrder!.shipment!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating tracking manually:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking status' },
      { status: 500 }
    );
  }
}
