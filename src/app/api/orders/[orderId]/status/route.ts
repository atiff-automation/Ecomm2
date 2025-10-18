/**

export const dynamic = 'force-dynamic';

 * Order Status Update API - Malaysian E-commerce Platform
 * Generic endpoint to update order status - works with ANY payment method
 * Can be called by webhooks, admin actions, or manual processes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { updateOrderStatus } from '@/lib/notifications/order-status-handler';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

// Status values from Prisma schema - Single source of truth
const ORDER_STATUS_VALUES = [
  'PENDING',
  'PAID',
  'READY_TO_SHIP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

const PAYMENT_STATUS_VALUES = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const;

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  paymentStatus: z.enum(PAYMENT_STATUS_VALUES).optional(),
  triggeredBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  webhookSecret: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const { status, paymentStatus, triggeredBy, metadata, webhookSecret } =
      updateStatusSchema.parse(body);

    const { orderId } = params;

    // Check if this is a webhook call or admin call
    const isWebhook = !!webhookSecret;
    let isAuthorized = false;

    if (isWebhook) {
      // Verify webhook secret (you can set this in your environment)
      const expectedSecret =
        process.env.ORDER_WEBHOOK_SECRET || 'your-webhook-secret';
      if (webhookSecret === expectedSecret) {
        isAuthorized = true;
        console.log('✅ Webhook authentication successful');
      } else {
        console.warn('❌ Invalid webhook secret');
        return NextResponse.json(
          { error: 'Invalid webhook secret' },
          { status: 401 }
        );
      }
    } else {
      // Check session for admin/staff access
      const session = await getServerSession(authOptions);
      if (
        session?.user &&
        (session.user.role === UserRole.ADMIN ||
          session.user.role === UserRole.STAFF)
      ) {
        isAuthorized = true;
        console.log('✅ Admin/Staff authentication successful');
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update order status and trigger notifications
    const updatedOrder = await updateOrderStatus(
      orderId,
      status as OrderStatus,
      paymentStatus as PaymentStatus | undefined,
      triggeredBy || (isWebhook ? 'webhook' : 'admin'),
      metadata
    );

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Order status update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
