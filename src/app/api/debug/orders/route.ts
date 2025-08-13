/**
 * Debug Orders API - Check what orders exist in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all orders with basic info
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isMember: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            productName: true,
          },
        },
      },
    });

    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        isMember: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        userId: order.userId,
        userEmail: order.user?.email,
        userIsMember: order.user?.isMember,
        itemCount: order.orderItems.length,
        createdAt: order.createdAt,
      })),
      users,
      totalOrders: await prisma.order.count(),
      totalUsers: await prisma.user.count(),
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
