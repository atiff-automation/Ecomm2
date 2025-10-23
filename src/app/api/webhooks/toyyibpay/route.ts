/**

export const dynamic = 'force-dynamic';

 * toyyibPay Payment Webhook Handler
 * Processes payment status updates from toyyibPay
 * Following the same pattern as the Billplz webhook handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { emailService } from '@/lib/email/email-service';
import { activateUserMembership } from '@/lib/membership';
import { processReferralOrderCompletion } from '@/lib/referrals/referral-utils';
import { updateOrderStatus } from '@/lib/notifications/order-status-handler';
import { toyyibPayConfig } from '@/lib/config/toyyibpay-config';
import { verifyWebhookSignature, getClientIP } from '@/lib/utils/security';
import { logWebhookRequest } from '@/lib/utils/webhook-logger';

// toyyibPay callback parameters
interface ToyyibPayCallback {
  refno: string; // Payment reference
  status: '1' | '2' | '3'; // 1=success, 2=pending, 3=fail
  reason: string; // Status reason
  billcode: string; // Bill code
  order_id: string; // External reference
  amount: string; // Payment amount in cents
  transaction_time: string; // Transaction timestamp
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  try {
    // Security: Log client IP and basic request info
    console.log('🔍 toyyibPay webhook received from IP:', clientIP);

    // Parse form data from webhook
    const formData = await request.formData();
    const webhookData: Record<string, string> = {};

    Array.from(formData.entries()).forEach(([key, value]) => {
      webhookData[key] = value.toString();
    });

    // Security: Verify webhook signature if available
    const signature =
      request.headers.get('x-signature') || webhookData.signature;
    if (signature && process.env.TOYYIBPAY_WEBHOOK_SECRET) {
      const payload = JSON.stringify(webhookData);
      const isValidSignature = verifyWebhookSignature(
        payload,
        signature,
        process.env.TOYYIBPAY_WEBHOOK_SECRET
      );

      if (!isValidSignature) {
        console.warn('⚠️ Invalid webhook signature from IP:', clientIP);
        return NextResponse.json(
          { message: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn(
        '⚠️ Webhook signature verification skipped - no signature or secret'
      );
    }

    console.log('🔍 toyyibPay webhook data:', {
      billcode: webhookData.billcode,
      status: webhookData.status,
      order_id: webhookData.order_id,
      amount: webhookData.amount,
      clientIP,
    });

    // Validate required parameters
    const requiredParams = [
      'refno',
      'status',
      'billcode',
      'order_id',
      'amount',
    ];
    for (const param of requiredParams) {
      if (!webhookData[param]) {
        console.warn(`Missing required parameter: ${param}`);
        return NextResponse.json(
          { message: `Missing required parameter: ${param}` },
          { status: 400 }
        );
      }
    }

    // Process webhook data
    const callback: ToyyibPayCallback = {
      refno: webhookData.refno,
      status: webhookData.status as '1' | '2' | '3',
      reason: webhookData.reason || '',
      billcode: webhookData.billcode,
      order_id: webhookData.order_id,
      amount: webhookData.amount,
      transaction_time:
        webhookData.transaction_time || new Date().toISOString(),
    };

    console.log('Processing toyyibPay webhook:', {
      billCode: callback.billcode,
      status: callback.status,
      orderId: callback.order_id,
      amount: callback.amount,
    });

    // Find the order by toyyibPay bill code
    const order = await prisma.order.findFirst({
      where: {
        toyyibpayBillCode: callback.billcode,
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
      console.warn(
        'Order not found for toyyibPay bill code:',
        callback.billcode
      );
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Check if order is already processed
    if (order.paymentStatus === 'PAID' && callback.status === '1') {
      console.log('Order already processed:', order.orderNumber);
      return NextResponse.json({ message: 'Order already processed' });
    }

    // Validate payment amount
    const expectedAmountCents = Math.round(Number(order.total) * 100);
    const receivedAmountCents = parseInt(callback.amount, 10);

    if (Math.abs(expectedAmountCents - receivedAmountCents) > 1) {
      // Allow 1 cent tolerance
      console.warn('Amount mismatch:', {
        expected: expectedAmountCents,
        received: receivedAmountCents,
        orderNumber: order.orderNumber,
      });

      // Log but don't reject - some gateways have minor rounding differences
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'TOYYIBPAY_AMOUNT_MISMATCH',
          resource: 'PAYMENT',
          details: {
            orderNumber: order.orderNumber,
            expectedAmount: expectedAmountCents,
            receivedAmount: receivedAmountCents,
            billCode: callback.billcode,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    let newPaymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' =
      'PENDING';
    let newOrderStatus:
      | 'PENDING'
      | 'PAID'
      | 'READY_TO_SHIP'
      | 'IN_TRANSIT'
      | 'OUT_FOR_DELIVERY'
      | 'DELIVERED'
      | 'CANCELLED'
      | 'REFUNDED' = 'PENDING';

    // Process payment status based on toyyibPay status codes
    if (callback.status === '1') {
      // Success
      newPaymentStatus = 'PAID';
      newOrderStatus = 'PAID'; // Fixed: Use PAID instead of non-existent CONFIRMED

      // ✅ STOCK ALREADY DEDUCTED: Stock was decremented during order creation
      // No need to deduct again here - this was causing double deduction bug
      console.log('✅ Payment confirmed - stock was already reserved during order creation');

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

      // Process referral completion if user exists and made their first qualifying order
      if (order.user) {
        try {
          await processReferralOrderCompletion(
            order.user.id,
            Number(order.total)
          );
        } catch (referralError) {
          console.error('Referral processing error:', referralError);
          // Don't fail the webhook processing if referral fails
        }
      }
    } else if (callback.status === '3') {
      // Failed - restore stock that was deducted during order creation
      newPaymentStatus = 'FAILED';
      newOrderStatus = 'CANCELLED';

      console.log('⚠️ Payment failed - restoring stock for order:', order.orderNumber);

      // Restore stock for all items in the cancelled order
      for (const item of order.orderItems) {
        const currentProduct = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, name: true }
        });

        if (currentProduct) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity, // Restore the stock
              },
            },
          });

          console.log(`📦 Stock restored for ${currentProduct.name}: +${item.quantity} (${currentProduct.stockQuantity} → ${currentProduct.stockQuantity + item.quantity})`);
        }
      }

      console.log('✅ Stock restoration completed for cancelled order');
    } else if (callback.status === '2') {
      // Pending - keep current status, stock remains reserved
      newPaymentStatus = 'PENDING';
      newOrderStatus = 'PENDING';
      console.log('⏳ Payment still pending - stock remains reserved');
    }

    // Update order status directly without triggering notifications
    // Notifications are handled by the centralized payment-success webhook to avoid duplicates
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newOrderStatus,
        paymentStatus: newPaymentStatus,
        paymentId: callback.refno,
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Order ${order.orderNumber} updated: ${newOrderStatus}/${newPaymentStatus}`
    );

    // Create audit log for the order status change
    if (order.user) {
      await prisma.auditLog.create({
        data: {
          userId: order.user.id,
          action: 'ORDER_STATUS_CHANGE',
          resource: 'ORDER',
          resourceId: order.id,
          details: {
            orderNumber: order.orderNumber,
            newStatus: newOrderStatus,
            newPaymentStatus: newPaymentStatus,
            triggeredBy: 'toyyibpay-webhook',
            paymentMethod: 'TOYYIBPAY',
            toyyibpayBillCode: callback.billcode,
            toyyibpayRefNo: callback.refno,
            paidAmount: callback.amount,
            paymentStatus: callback.status,
            paymentReason: callback.reason,
            transactionTime: callback.transaction_time,
            webhookOrderId: callback.order_id,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    }

    // Send additional notifications if needed
    if (newPaymentStatus === 'PAID') {
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
          paymentMethod: 'toyyibPay',
        });
      }
    }

    console.log('toyyibPay webhook processed successfully:', {
      orderNumber: order.orderNumber,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
      billCode: callback.billcode,
    });

    // Log webhook to file for evidence
    logWebhookRequest({
      timestamp: new Date().toISOString(),
      method: 'POST',
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: webhookData,
      clientIp: clientIP,
      processed: true,
      result: {
        success: true,
        orderNumber: order.orderNumber,
        billCode: callback.billcode,
        status: callback.status,
      },
    });

    return NextResponse.json({
      message: 'Webhook processed successfully',
      orderNumber: order.orderNumber,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
      billCode: callback.billcode,
    });
  } catch (error) {
    console.error('toyyibPay webhook processing error:', error);

    // For webhook errors, we should return 200 to prevent retries
    // but log the error for investigation
    try {
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'TOYYIBPAY_WEBHOOK_ERROR',
          resource: 'PAYMENT',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 200 } // Return 200 to prevent toyyibPay retries
    );
  }
}

// GET method for webhook verification or status checking
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billcode = searchParams.get('billcode');
  const status_id = searchParams.get('status_id');

  if (!billcode) {
    return NextResponse.json(
      { message: 'Missing required parameter: billcode' },
      { status: 400 }
    );
  }

  try {
    // Find order and return basic status
    const order = await prisma.order.findFirst({
      where: { toyyibpayBillCode: billcode },
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
      total: Number(order.total),
      statusId: status_id,
      billCode: billcode,
    });
  } catch (error) {
    console.error('Error in toyyibPay webhook GET:', error);
    return NextResponse.json(
      { message: 'Error processing request' },
      { status: 500 }
    );
  }
}
