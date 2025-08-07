/**
 * Admin Member Management API - Malaysian E-commerce Platform
 * Provides member details and management for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/admin/membership/members - Get member list with details
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const sort = searchParams.get('sort') || 'recent';
    const search = searchParams.get('search');

    const limit = limitParam ? parseInt(limitParam, 10) : 25;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Build where clause
    const whereClause: any = {
      isMember: true,
    };

    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.OR = [
        {
          firstName: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build order by clause
    let orderBy: any = { memberSince: 'desc' }; // Default to recent

    switch (sort) {
      case 'name':
        orderBy = { firstName: 'asc' };
        break;
      case 'email':
        orderBy = { email: 'asc' };
        break;
      case 'oldest':
        orderBy = { memberSince: 'asc' };
        break;
      case 'recent':
      default:
        orderBy = { memberSince: 'desc' };
        break;
    }

    // Get members with related data
    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        memberSince: true,
        membershipTotal: true,
        orders: {
          where: { status: 'DELIVERED' },
          select: {
            id: true,
            total: true,
            memberDiscount: true,
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
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause,
    });

    // Format member data with calculations
    const formattedMembers = members.map(member => {
      const totalOrders = member.orders.length;
      const totalSpent = member.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const totalSavings = member.orders.reduce(
        (sum, order) => sum + Number(order.memberDiscount || 0),
        0
      );

      // Calculate favorite category
      const categoryCount = new Map<string, number>();
      member.orders.forEach(order => {
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

      return {
        id: member.id,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email,
        memberSince: member.memberSince?.toISOString() || '',
        membershipTotal: Number(member.membershipTotal || 0),
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        favoriteCategory,
        averageOrderValue:
          totalOrders > 0
            ? Math.round((totalSpent / totalOrders) * 100) / 100
            : 0,
      };
    });

    return NextResponse.json({
      members: formattedMembers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { message: 'Failed to fetch member data' },
      { status: 500 }
    );
  }
}
