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
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const stockLevel = searchParams.get('stockLevel');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (category) {
      where.categoryId = category;
    }

    if (status) {
      where.status = status;
    }

    if (stockLevel) {
      switch (stockLevel) {
        case 'in-stock':
          where.stockQuantity = { gt: 0 };
          break;
        case 'low-stock':
          where.AND = [
            { stockQuantity: { gt: 0 } },
            { stockQuantity: { lte: { lowStockAlert: true } } },
          ];
          break;
        case 'out-of-stock':
          where.stockQuantity = 0;
          break;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products with category info
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stockQuantity,
      price: product.regularPrice,
      memberPrice: product.memberPrice,
      category: product.category,
      status: product.status,
      lowStockThreshold: product.lowStockAlert || 10,
      createdAt: product.createdAt.toISOString(),
    }));

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
