/**
 * Payment Transactions API
 * Provides transaction listing and filtering for admin
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/payments/transactions
 * Returns paginated list of payment transactions
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - Admin/Staff only
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPERADMIN &&
      session.user.role !== UserRole.STAFF
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';

    // Build filter conditions
    const where: any = {};

    // Search filter (order number, customer name, email)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Payment status filter
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Execute queries in parallel
    const [transactions, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          email: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          paymentId: true,
          toyyibpayBillCode: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Format transactions for response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      orderNumber: transaction.orderNumber,
      customerName: transaction.customerName,
      customerEmail: transaction.email,
      amount: transaction.total,
      paymentStatus: transaction.paymentStatus,
      paymentMethod: transaction.paymentMethod,
      paymentId: transaction.paymentId,
      toyyibpayBillCode: transaction.toyyibpayBillCode,
      createdAt: transaction.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Payment transactions API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch payment transactions',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
