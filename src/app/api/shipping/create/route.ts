/**

export const dynamic = 'force-dynamic';

 * Shipment Creation API
 * Create shipments with EasyParcel for order fulfillment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const shipmentCreateRequestSchema = z.object({
  orderId: z.string(),
  courierId: z.string(),
  specialInstructions: z.string().optional(),
  insuranceRequired: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Require admin access for creating shipments
    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = shipmentCreateRequestSchema.parse(body);

    // Get order with items and shipping address
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                weight: true,
              },
            },
          },
        },
        shippingAddress: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (!order.shippingAddress) {
      return NextResponse.json(
        { message: 'Order has no shipping address' },
        { status: 400 }
      );
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
      return NextResponse.json(
        { message: 'Order is not ready for shipping' },
        { status: 400 }
      );
    }

    // Prepare shipment data
    const pickupAddress = {
      name: process.env.BUSINESS_NAME || 'JRM E-commerce',
      phone: process.env.BUSINESS_PHONE || '+60123456789',
      email: process.env.BUSINESS_EMAIL || 'noreply@jrmecommerce.com',
      addressLine1:
        process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Example',
      addressLine2: process.env.BUSINESS_ADDRESS_LINE2 || '',
      city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
      state: process.env.BUSINESS_STATE || 'KUL',
      postalCode: process.env.BUSINESS_POSTAL_CODE || '50000',
      country: 'MY',
    };

    const deliveryAddress = {
      name:
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
        order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName,
      phone: order.user?.phone || order.shippingAddress.phone || '',
      email: order.user?.email || '',
      addressLine1: order.shippingAddress.addressLine1,
      addressLine2: order.shippingAddress.addressLine2 || '',
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: 'MY',
    };

    const items = order.orderItems.map(item => ({
      name: item.productName,
      weight: item.product?.weight ? Number(item.product.weight) : 0.5,
      quantity: item.quantity,
      value: Number(item.appliedPrice),
    }));

    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    );
    const totalValue = Number(order.total);

    // Create shipment with EasyParcel
    const shipment = await easyParcelService.createShipment({
      pickupAddress,
      deliveryAddress,
      items,
      totalWeight,
      totalValue,
      courierId: validatedData.courierId,
      orderNumber: order.orderNumber,
      ...(validatedData.specialInstructions && {
        specialInstructions: validatedData.specialInstructions,
      }),
      insuranceRequired: validatedData.insuranceRequired,
    });

    // Update order with tracking information
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        trackingNumber: shipment.trackingNumber,
        shippedAt: new Date(),
        // courierName: validatedData.courierId, // Remove if not in schema
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ORDER_SHIPPED',
        resource: 'ORDER',
        resourceId: order.id,
        details: {
          orderNumber: order.orderNumber,
          trackingNumber: shipment.trackingNumber,
          courierId: validatedData.courierId,
          shipmentId: shipment.shipmentId,
          totalWeight,
          totalValue,
          specialInstructions: validatedData.specialInstructions,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Shipment created successfully',
      shipment,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        shippedAt: updatedOrder.shippedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Shipment creation error:', error);
    return handleApiError(error);
  }
}
