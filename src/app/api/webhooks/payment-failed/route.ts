/**

export const dynamic = 'force-dynamic';

 * TEST Payment Failed Webhook - Malaysian E-commerce Platform
 * Simulates payment gateway webhook for failed payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

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

    console.log('❌ Payment Failed Webhook received:', {
      orderReference,
      amount,
      status,
      transactionId,
    });

    // Find the order with order items
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderReference },
      include: {
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            productName: true,
          },
        },
      },
    });

    if (order) {
      // Restore stock for all items in the cancelled order
      console.log('⚠️ Payment failed - restoring stock for order:', order.orderNumber);

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

      console.log('✅ Stock restoration completed for failed payment');

      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          paymentId: transactionId,
        },
      });
    }

    console.log('✅ Payment failure webhook processed');

    return NextResponse.json({
      success: true,
      message: 'Payment failure processed',
      orderReference,
      amount,
      transactionId,
    });
  } catch (error) {
    console.error('❌ Payment failure webhook error:', error);
    return NextResponse.json(
      {
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
