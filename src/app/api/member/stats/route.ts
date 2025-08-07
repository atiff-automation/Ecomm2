/**
 * Member Stats API - Malaysian E-commerce Platform
 * Provides member statistics including savings, orders, and analytics
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/member/stats - Get member statistics and savings
 */
export async function GET() {
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

    // Get user details for member since date
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        memberSince: true,
        membershipTotal: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get order statistics
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: 'DELIVERED', // Only count completed orders
      },
      select: {
        id: true,
        total: true,
        memberDiscount: true,
        createdAt: true,
        orderItems: {
          select: {
            product: {
              select: {
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const totalSavings = orders.reduce(
      (sum, order) => sum + Number(order.memberDiscount),
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Find favorite category
    const categoryCount = new Map<string, number>();
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const categoryName = item.product.category.name;
        categoryCount.set(
          categoryName,
          (categoryCount.get(categoryName) || 0) + 1
        );
      });
    });

    let favoriteCategory = '';
    let maxCount = 0;
    categoryCount.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = category;
      }
    });

    const stats = {
      totalSavings,
      totalOrders,
      totalSpent,
      averageOrderValue,
      memberSince: user.memberSince?.toISOString() || null,
      favoriteCategory,
      membershipTotal: Number(user.membershipTotal || 0),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching member stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch member statistics' },
      { status: 500 }
    );
  }
}
