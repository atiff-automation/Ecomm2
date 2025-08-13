/**
 * Member Order Detail API - Malaysian E-commerce Platform
 * Get specific order details for authenticated members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch the specific order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id, // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    altText: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Transform the data for the frontend
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingCost: Number(order.shippingCost),
      discountAmount: Number(order.discountAmount || 0),
      total: Number(order.total),
      memberDiscount: Number(order.memberDiscount || 0),
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      trackingNumber: order.trackingNumber,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        regularPrice: Number(item.regularPrice),
        memberPrice: Number(item.memberPrice),
        appliedPrice: Number(item.appliedPrice),
        totalPrice: Number(item.totalPrice),
        productName: item.productName,
        productSku: item.productSku,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              images: item.product.images || [],
            }
          : null,
      })),
      shippingAddress: order.shippingAddress
        ? {
            id: order.shippingAddress.id,
            firstName: order.shippingAddress.firstName,
            lastName: order.shippingAddress.lastName,
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone,
          }
        : null,
      billingAddress: order.billingAddress
        ? {
            id: order.billingAddress.id,
            firstName: order.billingAddress.firstName,
            lastName: order.billingAddress.lastName,
            addressLine1: order.billingAddress.addressLine1,
            addressLine2: order.billingAddress.addressLine2,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
            phone: order.billingAddress.phone,
          }
        : null,
    };

    return NextResponse.json(orderData);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
