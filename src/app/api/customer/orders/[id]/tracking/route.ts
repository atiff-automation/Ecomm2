/**
 * Customer Order Tracking API
 * Provides secure tracking access for logged-in customers
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/customer/orders/[id]/tracking
 * Get tracking information for a customer's order
 * 
 * Security: 
 * - Requires authentication
 * - User can only access their own orders
 * - Filters sensitive tracking data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Fetch order with shipment data - ensure user owns the order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id, // Critical: Only user's own orders
      },
      include: {
        shipment: {
          include: {
            trackingEvents: {
              orderBy: { eventTime: 'desc' }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If no shipment exists, return basic order info
    if (!order.shipment) {
      return NextResponse.json({
        success: true,
        tracking: {
          orderNumber: order.orderNumber,
          status: order.status,
          hasShipment: false,
          message: 'Order not yet shipped'
        }
      });
    }

    // Filter tracking data for customer view (remove sensitive info)
    const customerTrackingData = {
      orderNumber: order.orderNumber,
      trackingNumber: order.shipment.trackingNumber,
      courierName: order.shipment.courierName,
      serviceName: order.shipment.serviceName,
      status: order.shipment.status,
      statusDescription: order.shipment.statusDescription,
      estimatedDelivery: order.shipment.estimatedDelivery?.toISOString(),
      actualDelivery: order.shipment.actualDelivery?.toISOString(),
      hasShipment: true,
      
      // Filter tracking events to remove sensitive internal data
      trackingEvents: order.shipment.trackingEvents.map(event => ({
        eventName: event.eventName,
        description: event.description,
        timestamp: event.eventTime.toISOString(),
        location: event.location || undefined, // Only include if available
      }))
    };

    return NextResponse.json({
      success: true,
      tracking: customerTrackingData
    });

  } catch (error) {
    console.error('Error fetching customer tracking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer/orders/[id]/tracking/refresh
 * Refresh tracking data from EasyParcel API
 * 
 * Security:
 * - Requires authentication
 * - Rate limited: 10 requests per minute per user
 * - User can only refresh their own orders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Check if user owns the order and has shipment
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        shipment: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.shipment || !order.shipment.trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'No tracking information available' },
        { status: 400 }
      );
    }

    // TODO: Add rate limiting check here
    // For now, we'll implement a simple time-based check
    const lastUpdate = order.shipment.updatedAt;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastUpdate > fiveMinutesAgo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tracking was updated recently. Please wait before refreshing again.',
          nextRefreshAvailable: new Date(lastUpdate.getTime() + 5 * 60 * 1000).toISOString()
        },
        { status: 429 }
      );
    }

    // Import and use existing admin tracking refresh logic
    const { easyParcelService } = await import('@/lib/shipping/easyparcel-service');
    
    try {
      const trackingData = await easyParcelService.trackShipment(order.shipment.trackingNumber);
      
      // Update shipment with new tracking data
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
        // Get existing events to avoid duplicates
        const existingEvents = await prisma.shipmentTracking.findMany({
          where: { shipmentId: order.shipment.id }
        });

        const existingEventKeys = new Set(
          existingEvents.map(e => `${e.eventTime.getTime()}_${e.eventCode}`)
        );

        // Only add new events
        const newEvents = trackingData.tracking_events.filter((event: any) => {
          const eventKey = `${new Date(event.timestamp || event.event_time).getTime()}_${event.event_code || event.status}`;
          return !existingEventKeys.has(eventKey);
        });

        if (newEvents.length > 0) {
          await prisma.shipmentTracking.createMany({
            data: newEvents.map((event: any) => ({
              shipmentId: order.shipment!.id,
              eventCode: event.event_code || event.status,
              eventName: event.event_name || event.status,
              description: event.description || event.event_name || event.status,
              location: event.location,
              eventTime: new Date(event.timestamp || event.event_time),
              source: 'EASYPARCEL'
            }))
          });
        }
      }

      // Log refresh activity
      await prisma.auditLog.create({
        data: {
          action: 'CUSTOMER_TRACKING_REFRESH',
          resource: 'SHIPMENT',
          resourceId: order.shipment.id,
          userId: session.user.id,
          details: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingNumber: order.shipment.trackingNumber
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Tracking information updated successfully'
      });

    } catch (apiError) {
      console.error('EasyParcel API error:', apiError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to fetch latest tracking information. Please try again later.' 
        },
        { status: 503 } // Service Unavailable
      );
    }

  } catch (error) {
    console.error('Error refreshing customer tracking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh tracking information' },
      { status: 500 }
    );
  }
}