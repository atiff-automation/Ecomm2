/**
 * Update Order Status by Order Number API
 * Used for payment return URL processing when webhooks can't reach localhost
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateOrderStatus } from '@/lib/notifications/order-status-handler';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

const updateByNumberSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  status: z.enum([
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  triggeredBy: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, status, paymentStatus, triggeredBy, metadata } = 
      updateByNumberSchema.parse(body);

    console.log(`🔄 Updating order status by number: ${orderNumber} → ${status}${paymentStatus ? `, Payment: ${paymentStatus}` : ''}`);

    // Find the order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      select: { id: true, status: true, paymentStatus: true }
    });

    if (!order) {
      console.warn(`❌ Order not found: ${orderNumber}`);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if status change is needed
    const statusChanged = order.status !== status;
    const paymentStatusChanged = paymentStatus && order.paymentStatus !== paymentStatus;

    if (!statusChanged && !paymentStatusChanged) {
      console.log(`✅ Order ${orderNumber} already has the requested status`);
      return NextResponse.json({
        success: true,
        message: 'No status change needed',
        orderId: order.id,
        currentStatus: order.status,
        currentPaymentStatus: order.paymentStatus
      });
    }

    // Use the universal status handler to update and trigger notifications
    const updatedOrder = await updateOrderStatus(
      order.id,
      status as OrderStatus,
      paymentStatus as PaymentStatus | undefined,
      triggeredBy || 'payment-return-url',
      metadata || {}
    );

    if (updatedOrder) {
      console.log(`✅ Order ${orderNumber} status updated successfully:`, {
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        triggeredBy
      });

      return NextResponse.json({
        success: true,
        message: 'Order status updated successfully',
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        triggeredBy
      });
    } else {
      console.error(`❌ Failed to update order ${orderNumber}`);
      return NextResponse.json(
        { success: false, message: 'Failed to update order status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating order status by number:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}