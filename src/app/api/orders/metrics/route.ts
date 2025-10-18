import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/metrics
 * Calculate and return order metrics for the admin dashboard
 */
export async function GET() {
  try {
    // Authorization check - only admins can view metrics
    const { error } = await requireAdminRole();
    if (error) return error;

    // Calculate all metrics in parallel for performance
    const [total, awaitingPayment, processing, shipped, delivered, cancelled] =
      await Promise.all([
        // Total orders
        prisma.order.count(),

        // Awaiting Payment: Orders with PENDING payment status
        prisma.order.count({
          where: {
            paymentStatus: 'PENDING',
          },
        }),

        // Processing: Paid orders that haven't been shipped yet
        // (Paid status OR Ready to Ship status) AND (no shipment OR shipment not yet in transit)
        prisma.order.count({
          where: {
            paymentStatus: 'PAID',
            status: {
              in: ['PAID', 'READY_TO_SHIP'],
            },
          },
        }),

        // Shipped: Orders in transit or out for delivery
        prisma.order.count({
          where: {
            status: {
              in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
            },
          },
        }),

        // Delivered: Successfully delivered orders
        prisma.order.count({
          where: {
            status: 'DELIVERED',
          },
        }),

        // Cancelled: Cancelled orders
        prisma.order.count({
          where: {
            status: 'CANCELLED',
          },
        }),
      ]);

    return NextResponse.json({
      total,
      awaitingPayment,
      processing,
      shipped,
      delivered,
      cancelled,
    });
  } catch (error) {
    console.error('Failed to fetch order metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order metrics' },
      { status: 500 }
    );
  }
}
