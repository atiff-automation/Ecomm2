/**
 * Shipment Tracking API
 * Get tracking information for shipments
 */

import { NextRequest, NextResponse } from 'next/server';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: {
    trackingNumber: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { trackingNumber } = params;

    if (!trackingNumber) {
      return NextResponse.json(
        { message: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // Get tracking information from EasyParcel
    const trackingInfo =
      await easyParcelService.getTrackingInfo(trackingNumber);

    // Find related order
    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippedAt: true,
        total: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shippingAddress: {
          select: {
            firstName: true,
            lastName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
      },
    });

    // Update order status based on tracking status if order exists
    if (order && trackingInfo.status) {
      let newStatus = order.status;

      switch (trackingInfo.status.toLowerCase()) {
        case 'delivered':
          newStatus = 'DELIVERED';
          break;
        case 'in_transit':
        case 'out_for_delivery':
          newStatus = 'SHIPPED';
          break;
        case 'exception':
        case 'failed':
          // Keep current status but could trigger alert
          break;
      }

      if (newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus as any,
            deliveredAt:
              trackingInfo.status.toLowerCase() === 'delivered'
                ? new Date()
                : null,
          },
        });
      }
    }

    const response = {
      tracking: trackingInfo,
      order: order
        ? {
            orderNumber: order.orderNumber,
            status: order.status,
            shippedAt: order.shippedAt,
            total: Number(order.total),
            customerName: order.user
              ? `${order.user.firstName} ${order.user.lastName}`
              : `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`,
            deliveryAddress: order.shippingAddress
              ? {
                  name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                  addressLine1: order.shippingAddress.addressLine1,
                  addressLine2: order.shippingAddress.addressLine2,
                  city: order.shippingAddress.city,
                  state: order.shippingAddress.state,
                  postalCode: order.shippingAddress.postalCode,
                }
              : null,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tracking retrieval error:', error);

    // Return a more user-friendly error message
    return NextResponse.json(
      {
        message:
          'Unable to retrieve tracking information. Please try again later or contact support.',
        trackingNumber: params.trackingNumber,
      },
      { status: 500 }
    );
  }
}

// POST method for bulk tracking updates (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { status, location, description } = body;

    const { trackingNumber } = params;

    // This would typically be called by webhook from EasyParcel
    // For now, we'll just update the order status

    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found for tracking number' },
        { status: 404 }
      );
    }

    let newStatus = order.status;

    switch (status?.toLowerCase()) {
      case 'delivered':
        newStatus = 'DELIVERED';
        break;
      case 'in_transit':
      case 'out_for_delivery':
        newStatus = 'SHIPPED';
        break;
    }

    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus as any,
          deliveredAt:
            status?.toLowerCase() === 'delivered' ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      // Create audit log for status update
      await prisma.auditLog.create({
        data: {
          userId: null, // System update
          action: 'ORDER_STATUS_UPDATED',
          resource: 'ORDER',
          resourceId: order.id,
          details: {
            trackingNumber,
            previousStatus: order.status,
            newStatus,
            trackingStatus: status,
            location,
            description,
            updatedBy: 'EasyParcel Webhook',
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'easyparcel',
          userAgent: 'EasyParcel Webhook',
        },
      });
    }

    return NextResponse.json({
      message: 'Tracking status updated successfully',
      orderId: order.id,
      previousStatus: order.status,
      newStatus,
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    return handleApiError(error);
  }
}
