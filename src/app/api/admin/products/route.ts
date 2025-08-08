/**
 * Admin Products API - JRM E-commerce Platform
 * Handles product creation, listing, and management for admin users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
// import { ProductStatus } from '@prisma/client'; // Not currently used
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  regularPrice: z.number().min(0, 'Regular price must be positive'),
  memberPrice: z.number().min(0, 'Member price must be positive'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert must be non-negative')
    .default(10),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  isPromotional: z.boolean().default(false),
  isQualifyingForMembership: z.boolean().default(true),
  promotionalPrice: z.number().optional(),
  promotionStartDate: z.string().optional(),
  promotionEndDate: z.string().optional(),
  memberOnlyUntil: z.string().optional(),
  earlyAccessStart: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1, 'Image URL is required'),
        altText: z.string().optional(),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const productData = createProductSchema.parse(body);

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { message: 'Product slug already exists', field: 'slug' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { message: 'SKU already exists', field: 'sku' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Category not found', field: 'categoryId' },
        { status: 400 }
      );
    }

    // Create product with transaction
    const result = await prisma.$transaction(async tx => {
      // Create the product
      const product = await tx.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description || null,
          shortDescription: productData.shortDescription || null,
          sku: productData.sku,
          barcode: productData.barcode || null,
          categoryId: productData.categoryId,
          regularPrice: productData.regularPrice,
          memberPrice: productData.memberPrice,
          costPrice: productData.costPrice,
          stockQuantity: productData.stockQuantity,
          lowStockAlert: productData.lowStockAlert,
          weight: productData.weight || null,
          dimensions: productData.dimensions || null,
          status: productData.status,
          featured: productData.featured,
          isPromotional: productData.isPromotional,
          isQualifyingForMembership: productData.isQualifyingForMembership,
          promotionalPrice: productData.promotionalPrice || null,
          promotionStartDate: productData.promotionStartDate
            ? new Date(productData.promotionStartDate)
            : null,
          promotionEndDate: productData.promotionEndDate
            ? new Date(productData.promotionEndDate)
            : null,
          memberOnlyUntil: productData.memberOnlyUntil
            ? new Date(productData.memberOnlyUntil)
            : null,
          earlyAccessStart: productData.earlyAccessStart
            ? new Date(productData.earlyAccessStart)
            : null,
        },
      });

      // Create product images if provided
      if (productData.images && productData.images.length > 0) {
        await tx.productImage.createMany({
          data: productData.images.map((image, index) => ({
            productId: product.id,
            url: image.url,
            altText: image.altText || productData.name,
            isPrimary: image.isPrimary || index === 0,
            sortOrder: index,
          })),
        });
      }

      return product;
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'PRODUCT',
        resourceId: result.id,
        details: {
          productName: result.name,
          sku: result.sku,
          category: category.name,
          status: result.status,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid product data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create product' },
      { status: 500 }
    );
  }
}

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const stockLevel = searchParams.get('stockLevel');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.categoryId = category;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (stockLevel) {
      switch (stockLevel) {
        case 'low':
          where.AND = [
            {
              stockQuantity: {
                lte: { stockQuantity: { lte: 'lowStockAlert' } },
              },
            },
            { stockQuantity: { gt: 0 } },
          ];
          break;
        case 'out':
          where.stockQuantity = 0;
          break;
        case 'in':
          where.stockQuantity = { gt: 0 };
          break;
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              url: true,
              altText: true,
              isPrimary: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
