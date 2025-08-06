/**
 * Payment Status API
 * Checks payment status from Billplz and updates order if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { billplzService } from '@/lib/payments/billplz-service';
import { handleApiError } from '@/lib/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params;
    const session = await getServerSession(authOptions);

    if (!billId) {
      return NextResponse.json(
        { message: 'Bill ID is required' },
        { status: 400 }
      );
    }

    // Find the order by payment ID
    const order = await prisma.order.findFirst({
      where: {
        paymentId: billId,
        // Only allow user to check their own orders, or allow guest orders
        ...(session?.user?.id ? { userId: session.user.id } : {}),
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Get current bill status from Billplz
    const billResult = await billplzService.getBill(billId);

    if (!billResult.success || !billResult.bill) {
      return NextResponse.json({
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          createdAt: order.createdAt.toISOString(),
        },
        payment: {
          status: 'unknown',
          message: 'Could not retrieve payment status from Billplz',
        },
      });
    }

    const bill = billResult.bill;
    let needsUpdate = false;
    let newPaymentStatus = order.paymentStatus;
    let newOrderStatus = order.status;

    // Check if payment status has changed
    if (bill.paid && order.paymentStatus !== 'PAID') {
      needsUpdate = true;
      newPaymentStatus = 'PAID';
      newOrderStatus = 'CONFIRMED';
    } else if (bill.state === 'deleted' && order.paymentStatus === 'PENDING') {
      needsUpdate = true;
      newPaymentStatus = 'FAILED';
      newOrderStatus = 'CANCELLED';
    }

    // Update order if payment status changed
    if (needsUpdate) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: newPaymentStatus,
          status: newOrderStatus,
          updatedAt: new Date(),
        },
      });

      // If payment is confirmed, update inventory and membership
      if (newPaymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
        // Update inventory
        for (const item of order.orderItems) {
          if (item.product) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Update membership if applicable
        if (order.wasEligibleForMembership && order.userId) {
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: { isMember: true, membershipTotal: true },
          });

          if (user && !user.isMember) {
            await prisma.user.update({
              where: { id: order.userId },
              data: {
                isMember: true,
                memberSince: new Date(),
                membershipTotal: Number(order.total),
              },
            });
          } else if (user?.isMember) {
            await prisma.user.update({
              where: { id: order.userId },
              data: {
                membershipTotal:
                  Number(user.membershipTotal) + Number(order.total),
              },
            });
          }
        }
      }

      // Log the status update
      await prisma.auditLog.create({
        data: {
          userId: order.userId,
          action: 'PAYMENT_STATUS_SYNC',
          resource: 'ORDER',
          resourceId: order.id,
          details: {
            orderNumber: order.orderNumber,
            billplzBillId: billId,
            previousPaymentStatus: order.paymentStatus,
            newPaymentStatus,
            previousOrderStatus: order.status,
            newOrderStatus,
            billplzState: bill.state,
            billplzPaid: bill.paid,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    // Format order items for response
    const formattedItems = order.orderItems.map(item => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      appliedPrice: Number(item.appliedPrice),
      totalPrice: Number(item.totalPrice),
      image: item.product?.images?.[0] || null,
    }));

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: needsUpdate ? newOrderStatus : order.status,
        paymentStatus: needsUpdate ? newPaymentStatus : order.paymentStatus,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        shippingCost: Number(order.shippingCost),
        discountAmount: Number(order.discountAmount),
        total: Number(order.total),
        items: formattedItems,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      payment: {
        billId: bill.id,
        status: bill.state,
        paid: bill.paid,
        amount: bill.amount,
        paidAmount: bill.paid_amount,
        paymentUrl: bill.url,
        dueAt: bill.due_at,
      },
      statusChanged: needsUpdate,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return handleApiError(error);
  }
}
