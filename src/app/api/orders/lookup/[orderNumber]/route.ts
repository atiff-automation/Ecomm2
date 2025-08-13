/**
 * Public Order Lookup API - Malaysian E-commerce Platform
 * Allows order details lookup by order number for thank-you pages
 * This is intentionally public for post-purchase confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface Params {
  orderNumber: string;
}

/**
 * GET /api/orders/lookup/[orderNumber] - Get order details by order number
 * Public endpoint for order confirmation pages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { orderNumber } = params;

    if (!orderNumber) {
      return NextResponse.json(
        { message: 'Order number is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking up order:', orderNumber);

    // Find the order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isMember: true,
            memberSince: true,
          },
        },
      },
    });

    if (!order) {
      console.log('❌ Order not found:', orderNumber);
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order found:', order.id);

    // Transform data for response
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingCost: Number(order.shippingCost),
      discountAmount: Number(order.discountAmount) || 0,
      memberDiscount: Number(order.memberDiscount) || 0,
      createdAt: order.createdAt.toISOString(),
      items: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.regularPrice),
        finalPrice: Number(item.appliedPrice),
        product: {
          name: item.productName,
          slug: item.product?.slug || '',
          primaryImage: item.product?.images[0] || null,
        },
      })),
      shippingAddress: order.shippingAddress as any,
      customer: order.user ? {
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        isMember: order.user.isMember,
        memberSince: order.user.memberSince?.toISOString(),
      } : {
        firstName: (order.shippingAddress as any)?.firstName || 'Guest',
        lastName: (order.shippingAddress as any)?.lastName || 'Customer',
        email: (order.shippingAddress as any)?.email || '',
        isMember: false,
      },
    };

    return NextResponse.json(orderData);
  } catch (error) {
    console.error('❌ Order lookup error:', error);
    return NextResponse.json(
      { message: 'Failed to lookup order' },
      { status: 500 }
    );
  }
}