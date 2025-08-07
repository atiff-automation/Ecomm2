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
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const stockLevel = searchParams.get('stockLevel');
    const search = searchParams.get('search');

    // Build where clause (same as inventory route)
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

    // Get all matching products for export
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Create CSV content
    const csvHeaders = [
      'SKU',
      'Product Name',
      'Category',
      'Stock Quantity',
      'Low Stock Threshold',
      'Regular Price (RM)',
      'Member Price (RM)',
      'Status',
      'Created Date',
    ];

    const csvRows = products.map(product => [
      product.sku,
      `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in name
      product.category?.name || 'No Category',
      product.stockQuantity.toString(),
      (product.lowStockAlert || 10).toString(),
      product.regularPrice.toFixed(2),
      product.memberPrice.toFixed(2),
      product.status,
      product.createdAt.toLocaleDateString('en-MY'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');

    // Note: Admin activity logging would be implemented with AuditLog model
    // For now, we'll skip this until the model is properly set up

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Inventory export error:', error);
    return NextResponse.json(
      { error: 'Failed to export inventory' },
      { status: 500 }
    );
  }
}
