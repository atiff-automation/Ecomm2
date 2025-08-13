import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const membership = searchParams.get('membership');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: UserRole.CUSTOMER,
    };

    if (membership) {
      switch (membership) {
        case 'members':
          where.isMember = true;
          break;
        case 'non-members':
          where.isMember = false;
          break;
      }
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get customers with order statistics
    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
            paymentStatus: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const formattedCustomers = customers.map(customer => {
      // Count all paid orders, not just delivered ones
      const paidOrders = customer.orders.filter(
        order => order.paymentStatus === 'PAID'
      );

      // Calculate total spent from paid orders
      const totalSpent = paidOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );

      // Get the most recent order
      const lastOrder =
        customer.orders.length > 0
          ? customer.orders.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0]
          : null;

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        isMember: customer.isMember,
        memberSince: customer.memberSince?.toISOString() || null,
        totalOrders: paidOrders.length,
        totalSpent,
        lastOrderAt: lastOrder?.createdAt.toISOString() || null,
        status: customer.status,
        createdAt: customer.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
