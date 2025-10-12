import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Handle tab-based filtering
    if (status) {
      if (status === 'awaiting-payment') {
        // Orders waiting for payment
        where.paymentStatus = 'PENDING';
      } else if (status === 'processing') {
        // Paid orders awaiting fulfillment (not yet shipped)
        where.paymentStatus = 'PAID';
        where.status = { in: ['PAID', 'READY_TO_SHIP'] };
      } else if (status === 'shipped') {
        // Orders in transit or out for delivery
        where.status = { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] };
      } else if (status === 'delivered') {
        // Successfully delivered orders
        where.status = 'DELIVERED';
      } else if (status === 'cancelled') {
        // Cancelled orders
        where.status = 'CANCELLED';
      } else if (status !== 'all') {
        // Handle direct status filtering (uppercase)
        where.status = status.toUpperCase();
      }
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                weight: true,
              },
            },
          },
        },
        shippingAddress: true,
        shipment: {
          select: {
            id: true,
            courierName: true,
            serviceName: true,
            status: true,
            trackingNumber: true,
            estimatedDelivery: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : 'Guest',
      customerEmail: order.user?.email || 'N/A',
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.orderItems.length,

      // Airway bill fields
      airwayBillGenerated: order.airwayBillGenerated,
      airwayBillNumber: order.airwayBillNumber,
      airwayBillUrl: order.airwayBillUrl,
      airwayBillGeneratedAt: order.airwayBillGeneratedAt?.toISOString(),

      // Shipment fields (matching frontend interface)
      shipment: order.shipment
        ? {
            trackingNumber: order.shipment.trackingNumber,
            status: order.shipment.status?.toLowerCase(),
            courierName: order.shipment.courierName,
            estimatedDelivery: order.shipment.estimatedDelivery?.toISOString(),
            lastTrackedAt: order.updatedAt.toISOString(), // Use order updated time as approximation
          }
        : null,

      shippingAddress: order.shippingAddress
        ? {
            address: order.shippingAddress.addressLine1,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postcode: order.shippingAddress.postalCode,
          }
        : null,

      // Courier service fields (for fulfillment)
      selectedCourierServiceId: order.selectedCourierServiceId,
      courierServiceDetail: order.courierServiceDetail,

      // Order items (matching frontend interface OrderTableData)
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
      })),

      // Legacy items field for backward compatibility
      items: order.orderItems.map(item => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        weight: item.product.weight || 0.5,
      })),

      // User information (matching frontend interface)
      user: order.user
        ? {
            firstName: order.user.firstName,
            lastName: order.user.lastName,
            email: order.user.email,
          }
        : null,
      guestEmail: order.guestEmail,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      filters: {
        status,
        search,
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
