/**
 * Admin Membership Stats API - Malaysian E-commerce Platform
 * Provides membership analytics and statistics for admin dashboard
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/admin/membership/stats - Get membership statistics
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total members count
    const totalMembers = await prisma.user.count({
      where: { isMember: true },
    });

    // Get new members this month
    const newMembersThisMonth = await prisma.user.count({
      where: {
        isMember: true,
        memberSince: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Get member orders for calculations
    const memberOrders = await prisma.order.findMany({
      where: {
        user: { isMember: true },
        status: 'DELIVERED',
      },
      select: {
        total: true,
        memberDiscount: true,
      },
    });

    // Calculate average order value for members
    const totalOrderValue = memberOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const averageOrderValue =
      memberOrders.length > 0 ? totalOrderValue / memberOrders.length : 0;

    // Calculate total savings given to members
    const totalSavingsGiven = memberOrders.reduce(
      (sum, order) => sum + Number(order.memberDiscount || 0),
      0
    );

    // Calculate conversion rate (members vs total users)
    const totalUsers = await prisma.user.count();
    const conversionRate = totalUsers > 0 ? totalMembers / totalUsers : 0;

    // Additional member insights
    const memberOrdersThisMonth = await prisma.order.count({
      where: {
        user: { isMember: true },
        createdAt: {
          gte: firstDayOfMonth,
        },
        status: 'DELIVERED',
      },
    });

    // Top categories purchased by members
    const topCategories = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          user: { isMember: true },
          status: 'DELIVERED',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Get category names for top categories (optimized single query)
    const productIds = topCategories.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    // Create a map for efficient lookup
    const productMap = products.reduce(
      (acc, product) => {
        acc[product.id] = product;
        return acc;
      },
      {} as Record<string, (typeof products)[0]>
    );

    // Map the results efficiently
    const categoryData = topCategories.map(item => ({
      categoryName: productMap[item.productId]?.category?.name || 'Unknown',
      quantity: item._sum.quantity || 0,
    }));

    // Member growth trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const memberGrowthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);

      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - i + 1);
      monthEnd.setDate(0);

      const membersInMonth = await prisma.user.count({
        where: {
          isMember: true,
          memberSince: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      memberGrowthTrend.push({
        month: monthStart.toLocaleDateString('en-MY', {
          year: 'numeric',
          month: 'short',
        }),
        newMembers: membersInMonth,
      });
    }

    const stats = {
      totalMembers,
      newMembersThisMonth,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalSavingsGiven: Math.round(totalSavingsGiven * 100) / 100,
      conversionRate: Math.round(conversionRate * 10000) / 10000, // 4 decimal places
      memberOrdersThisMonth,
      topCategories: categoryData,
      memberGrowthTrend,
      insights: {
        avgSavingsPerMember:
          totalMembers > 0
            ? Math.round((totalSavingsGiven / totalMembers) * 100) / 100
            : 0,
        avgOrdersPerMember:
          totalMembers > 0
            ? Math.round((memberOrders.length / totalMembers) * 100) / 100
            : 0,
        totalMemberOrders: memberOrders.length,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch membership statistics' },
      { status: 500 }
    );
  }
}
