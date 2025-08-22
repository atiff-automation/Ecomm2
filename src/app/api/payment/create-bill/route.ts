/**
 * Payment Bill Creation API
 * Creates payment bills for existing orders using the multi-gateway payment router system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { paymentRouter } from '@/lib/payments/payment-router';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Creating payment for order: ${orderId}`);

    // Get the order with addresses
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shippingAddress: true,
        billingAddress: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to current user (if logged in)
    const session = await getServerSession(authOptions);
    if (session?.user?.id && order.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // Check if payment has already been created
    if (order.paymentStatus !== 'PENDING') {
      return NextResponse.json(
        { message: `Payment already ${order.paymentStatus.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Determine customer info
    const customerInfo = {
      name: order.user?.name || 
            `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`,
      email: order.user?.email || order.guestEmail || '',
      phone: order.shippingAddress?.phone,
    };

    // Get payment method from order or use default
    const paymentMethodFromOrder = order.paymentMethod?.toUpperCase();
    let paymentMethod: 'BILLPLZ' | 'TOYYIBPAY' | undefined;
    
    if (paymentMethodFromOrder === 'BILLPLZ' || paymentMethodFromOrder === 'TOYYIBPAY') {
      paymentMethod = paymentMethodFromOrder;
    }

    console.log(`💳 Payment method for order ${order.orderNumber}: ${paymentMethod || 'AUTO'}`);

    // Create payment using the payment router
    const paymentResult = await paymentRouter.createPayment({
      orderNumber: order.orderNumber,
      customerInfo,
      amount: Number(order.total),
      description: `JRM E-commerce Order ${order.orderNumber}`,
      paymentMethod,
    });

    if (!paymentResult.success) {
      console.error('❌ Payment creation failed:', paymentResult.error);
      return NextResponse.json(
        {
          message: 'Failed to create payment',
          error: paymentResult.error,
        },
        { status: 500 }
      );
    }

    // Update order with payment details
    const updateData: any = {
      paymentId: paymentResult.billId,
    };

    // Handle toyyibPay specific fields
    if (paymentResult.paymentMethod === 'TOYYIBPAY') {
      updateData.toyyibpayBillCode = paymentResult.billCode;
      updateData.toyyibpayPaymentUrl = paymentResult.paymentUrl;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log(`✅ Payment created successfully for order ${order.orderNumber}`);
    console.log(`🔗 Payment URL: ${paymentResult.paymentUrl}`);

    // Redirect to payment URL
    if (paymentResult.paymentUrl) {
      return NextResponse.redirect(paymentResult.paymentUrl);
    }

    // Fallback JSON response
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
      },
      payment: {
        method: paymentResult.paymentMethod,
        billId: paymentResult.billId,
        billCode: paymentResult.billCode,
        paymentUrl: paymentResult.paymentUrl,
        externalReference: paymentResult.externalReference,
      },
    });

  } catch (error) {
    console.error('❌ Payment bill creation error:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  // Support POST method as well for form submissions
  const body = await request.json();
  const orderId = body.orderId;

  if (!orderId) {
    return NextResponse.json(
      { message: 'Order ID is required' },
      { status: 400 }
    );
  }

  // Create a new request with the orderId as a query parameter
  const url = new URL(request.url);
  url.searchParams.set('orderId', orderId);
  
  const newRequest = new NextRequest(url, {
    method: 'GET',
    headers: request.headers,
  });

  return GET(newRequest);
}