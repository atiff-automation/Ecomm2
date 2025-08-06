/**
 * Member Orders API - Malaysian E-commerce Platform
 * Provides member order history with savings tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/member/orders - Get member order history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!session.user.isMember) {
      return NextResponse.json(
        { message: 'Member access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const status = searchParams.get('status');

    // Validate and sanitize parameters
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100)
      : 10;
    const offset = offsetParam
      ? Math.max(parseInt(offsetParam, 10) || 0, 0)
      : 0;

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
    };

    // Validate status against allowed values to prevent SQL injection
    const allowedStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];
    if (status && allowedStatuses.includes(status.toUpperCase())) {
      whereClause.status = status.toUpperCase();
    }

    // Get orders with detailed information
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.order.count({
      where: whereClause,
    });

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: Number(order.total),
      memberSavings: Number(order.memberDiscount || 0),
      itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      items: order.orderItems.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.appliedPrice),
        regularPrice: Number(item.regularPrice),
        savings: Number(item.regularPrice) - Number(item.appliedPrice),
        image: item.product?.images?.[0] || null,
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching member orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}
