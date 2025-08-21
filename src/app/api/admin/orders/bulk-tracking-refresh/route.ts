import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds } = await request.json();
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    // Fetch orders with shipment data
    const orders = await prisma.order.findMany({
      where: { 
        id: { in: orderIds },
        shipment: {
          trackingNumber: { not: null }
        }
      },
      include: { 
        shipment: true 
      }
    });

    const results = {
      total: orders.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process tracking updates with rate limiting
    for (const order of orders) {
      if (!order.shipment?.trackingNumber) continue;

      try {
        const trackingData = await easyParcelService.trackShipment(order.shipment.trackingNumber);
        
        // Update shipment status
        await prisma.shipment.update({
          where: { id: order.shipment.id },
          data: {
            status: trackingData.status as any,
            statusDescription: trackingData.description || trackingData.status,
            estimatedDelivery: trackingData.estimated_delivery ? new Date(trackingData.estimated_delivery) : null,
            actualDelivery: trackingData.actual_delivery ? new Date(trackingData.actual_delivery) : null,
          }
        });

        // Update tracking events if available
        if (trackingData.tracking_events && trackingData.tracking_events.length > 0) {
          // Clear existing events and add new ones
          await prisma.shipmentTracking.deleteMany({
            where: { shipmentId: order.shipment.id }
          });

          await prisma.shipmentTracking.createMany({
            data: trackingData.tracking_events.map((event: any) => ({
              shipmentId: order.shipment.id,
              eventCode: event.event_code || event.status,
              eventName: event.event_name || event.status,
              description: event.description || event.event_name || event.status,
              location: event.location,
              eventTime: new Date(event.timestamp || event.event_time),
              source: 'EASYPARCEL'
            }))
          });
        }

        results.successful++;
        
        // Rate limiting - delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.failed++;
        results.errors.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log bulk operation
    await prisma.auditLog.create({
      data: {
        action: 'BULK_TRACKING_REFRESH',
        resource: 'ORDER',
        resourceId: null,
        userId: session.user.id,
        details: {
          orderCount: orders.length,
          successful: results.successful,
          failed: results.failed,
          orderIds: orderIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Tracking refresh completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error in bulk tracking refresh:', error);
    return NextResponse.json({ error: 'Failed to refresh tracking data' }, { status: 500 });
  }
}