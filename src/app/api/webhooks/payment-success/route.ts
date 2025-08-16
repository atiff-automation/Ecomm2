/**
 * Payment Success Webhook - Malaysian E-commerce Platform
 * Handles payment gateway webhooks for successful payments
 * Manages order status updates and membership activation
 *
 * PRODUCTION FLOW:
 * 1. Customer completes checkout → Order created in database
 * 2. Payment gateway processes payment → Sends webhook to this endpoint
 * 3. Webhook updates order status and activates membership if applicable
 *
 * SIMULATION MODE:
 * For testing purposes, this webhook can handle cases where no order exists
 * by creating the order record from recent user cart data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { headers } from 'next/headers';
import { telegramService } from '@/lib/telegram/telegram-service';
import { MembershipService } from '@/lib/services/membership-service';

// NOTE: Business logic moved to MembershipService for proper separation of concerns

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderReference,
      amount,
      currency,
      status,
      transactionId,
      timestamp,
    } = body;

    console.log('🎯 Payment Success Webhook received:', {
      orderReference,
      amount,
      status,
      transactionId,
    });

    // In a real app, you'd verify the webhook signature here
    // For testing, we'll skip signature verification

    if (status !== 'PAID') {
      return NextResponse.json(
        { message: 'Payment not successful' },
        { status: 400 }
      );
    }

    // Find the order by order number (minimal data for payment confirmation)
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderReference },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        orderItems: {
          select: { 
            id: true,
            productName: true, 
            quantity: true, 
            appliedPrice: true 
          }
        },
      },
    });

    if (!order) {
      console.log('❌ Order not found for orderReference:', orderReference);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order not found',
          orderReference,
          note: 'Order should be created via /api/orders before payment processing'
        },
        { status: 404 }
      );
    }

    // ✅ CORRECT: Payment webhook ONLY handles payment confirmation
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentId: transactionId,
      },
    });

    console.log('✅ Payment confirmed for order:', order.orderNumber);

    // ✅ CORRECT: Delegate business logic to appropriate service
    let membershipActivated = false;
    if (order.userId) {
      console.log('🎯 Processing business logic for paid order:', order.id);
      const membershipResult = await MembershipService.processOrderForMembership(order.id);
      membershipActivated = membershipResult.membershipActivated;
      
      console.log('📊 Membership processing result:', {
        orderNumber: order.orderNumber,
        membershipActivated: membershipResult.membershipActivated,
        reason: membershipResult.reason,
        qualifyingTotal: membershipResult.qualifyingTotal
      });
    }

    // Send Telegram notification for successful order
    try {
      const customerName = order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : 'Valued Customer';

      await telegramService.sendNewOrderNotification({
        orderNumber: order.orderNumber,
        customerName,
        total: Number(order.total),
        items: order.orderItems.map(item => ({
          name: item.productName || item.product.name,
          quantity: item.quantity,
          price: Number(item.appliedPrice),
        })),
        paymentMethod: 'PAYMENT_GATEWAY',
        createdAt: new Date(),
      });
      console.log(
        '✅ Telegram notification sent for order:',
        order.orderNumber
      );
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
      // Don't fail the webhook if Telegram fails
    }

    console.log('✅ Payment webhook processed successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      orderReference,
      amount,
      membershipActivated,
      transactionId,
    });
  } catch (error) {
    console.error('❌ Payment webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error.message },
      { status: 500 }
    );
  }
}
