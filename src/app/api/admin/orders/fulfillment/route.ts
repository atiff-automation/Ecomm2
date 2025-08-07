/**
 * Admin Order Fulfillment API
 * Manages bulk order processing and fulfillment workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/error-handler';
import { emailService } from '@/lib/email/email-service';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const fulfillmentSchema = z.object({
  orderIds: z.array(z.string()).min(1),
  action: z.enum(['mark_processing', 'mark_shipped', 'cancel_orders']),
  trackingNumbers: z.array(z.string()).optional(),
  shippingCarrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'CONFIRMED';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get orders ready for fulfillment
    const orders = await prisma.order.findMany({
      where: {
        status: status as any,
        paymentStatus: 'PAID',
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                weight: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.order.count({
      where: {
        status: status as any,
        paymentStatus: 'PAID',
      },
    });

    // Format orders for fulfillment
    const fulfillmentOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : 'Guest',
      customerEmail: order.user?.email,
      status: order.status,
      total: Number(order.total),
      itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalWeight: order.orderItems.reduce((sum, item) => {
        const weight = item.product?.weight ? Number(item.product.weight) : 0;
        return sum + weight * item.quantity;
      }, 0),
      items: order.orderItems.map(item => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        weight: item.product?.weight ? Number(item.product.weight) : 0,
      })),
      createdAt: order.createdAt.toISOString(),
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt?.toISOString(),
    }));

    return NextResponse.json({
      orders: fulfillmentOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalOrders: totalCount,
        totalItems: fulfillmentOrders.reduce(
          (sum, order) => sum + order.itemCount,
          0
        ),
        totalWeight: fulfillmentOrders.reduce(
          (sum, order) => sum + order.totalWeight,
          0
        ),
        totalValue: fulfillmentOrders.reduce(
          (sum, order) => sum + order.total,
          0
        ),
      },
    });
  } catch (error) {
    console.error('Order fulfillment fetch error:', error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
    const validatedData = fulfillmentSchema.parse(body);

    const {
      orderIds,
      action,
      trackingNumbers,
      shippingCarrier,
      estimatedDelivery,
    } = validatedData;

    // Get orders to process
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json(
        { message: 'Some orders were not found' },
        { status: 404 }
      );
    }

    let newStatus;
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Process different actions
    switch (action) {
      case 'mark_processing':
        newStatus = 'PROCESSING';
        updateData.status = newStatus;
        break;

      case 'mark_shipped':
        newStatus = 'SHIPPED';
        updateData.status = newStatus;
        updateData.shippedAt = new Date();

        // Add tracking numbers if provided
        if (trackingNumbers && trackingNumbers.length > 0) {
          // Assume first tracking number for now (extend for multiple orders later)
          updateData.trackingNumber = trackingNumbers[0];
        }
        break;

      case 'cancel_orders':
        newStatus = 'CANCELLED';
        updateData.status = newStatus;

        // Restore inventory for cancelled orders
        for (const order of orders) {
          for (const item of order.orderItems) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update all orders
    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: updateData,
    });

    // Send shipping notifications for shipped orders
    if (action === 'mark_shipped') {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        if (order.user) {
          await emailService.sendShippingNotification({
            orderNumber: order.orderNumber,
            customerName: `${order.user.firstName} ${order.user.lastName}`,
            customerEmail: order.user.email,
            items: order.orderItems.map(item => ({
              name: item.productName,
              quantity: item.quantity,
              price: Number(item.appliedPrice),
            })),
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.taxAmount),
            shippingCost: Number(order.shippingCost),
            total: Number(order.total),
            paymentMethod: order.paymentMethod || 'Unknown',
            trackingNumber: trackingNumbers?.[i] || trackingNumbers?.[0] || '',
            estimatedDelivery: estimatedDelivery || '',
          });
        }
      }
    }

    // Create audit log for bulk action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_ORDER_UPDATE',
        resource: 'ORDER',
        details: {
          action,
          orderIds,
          orderNumbers: orders.map(order => order.orderNumber),
          newStatus,
          trackingNumbers,
          shippingCarrier,
          estimatedDelivery,
          processedCount: orders.length,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: `Successfully ${action.replace('_', ' ')} ${orders.length} order(s)`,
      processedOrders: orders.length,
      newStatus,
      orderNumbers: orders.map(order => order.orderNumber),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Order fulfillment update error:', error);
    return handleApiError(error);
  }
}
