/**

export const dynamic = 'force-dynamic';

 * Product Export API Route - Malaysian E-commerce Platform
 * Exports products in CSV format for fulfillment and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
// Utility function for filename formatting
const formatDateForFilename = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    if (status) {
      where.status = status;
    }

    // Fetch products with related data
    const products = await prisma.product.findMany({
      where,
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        images: {
          where: { isPrimary: true },
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV content - MUST match import template format exactly
    const headers = [
      'sku',
      'name',
      'description',
      'shortDescription',
      'categoryName',
      'regularPrice',
      'memberPrice',
      'stockQuantity',
      'lowStockAlert',
      'weight',
      'dimensionLength',
      'dimensionWidth',
      'dimensionHeight',
      'featured',
      'isPromotional',
      'isQualifyingForMembership',
      'promotionalPrice',
      'promotionStartDate',
      'promotionEndDate',
      'memberOnlyUntil',
      'earlyAccessStart',
      'metaTitle',
      'metaDescription',
      'metaKeywords',
    ];

    const csvRows = [
      headers.join(','),
      ...products.map(product => {
        // Extract dimensions from JSON object
        let dimensionLength = '';
        let dimensionWidth = '';
        let dimensionHeight = '';

        if (product.dimensions && typeof product.dimensions === 'object') {
          const dims = product.dimensions as any;
          dimensionLength = dims.length || '';
          dimensionWidth = dims.width || '';
          dimensionHeight = dims.height || '';
        }

        const row = [
          `"${product.sku || ''}"`,
          `"${(product.name || '').replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
          `"${product.categories?.[0]?.category?.name || ''}"`,
          product.regularPrice || 0,
          product.memberPrice || 0,
          product.stockQuantity || 0,
          product.lowStockAlert || 0,
          product.weight || '',
          dimensionLength,
          dimensionWidth,
          dimensionHeight,
          product.featured ? 'TRUE' : 'FALSE',
          product.isPromotional ? 'TRUE' : 'FALSE',
          product.isQualifyingForMembership ? 'TRUE' : 'FALSE',
          product.promotionalPrice || '',
          product.promotionStartDate
            ? product.promotionStartDate.toISOString().split('T')[0]
            : '',
          product.promotionEndDate
            ? product.promotionEndDate.toISOString().split('T')[0]
            : '',
          product.memberOnlyUntil
            ? product.memberOnlyUntil.toISOString().split('T')[0]
            : '',
          product.earlyAccessStart
            ? product.earlyAccessStart.toISOString().split('T')[0]
            : '',
          `"${(product.metaTitle || '').replace(/"/g, '""')}"`,
          `"${(product.metaDescription || '').replace(/"/g, '""')}"`,
          `"${(Array.isArray(product.metaKeywords) ? product.metaKeywords.join(', ') : '').replace(/"/g, '""')}"`,
        ];
        return row.join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = formatDateForFilename(new Date());
    const filename = `Products_Export_${timestamp}_${products.length}Products.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { message: 'Export failed. Please try again.' },
      { status: 500 }
    );
  }
}
