import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total orders and revenue
    const orderStats = await prisma.order.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Get current month revenue
    const currentMonthRevenue = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    // Get last month revenue
    const lastMonthRevenue = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: currentMonthStart,
        },
      },
    });

    // Get pending orders count
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get customer stats
    const customerStats = await prisma.user.aggregate({
      _count: {
        id: true,
      },
      where: {
        role: UserRole.CUSTOMER,
      },
    });

    // Get member count
    const memberCount = await prisma.user.count({
      where: {
        role: UserRole.CUSTOMER,
        isMember: true,
      },
    });

    // Get low stock products (assuming stockQuantity < 10 is low)
    const lowStockCount = await prisma.product.count({
      where: {
        stockQuantity: {
          lt: 10,
        },
      },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Calculate membership metrics
    const totalCustomers = customerStats._count.id || 0;
    const totalMembers = memberCount || 0;
    const conversionRate =
      totalCustomers > 0
        ? Math.round((totalMembers / totalCustomers) * 100)
        : 0;

    // Calculate revenue percentage change
    const currentRevenue = currentMonthRevenue._sum.total || 0;
    const previousRevenue = lastMonthRevenue._sum.total || 0;

    let revenuePercentageChange = 0;
    let revenueChangeDirection: 'increase' | 'decrease' | 'no-change' = 'no-change';

    if (previousRevenue > 0) {
      revenuePercentageChange = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
      revenueChangeDirection = currentRevenue > previousRevenue ? 'increase' :
                              currentRevenue < previousRevenue ? 'decrease' : 'no-change';
    } else if (currentRevenue > 0) {
      revenuePercentageChange = 100; // New revenue this month
      revenueChangeDirection = 'increase';
    }

    // Get average order values for members vs non-members
    const memberOrderStats = await prisma.order.aggregate({
      _avg: {
        total: true,
      },
      where: {
        user: {
          isMember: true,
        },
      },
    });

    const nonMemberOrderStats = await prisma.order.aggregate({
      _avg: {
        total: true,
      },
      where: {
        user: {
          isMember: false,
        },
      },
    });

    const dashboardStats = {
      totalOrders: orderStats._count.id || 0,
      totalRevenue: orderStats._sum.total || 0,
      totalCustomers: totalCustomers,
      totalMembers: totalMembers,
      pendingOrders: pendingOrdersCount || 0,
      lowStockProducts: lowStockCount || 0,
      revenueMetrics: {
        currentMonthRevenue: currentRevenue,
        previousMonthRevenue: previousRevenue,
        percentageChange: revenuePercentageChange,
        changeDirection: revenueChangeDirection,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user
          ? `${order.user.firstName} ${order.user.lastName}`
          : 'Guest',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
      membershipMetrics: {
        conversionRate,
        avgMemberOrderValue: memberOrderStats._avg.total || 0,
        avgNonMemberOrderValue: nonMemberOrderStats._avg.total || 0,
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
