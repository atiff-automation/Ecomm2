/**
 * Billplz Payment Webhook Handler
 * Processes payment status updates from Billplz
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { billplzService } from '@/lib/payments/billplz-service';
import { emailService } from '@/lib/email/email-service';
import { activateUserMembership } from '@/lib/membership';

export async function POST(request: NextRequest) {
  try {
    // Parse form data from webhook
    const formData = await request.formData();
    const webhookData: Record<string, string> = {};

    Array.from(formData.entries()).forEach(([key, value]) => {
      webhookData[key] = value.toString();
    });

    // Verify webhook signature
    const signature = webhookData.x_signature;
    if (!billplzService.verifyWebhook(webhookData, signature)) {
      console.warn('Invalid webhook signature:', {
        signature,
        data: webhookData,
      });
      return NextResponse.json(
        { message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Process webhook data
    const webhook = billplzService.processWebhook(webhookData);
    if (!webhook) {
      return NextResponse.json(
        { message: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    console.log('Processing payment webhook:', {
      billId: webhook.id,
      paid: webhook.paid,
      state: webhook.state,
      amount: webhook.amount,
    });

    // Find the order by payment ID (Billplz bill ID)
    const order = await prisma.order.findFirst({
      where: {
        paymentId: webhook.id,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
        pendingMembership: true,
      },
    });

    if (!order) {
      console.warn('Order not found for payment ID:', webhook.id);
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Check if order is already processed
    if (order.paymentStatus === 'PAID' && webhook.paid) {
      console.log('Order already processed:', order.orderNumber);
      return NextResponse.json({ message: 'Order already processed' });
    }

    let newPaymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' =
      'PENDING';
    let newOrderStatus:
      | 'PENDING'
      | 'CONFIRMED'
      | 'PROCESSING'
      | 'SHIPPED'
      | 'DELIVERED'
      | 'CANCELLED'
      | 'REFUNDED' = 'PENDING';

    // Process payment status
    if (webhook.paid && webhook.state === 'paid') {
      newPaymentStatus = 'PAID';
      newOrderStatus = 'CONFIRMED';

      // Reserve inventory
      for (const item of order.orderItems) {
        if (item.product) {
          const newStock = Math.max(
            0,
            item.product.stockQuantity - item.quantity
          );
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          });
        }
      }

      // Activate pending membership if exists
      if (order.pendingMembership && order.user && !order.user.isMember) {
        const pending = order.pendingMembership;

        // Activate the membership
        const activated = await activateUserMembership(
          order.user.id,
          Number(pending.qualifyingAmount),
          order.id
        );

        if (activated) {
          // Remove the pending membership record
          await prisma.pendingMembership.delete({
            where: { id: pending.id },
          });

          console.log(
            'Membership activated for user:',
            order.user.id,
            'Order:',
            order.id
          );
        }
      } else if (order.user?.isMember) {
        // Update existing member's total
        const newTotal =
          Number(order.user.membershipTotal) + Number(order.total);
        await prisma.user.update({
          where: { id: order.user.id },
          data: {
            membershipTotal: newTotal,
          },
        });
      }
    } else if (webhook.state === 'deleted') {
      newPaymentStatus = 'FAILED';
      newOrderStatus = 'CANCELLED';
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
        updatedAt: new Date(),
      },
    });

    // Create audit log for payment status change
    await prisma.auditLog.create({
      data: {
        userId: order.userId,
        action: 'PAYMENT_STATUS_UPDATED',
        resource: 'ORDER',
        resourceId: order.id,
        details: {
          orderNumber: order.orderNumber,
          billplzBillId: webhook.id,
          previousPaymentStatus: order.paymentStatus,
          newPaymentStatus,
          previousOrderStatus: order.status,
          newOrderStatus,
          paidAmount: webhook.paid_amount,
          paidAt: webhook.paid_at,
          webhookState: webhook.state,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'billplz',
        userAgent: 'Billplz Webhook',
      },
    });

    // Send email notifications based on order status
    if (newPaymentStatus === 'PAID') {
      // Send order confirmation email
      await emailService.sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerName: order.user
          ? `${order.user.firstName} ${order.user.lastName}`
          : 'Valued Customer',
        customerEmail: order.user?.email || 'customer@example.com',
        items: order.orderItems.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: Number(item.appliedPrice),
        })),
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        paymentMethod: 'Billplz',
      });

      // Send member welcome email if this is their first membership
      if (
        order.wasEligibleForMembership &&
        order.user &&
        !order.user.isMember
      ) {
        await emailService.sendMemberWelcome({
          memberName: `${order.user.firstName} ${order.user.lastName}`,
          memberEmail: order.user.email,
          memberSince: new Date().toLocaleDateString('en-MY'),
          benefits: [
            'Exclusive member pricing on all products',
            'Priority customer support',
            'Early access to sales and promotions',
            'Member-only special offers',
          ],
        });
      }
    } else if (newPaymentStatus === 'FAILED') {
      // Send payment failure notification
      if (order.user) {
        await emailService.sendPaymentFailure({
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
          paymentMethod: 'Billplz',
        });
      }
    }

    console.log('Payment webhook processed successfully:', {
      orderNumber: order.orderNumber,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
    });

    return NextResponse.json({
      message: 'Webhook processed successfully',
      orderNumber: order.orderNumber,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
    });
  } catch (error) {
    console.error('Payment webhook processing error:', error);

    // For webhook errors, we should return 200 to prevent retries
    // but log the error for investigation
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'WEBHOOK_ERROR',
        resource: 'PAYMENT',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          webhookData: await request
            .clone()
            .formData()
            .then(fd => {
              const entries = Object.fromEntries(fd.entries());
              // Convert FormDataEntryValue to string to ensure JSON compatibility
              const sanitizedEntries: Record<string, any> = {};
              for (const [key, value] of Object.entries(entries)) {
                sanitizedEntries[key] =
                  typeof value === 'string' ? value : value.toString();
              }
              return sanitizedEntries;
            })
            .catch(() => ({})),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 200 } // Return 200 to prevent Billplz retries
    );
  }
}

// GET method for webhook verification (Billplz may use this for verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billplzId = searchParams.get('billplz_id');
  const billplzPaid = searchParams.get('billplz_paid');
  const billplzXSignature = searchParams.get('billplz_x_signature');

  if (!billplzId || !billplzPaid || !billplzXSignature) {
    return NextResponse.json(
      { message: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Verify the signature
  const webhookData = {
    billplz_id: billplzId,
    billplz_paid: billplzPaid,
    billplz_x_signature: billplzXSignature,
  };

  if (!billplzService.verifyWebhook(webhookData, billplzXSignature)) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  // Find order and return basic status
  const order = await prisma.order.findFirst({
    where: { paymentId: billplzId },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
    },
  });

  if (!order) {
    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    isPaid: billplzPaid === 'true',
  });
}
