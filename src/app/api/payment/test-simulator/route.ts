/**
 * Payment Test Simulator - Development Only
 * Simulates payment success/failure for testing membership flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { activateUserMembership } from '@/lib/membership';
import { updateOrderStatus } from '@/lib/notifications/order-status-handler';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Test simulator not available in production' },
        { status: 403 }
      );
    }

    const { orderId, paymentStatus, delay = 2000 } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Add artificial delay to simulate real payment processing
    await new Promise(resolve => setTimeout(resolve, delay));

    // Find the order with pending membership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        pendingMembership: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Simulate payment success
    if (paymentStatus === 'success') {
      // Update payment ID first
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: `test_payment_${Date.now()}`,
        },
      });

      // Use universal status handler - this triggers Telegram automatically
      await updateOrderStatus(
        orderId,
        'CONFIRMED',
        'PAID',
        'test-simulator',
        {
          paymentMethod: 'TEST_PAYMENT',
          simulatedAt: new Date().toISOString(),
          testEnvironment: true,
        }
      );

      // Activate pending membership if exists
      if (order.pendingMembership && order.user && !order.user.isMember) {
        const pending = order.pendingMembership;

        const activated = await activateUserMembership(
          order.user.id,
          Number(pending.qualifyingAmount),
          order.id
        );

        if (activated) {
          await prisma.pendingMembership.delete({
            where: { id: pending.id },
          });
        }

        return NextResponse.json({
          message: 'Payment successful - Membership activated!',
          orderId,
          membershipActivated: true,
          qualifyingAmount: Number(pending.qualifyingAmount),
          userEmail: order.user.email,
        });
      }

      return NextResponse.json({
        message: 'Payment successful',
        orderId,
        membershipActivated: false,
      });
    }

    // Simulate payment failure
    if (paymentStatus === 'failure') {
      // Use universal status handler for failures too
      await updateOrderStatus(
        orderId,
        'CANCELLED',
        'FAILED',
        'test-simulator',
        {
          paymentMethod: 'TEST_PAYMENT',
          simulatedAt: new Date().toISOString(),
          testEnvironment: true,
          failed: true,
        }
      );

      return NextResponse.json({
        message: 'Payment failed - Order cancelled',
        orderId,
        membershipActivated: false,
      });
    }

    return NextResponse.json(
      { message: 'Invalid payment status. Use "success" or "failure"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment simulator error:', error);
    return NextResponse.json(
      {
        message: 'Simulator error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Test simulator not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Payment Test Simulator',
    usage: {
      method: 'POST',
      body: {
        orderId: 'string (required)',
        paymentStatus: '"success" or "failure" (required)',
        delay: 'number in ms (optional, default: 2000)',
      },
      examples: {
        success: { orderId: 'ord_123', paymentStatus: 'success' },
        failure: { orderId: 'ord_123', paymentStatus: 'failure' },
      },
    },
    environment: process.env.NODE_ENV,
  });
}
