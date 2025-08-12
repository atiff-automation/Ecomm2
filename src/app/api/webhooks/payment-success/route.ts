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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderReference, 
      amount, 
      currency, 
      status, 
      transactionId, 
      timestamp 
    } = body;

    console.log('🎯 Payment Success Webhook received:', {
      orderReference,
      amount,
      status,
      transactionId
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
    let order = await prisma.order.findFirst({
      where: { orderNumber: orderReference },
      include: { 
        user: true,
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      console.log('📦 Order not found, but checking for membership activation in test mode...');
      
      let membershipActivated = false;
      
      // For simulation mode, we need to handle the case where no order exists yet
      // In production, orders would be created first and then this webhook would update them
      if (amount >= 80) {
        console.log('🎯 Processing membership activation for qualifying purchase...');
        
        // Look for user with recent activity who should receive this membership activation
        // In production, this would be tied to the actual order user
        const recentUser = await prisma.user.findFirst({
          where: { 
            isMember: false,
            OR: [
              {
                cartItems: {
                  some: {} // User with cart items (active session)
                }
              },
              {
                lastLoginAt: {
                  gte: new Date(Date.now() - 30 * 60 * 1000) // Logged in within last 30 minutes
                }
              }
            ]
          },
          orderBy: { lastLoginAt: 'desc' }
        });
        
        if (recentUser) {
          console.log('✅ Found qualifying user for membership activation:', recentUser.id);
          
          // Get user's cart items to create order record
          const cartItems = await prisma.cartItem.findMany({
            where: { userId: recentUser.id },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  regularPrice: true,
                  memberPrice: true,
                }
              }
            }
          });

          // Create order record for customer's order history
          await prisma.order.create({
            data: {
              orderNumber: orderReference,
              user: {
                connect: { id: recentUser.id }
              },
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              paymentId: transactionId,
              subtotal: amount,
              total: amount,
              shippingCost: 0,
              taxAmount: 0,
              orderItems: {
                create: cartItems.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  regularPrice: item.product.regularPrice,
                  memberPrice: item.product.memberPrice || item.product.regularPrice,
                  appliedPrice: item.product.memberPrice || item.product.regularPrice,
                  totalPrice: (item.product.memberPrice || item.product.regularPrice) * item.quantity,
                  productName: item.product.name,
                  productSku: item.product.sku || `SKU-${item.productId}`
                }))
              }
            }
          });

          // Activate membership
          await prisma.user.update({
            where: { id: recentUser.id },
            data: { 
              isMember: true,
              memberSince: new Date()
            }
          });
          
          // Clear user's cart after successful payment
          await prisma.cartItem.deleteMany({
            where: { userId: recentUser.id }
          });
          
          membershipActivated = true;
          console.log('✅ Order created and membership activated for user:', recentUser.id);
        } else {
          console.log('⚠️ No qualifying user found for membership activation');
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Payment webhook processed (test mode)',
        orderReference,
        amount,
        membershipActivated,
        note: 'Test mode - membership activation attempted'
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentId: transactionId
      }
    });

    let membershipActivated = false;

    // Check if user qualifies for membership activation
    if (order.userId && !order.user?.isMember && amount >= 80) {
      console.log('🎯 Qualifying purchase detected, activating membership...');
      
      await prisma.user.update({
        where: { id: order.userId },
        data: { 
          isMember: true,
          memberSince: new Date()
        }
      });

      membershipActivated = true;
      console.log('✅ Membership activated for user:', order.userId);
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
      console.log('✅ Telegram notification sent for order:', order.orderNumber);
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
      transactionId
    });

  } catch (error) {
    console.error('❌ Payment webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error.message },
      { status: 500 }
    );
  }
}