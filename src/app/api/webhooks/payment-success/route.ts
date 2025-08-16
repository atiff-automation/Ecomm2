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
import { getBestPrice, productQualifiesForMembership } from '@/lib/promotions/promotion-utils';

/**
 * Calculate the actual qualifying total for membership based on order items
 * This ensures we check the final order state, not just stored values
 */
function calculateActualQualifyingTotal(orderItems: any[]): number {
  let qualifyingTotal = 0;
  
  for (const item of orderItems) {
    // Use the same logic as order creation: non-promotional qualifying products count at regular price
    if (item.product.isQualifyingForMembership && !item.product.isPromotional) {
      qualifyingTotal += Number(item.regularPrice) * item.quantity;
    }
  }
  
  return qualifyingTotal;
}

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

    // Find the order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderReference },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        pendingMembership: true, // Include pending membership for activation
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

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentId: transactionId,
      },
    });

    let membershipActivated = false;

    // Check if there's a pending membership to activate
    if (order.pendingMembership && order.userId && !order.user?.isMember) {
      console.log('🎯 Processing pending membership activation for order:', order.orderNumber);
      
      // CRITICAL: Re-calculate the actual qualifying total from order items
      // Don't trust stored values - cart might have changed after pending membership was created
      const actualQualifyingTotal = calculateActualQualifyingTotal(order.orderItems);
      const membershipThreshold = 80; // Should match system config
      
      console.log(`🔍 Membership eligibility check:`, {
        storedQualifyingAmount: order.pendingMembership.qualifyingAmount,
        actualQualifyingTotal,
        membershipThreshold,
        orderTotal: Number(order.total)
      });
      
      if (actualQualifyingTotal >= membershipThreshold) {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            isMember: true,
            memberSince: new Date(),
            membershipTotal: actualQualifyingTotal, // Use actual calculated total
          },
        });

        membershipActivated = true;
        console.log('✅ Membership activated for user from pending membership:', order.userId);
        console.log(`   - Actual qualifying amount: RM${actualQualifyingTotal} (threshold: RM${membershipThreshold})`);
      } else {
        console.log('❌ Membership NOT activated - actual qualifying amount below threshold:', {
          actualQualifyingTotal,
          membershipThreshold,
          shortfall: membershipThreshold - actualQualifyingTotal,
          reason: 'Cart was reduced after registration or contains only promotional items'
        });
      }

      // Always delete the pending membership record after processing
      await prisma.pendingMembership.delete({
        where: { id: order.pendingMembership.id },
      });
    } else if (order.userId && !order.user?.isMember && amount >= 80) {
      // Fallback: Direct activation for qualifying purchases (legacy flow)
      console.log('🎯 Qualifying purchase detected, activating membership (legacy flow)...');

      await prisma.user.update({
        where: { id: order.userId },
        data: {
          isMember: true,
          memberSince: new Date(),
        },
      });

      membershipActivated = true;
      console.log('✅ Membership activated for user (legacy):', order.userId);
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
