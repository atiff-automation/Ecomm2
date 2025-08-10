/**
 * Product Export API Route - Malaysian E-commerce Platform
 * Exports products in CSV format for fulfillment and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
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

    // Generate CSV content
    const headers = [
      'SKU',
      'Name',
      'Description',
      'Short Description',
      'Category',
      'Category ID',
      'Regular Price',
      'Member Price',
      'Cost Price',
      'Stock Quantity',
      'Low Stock Alert',
      'Weight',
      'Dimensions',
      'Featured',
      'Is Promotional',
      'Is Qualifying For Membership',
      'Promotional Price',
      'Promotion Start Date',
      'Promotion End Date',
      'Member Only Until',
      'Early Access Start',
      'Status',
      'Meta Title',
      'Meta Description',
      'Primary Image URL',
      'Created At',
      'Updated At',
    ];

    const csvRows = [
      headers.join(','),
      ...products.map(product => {
        const row = [
          `"${product.sku || ''}"`,
          `"${(product.name || '').replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
          `"${product.categories?.[0]?.category?.name || ''}"`,
          `"${product.categories?.[0]?.category?.id || ''}"`,
          product.regularPrice || 0,
          product.memberPrice || 0,
          product.costPrice || 0,
          product.stockQuantity || 0,
          product.lowStockAlert || 0,
          product.weight || '',
          `"${(product.dimensions || '').replace(/"/g, '""')}"`,
          product.featured ? 'true' : 'false',
          product.isPromotional ? 'true' : 'false',
          product.isQualifyingForMembership ? 'true' : 'false',
          product.promotionalPrice || '',
          product.promotionStartDate ? product.promotionStartDate.toISOString() : '',
          product.promotionEndDate ? product.promotionEndDate.toISOString() : '',
          product.memberOnlyUntil ? product.memberOnlyUntil.toISOString() : '',
          product.earlyAccessStart ? product.earlyAccessStart.toISOString() : '',
          `"${product.status || ''}"`,
          `"${(product.metaTitle || '').replace(/"/g, '""')}"`,
          `"${(product.metaDescription || '').replace(/"/g, '""')}"`,
          `"${product.images[0]?.url || ''}"`,
          product.createdAt.toISOString(),
          product.updatedAt.toISOString(),
        ];
        return row.join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-export-${timestamp}.csv`;

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