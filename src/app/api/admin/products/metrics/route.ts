/**
 * Product Metrics API - JRM E-commerce Platform
 * Provides database-wide product metrics for admin dashboard
 */

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
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const stockLevel = searchParams.get('stockLevel');

    // Build the same where clause as the main products API for filtered metrics
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.categories = {
        some: {
          categoryId: category,
        },
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (stockLevel && stockLevel !== 'all') {
      switch (stockLevel) {
        case 'low-stock':
          where.AND = [
            { stockQuantity: { lte: 10 } }, // Low stock threshold
            { stockQuantity: { gt: 0 } },
          ];
          break;
        case 'out-of-stock':
          where.stockQuantity = 0;
          break;
        case 'in-stock':
          where.stockQuantity = { gt: 10 }; // Above low stock threshold
          break;
      }
    }

    // Get metrics using database aggregations for better performance
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      // Total products (with filters applied)
      prisma.product.count({ where }),

      // Active products (with filters applied)
      prisma.product.count({
        where: { ...where, status: 'ACTIVE' }
      }),

      // Low stock products (with filters applied)
      prisma.product.count({
        where: {
          ...where,
          AND: [
            { stockQuantity: { lte: 10 } },
            { stockQuantity: { gt: 0 } },
          ],
        },
      }),

      // Out of stock products (with filters applied)
      prisma.product.count({
        where: { ...where, stockQuantity: 0 },
      }),
    ]);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    });
  } catch (error) {
    console.error('Error fetching product metrics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product metrics' },
      { status: 500 }
    );
  }
}