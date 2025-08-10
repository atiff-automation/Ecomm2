/**
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
      timestamp 
    } = body;

    console.log('❌ Payment Failed Webhook received:', {
      orderReference,
      amount,
      status,
      transactionId
    });

    // Find the order
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderReference }
    });

    if (order) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          paymentReference: transactionId
        }
      });
    }

    console.log('✅ Payment failure webhook processed');

    return NextResponse.json({
      success: true,
      message: 'Payment failure processed',
      orderReference,
      amount,
      transactionId
    });

  } catch (error) {
    console.error('❌ Payment failure webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error.message },
      { status: 500 }
    );
  }
}