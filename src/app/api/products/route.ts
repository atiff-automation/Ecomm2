/**
 * Products API Routes - Malaysian E-commerce Platform
 * Handles product listing, creation, and management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  regularPrice: z.number().positive('Regular price must be positive'),
  memberPrice: z
    .number()
    .positive('Member price must be positive')
    .nullable()
    .optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert cannot be negative')
    .default(10),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().default(false),
  isPromotional: z.boolean().default(false),
  isQualifyingForMembership: z.boolean().default(true),
  promotionalPrice: z
    .number()
    .positive('Promotional price must be positive')
    .optional(),
  promotionStartDate: z.string().datetime().optional(),
  promotionEndDate: z.string().datetime().optional(),
  memberOnlyUntil: z.string().datetime().optional(),
  earlyAccessStart: z.string().datetime().optional(),
});

const searchProductsSchema = z.object({
  page: z
    .string()
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .transform(Number)
    .default(() => 20),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(Boolean).optional(),
  featured: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['name', 'price', 'created', 'rating']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/products - Get products with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const {
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sortBy,
      sortOrder,
    } = searchProductsSchema.parse(params);

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = {
        some: {
          categoryId: category,
        },
      };
    }

    if (minPrice || maxPrice) {
      where.regularPrice = {};
      if (minPrice) {
        where.regularPrice.gte = minPrice;
      }
      if (maxPrice) {
        where.regularPrice.lte = maxPrice;
      }
    }

    if (inStock) {
      where.stockQuantity = { gt: 0 };
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    // Build orderBy
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'price':
        orderBy.regularPrice = sortOrder;
        break;
      case 'created':
        orderBy.createdAt = sortOrder;
        break;
      case 'rating':
        // For rating sort, we'll need to calculate average rating
        orderBy.createdAt = sortOrder; // Fallback for now
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // Execute queries
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map(product => {
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

      const { ...productWithoutReviews } = product;

      return {
        ...productWithoutReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: product._count.reviews,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid parameters', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Create new product (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productData = createProductSchema.parse(body);

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

    // Create product
    const product = await prisma.product.create({
      data: {
        ...productData,
        status: 'ACTIVE',
        description: productData.description || null,
        shortDescription: productData.shortDescription || null,
        metaTitle: productData.metaTitle || null,
        metaDescription: productData.metaDescription || null,
        weight: productData.weight || null,
        dimensions: productData.dimensions || null,
        barcode: productData.barcode || null,
        promotionStartDate: productData.promotionStartDate
          ? new Date(productData.promotionStartDate)
          : null,
        promotionEndDate: productData.promotionEndDate
          ? new Date(productData.promotionEndDate)
          : null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        resource: 'PRODUCT',
        resourceId: product.id,
        details: {
          productName: product.name,
          sku: product.sku,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product,
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
