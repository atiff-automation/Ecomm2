/**
 * Admin Products API - JRM E-commerce Platform
 * Handles product creation, listing, and management for admin users
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkCSRF } from '@/lib/middleware/with-csrf';
import { prisma } from '@/lib/db/prisma';
import { logAudit } from '@/lib/audit/logger';
import { requireAdminRole } from '@/lib/auth/authorization';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
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
  categoryIds: z
    .array(z.string().min(1, 'Category ID is required'))
    .min(1, 'At least one category is required'),
  regularPrice: z.union([
    z.number().min(0, 'Regular price must be positive'),
    z
      .string()
      .transform(val => (val === '' ? 0 : parseFloat(val)))
      .refine(
        val => !isNaN(val) && val >= 0,
        'Regular price must be a positive number'
      ),
  ]),
  memberPrice: z
    .union([
      z.number().min(0, 'Member price must be positive'),
      z
        .string()
        .transform(val => (val === '' ? null : parseFloat(val)))
        .refine(
          val => val === null || (!isNaN(val) && val >= 0),
          'Member price must be a positive number'
        ),
    ])
    .nullable()
    .optional(),
  stockQuantity: z.union([
    z.number().int().min(0, 'Stock quantity must be non-negative'),
    z
      .string()
      .transform(val => (val === '' ? 0 : parseInt(val)))
      .refine(
        val => !isNaN(val) && val >= 0 && Number.isInteger(val),
        'Stock quantity must be a non-negative integer'
      ),
  ]),
  lowStockAlert: z
    .union([
      z.number().int().min(0, 'Low stock alert must be non-negative'),
      z
        .string()
        .transform(val => (val === '' ? 10 : parseInt(val)))
        .refine(
          val => !isNaN(val) && val >= 0 && Number.isInteger(val),
          'Low stock alert must be a non-negative integer'
        ),
    ])
    .default(10),
  weight: z.union([
    z.number().min(0.01, 'Weight must be at least 0.01 kg'),
    z
      .string()
      .min(1, 'Weight is required')
      .transform(val => parseFloat(val))
      .refine(
        val => !isNaN(val) && val >= 0.01,
        'Weight must be at least 0.01 kg'
      ),
  ]),
  dimensions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  isPromotional: z.boolean().default(false),
  isQualifyingForMembership: z.boolean().default(true),
  promotionalPrice: z
    .union([
      z.number().min(0, 'Promotional price must be positive'),
      z
        .string()
        .transform(val => (val === '' ? undefined : parseFloat(val)))
        .refine(
          val => val === undefined || (!isNaN(val) && val >= 0),
          'Promotional price must be a positive number'
        ),
    ])
    .optional(),
  promotionStartDate: z.union([z.string().datetime(), z.null()]).optional(),
  promotionEndDate: z.union([z.string().datetime(), z.null()]).optional(),
  memberOnlyUntil: z.union([z.string().datetime(), z.null()]).optional(),
  earlyAccessStart: z.union([z.string().datetime(), z.null()]).optional(),
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
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();
    console.log('🔍 Received request body:', JSON.stringify(body, null, 2));
    const productData = createProductSchema.parse(body);

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existingSlug) {
      console.log('🔍 Slug already exists:', productData.slug);
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
      console.log('🔍 SKU already exists:', productData.sku);
      return NextResponse.json(
        { message: 'SKU already exists', field: 'sku' },
        { status: 400 }
      );
    }

    // Verify all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: productData.categoryIds } },
    });

    if (categories.length !== productData.categoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = productData.categoryIds.filter(
        id => !foundIds.includes(id)
      );
      return NextResponse.json(
        {
          message: `Categories not found: ${missingIds.join(', ')}`,
          field: 'categoryIds',
        },
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
          regularPrice: productData.regularPrice,
          memberPrice: productData.memberPrice || productData.regularPrice,
          stockQuantity: productData.stockQuantity,
          lowStockAlert: productData.lowStockAlert,
          weight: productData.weight,
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

      // Create product-category relationships
      await tx.productCategory.createMany({
        data: productData.categoryIds.map(categoryId => ({
          productId: product.id,
          categoryId: categoryId,
        })),
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

    // Log the action (skip if audit log fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          resource: 'PRODUCT',
          resourceId: result.id,
          details: {
            productName: result.name,
            sku: result.sku,
            categories: categories.map(c => c.name).join(', '),
            status: result.status,
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue execution - audit log failure should not block product creation
    }

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
      console.error(
        '🔍 Zod validation errors:',
        JSON.stringify(error.issues, null, 2)
      );
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
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const stockLevel = searchParams.get('stockLevel');
    const promotionStatus = searchParams.get('promotionStatus');

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

    // Note: Stock level filtering is handled after fetching
    // Prisma doesn't support comparing two columns directly in WHERE clause
    let stockLevelFilter = stockLevel;

    if (promotionStatus && promotionStatus !== 'all') {
      const now = new Date();

      switch (promotionStatus) {
        case 'active':
          where.isPromotional = true;
          where.promotionStartDate = { lte: now };
          where.promotionEndDate = { gte: now };
          break;
        case 'scheduled':
          where.isPromotional = true;
          where.promotionStartDate = { gt: now };
          break;
        case 'none':
          where.isPromotional = false;
          break;
      }
    }

    const skip = (page - 1) * limit;

    const [allProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
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

    // Apply stock level filtering based on each product's lowStockAlert
    let products = allProducts;
    if (stockLevelFilter && stockLevelFilter !== 'all') {
      products = allProducts.filter(product => {
        switch (stockLevelFilter) {
          case 'low-stock':
            return (
              product.stockQuantity <= product.lowStockAlert &&
              product.stockQuantity > 0
            );
          case 'out-of-stock':
            return product.stockQuantity === 0;
          case 'in-stock':
            return product.stockQuantity > product.lowStockAlert;
          default:
            return true;
        }
      });
    }

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
