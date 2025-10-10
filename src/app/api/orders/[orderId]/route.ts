/**
 * Single Order API - Malaysian E-commerce Platform
 * Get specific order details for authenticated users (customers and admins)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

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

    // Build where clause based on user role
    const whereClause: any = { id: orderId };

    // If not admin/staff, restrict to user's own orders
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.STAFF) {
      whereClause.userId = session.user.id;
    }

    // Fetch the specific order with all related data
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isMember: true,
            memberSince: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
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
        shipment: {
          include: {
            trackingEvents: {
              orderBy: { eventTime: 'desc' },
            },
          },
        },
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
      paidAt: order.paidAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,

      // User information
      user: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
            phone: order.user.phone,
            isMember: order.user.isMember,
            memberSince: order.user.memberSince?.toISOString() || null,
          }
        : null,
      guestEmail: order.guestEmail,

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
              sku: item.product.sku,
              images: item.product.images || [],
            }
          : null,
      })),
      shippingAddress: order.shippingAddress
        ? {
            id: order.shippingAddress.id,
            recipientName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            firstName: order.shippingAddress.firstName,
            lastName: order.shippingAddress.lastName,
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            phoneNumber: order.shippingAddress.phone,
            phone: order.shippingAddress.phone,
          }
        : null,
      billingAddress: order.billingAddress
        ? {
            id: order.billingAddress.id,
            recipientName: `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
            firstName: order.billingAddress.firstName,
            lastName: order.billingAddress.lastName,
            addressLine1: order.billingAddress.addressLine1,
            addressLine2: order.billingAddress.addressLine2,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
            phoneNumber: order.billingAddress.phone,
            phone: order.billingAddress.phone,
          }
        : null,
      shipment: order.shipment
        ? {
            id: order.shipment.id,
            trackingNumber: order.shipment.trackingNumber,
            status: order.shipment.status,
            courierName: order.shipment.courierName,
            serviceName: order.shipment.serviceName,
            estimatedDelivery: order.shipment.estimatedDelivery?.toISOString(),
            actualDelivery: order.shipment.actualDelivery?.toISOString(),
            trackingEvents: order.shipment.trackingEvents.map(event => ({
              eventName: event.eventName,
              description: event.description,
              timestamp: event.eventTime.toISOString(),
              location: event.location,
            })),
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
