/**
 * Product Export API Route - Malaysian E-commerce Platform
 * Exports products in CSV format for fulfillment and analysis
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { productExportParamsSchema } from '@/lib/validation/product-export';
import { ZodError } from 'zod';

// Utility function for filename formatting
const formatDateForFilename = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0].replace(/-/g, '');
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      productIds: searchParams.get('productIds') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    };

    // Validate using Zod schema
    let validatedParams;
    try {
      validatedParams = productExportParamsSchema.parse(rawParams);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            message: 'Invalid export parameters',
            errors: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Build where clause with proper type safety
    interface WhereClause {
      id?: { in: string[] };
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        sku?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      categories?: {
        some: {
          categoryId: string;
        };
      };
      status?: string;
    }

    const where: WhereClause = {};

    // Priority 1: Export specific product IDs if provided
    if (validatedParams.productIds && validatedParams.productIds.length > 0) {
      where.id = { in: validatedParams.productIds };
    } else {
      // Priority 2: Use filter-based export
      if (validatedParams.search) {
        where.OR = [
          { name: { contains: validatedParams.search, mode: 'insensitive' } },
          { sku: { contains: validatedParams.search, mode: 'insensitive' } },
          { description: { contains: validatedParams.search, mode: 'insensitive' } },
        ];
      }

      if (validatedParams.categoryId) {
        where.categories = {
          some: {
            categoryId: validatedParams.categoryId,
          },
        };
      }

      if (validatedParams.status) {
        where.status = validatedParams.status;
      }
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
