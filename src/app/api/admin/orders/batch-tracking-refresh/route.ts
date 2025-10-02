import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Get all shipments that are not yet delivered and have tracking numbers
    const activeShipments = await prisma.shipment.findMany({
      where: {
        trackingNumber: { not: null },
        status: {
          notIn: ['DELIVERED', 'CANCELLED', 'FAILED'],
        },
        // Only refresh shipments updated more than 1 hour ago to avoid rate limiting
        updatedAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
      include: {
        order: true,
      },
      take: 50, // Limit to 50 shipments per batch to avoid overwhelming the API
    });

    const results = {
      total: activeShipments.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    if (activeShipments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No shipments need tracking refresh at this time',
        results,
      });
    }

    // Process tracking updates with rate limiting
    for (const shipment of activeShipments) {
      if (!shipment.trackingNumber) {
        results.skipped++;
        continue;
      }

      try {
        const trackingData = await easyParcelService.trackShipment(
          shipment.trackingNumber
        );

        // Update shipment status
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: trackingData.status as any,
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
          // Get existing events to avoid duplicates
          const existingEvents = await prisma.shipmentTracking.findMany({
            where: { shipmentId: shipment.id },
          });

          const existingEventKeys = new Set(
            existingEvents.map(e => `${e.eventTime.getTime()}_${e.eventCode}`)
          );

          // Only add new events
          const newEvents = trackingData.tracking_events.filter(
            (event: any) => {
              const eventKey = `${new Date(event.timestamp || event.event_time).getTime()}_${event.event_code || event.status}`;
              return !existingEventKeys.has(eventKey);
            }
          );

          if (newEvents.length > 0) {
            await prisma.shipmentTracking.createMany({
              data: newEvents.map((event: any) => ({
                shipmentId: shipment.id,
                eventCode: event.event_code || event.status,
                eventName: event.event_name || event.status,
                description:
                  event.description || event.event_name || event.status,
                location: event.location,
                eventTime: new Date(event.timestamp || event.event_time),
                source: 'EASYPARCEL',
              })),
            });
          }
        }

        results.successful++;

        // Rate limiting - delay between API calls (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `${shipment.order.orderNumber} (${shipment.trackingNumber}): ${errorMessage}`
        );

        // If we get rate limited, wait longer
        if (errorMessage.includes('rate') || errorMessage.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      }
    }

    // Log batch operation
    await prisma.auditLog.create({
      data: {
        action: 'BATCH_TRACKING_REFRESH_ALL',
        resource: 'SHIPMENT',
        resourceId: null,
        userId: session.user.id,
        details: {
          shipmentsProcessed: activeShipments.length,
          successful: results.successful,
          failed: results.failed,
          skipped: results.skipped,
          errors: results.errors.slice(0, 10), // Store only first 10 errors
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Batch tracking refresh completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error('Error in batch tracking refresh:', error);
    return NextResponse.json(
      { error: 'Failed to refresh tracking data' },
      { status: 500 }
    );
  }
}
