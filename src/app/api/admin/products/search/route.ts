import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * Product Search Query Schema
 */
const productSearchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  available: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

type ProductSearchQuery = z.infer<typeof productSearchSchema>;

/**
 * Search Products for Landing Page Showcase
 * GET /api/admin/products/search
 *
 * Provides product search functionality for admin product showcase selector
 * Admin only endpoint
 */
export async function GET(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData: Record<string, string | undefined> = {
      query: searchParams.get('query') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      available: searchParams.get('available') || 'all',
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    };

    const validationResult = productSearchSchema.safeParse(queryData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const searchQuery: ProductSearchQuery = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Search by name or slug
    if (searchQuery.query) {
      where.OR = [
        { name: { contains: searchQuery.query, mode: 'insensitive' } },
        { slug: { contains: searchQuery.query, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (searchQuery.categoryId) {
      where.categories = {
        some: {
          categoryId: searchQuery.categoryId,
        },
      };
    }

    // Filter by availability
    if (searchQuery.available === 'true') {
      where.status = 'ACTIVE';
      where.stockQuantity = { gt: 0 };
    } else if (searchQuery.available === 'false') {
      where.OR = [{ status: 'INACTIVE' }, { stockQuantity: { lte: 0 } }];
    }

    // Calculate pagination
    const skip = (searchQuery.page - 1) * searchQuery.pageSize;
    const take = searchQuery.pageSize;

    // Fetch products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          memberPrice: true,
          promotionalPrice: true,
          stockQuantity: true,
          status: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
          images: {
            where: { isPrimary: true },
            select: {
              url: true,
              altText: true,
            },
            take: 1,
          },
        },
        orderBy: [{ status: 'desc' }, { name: 'asc' }],
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Format response
    const formattedProducts = products.map((product) => {
      // Calculate effective price (promotional > member > regular)
      const effectivePrice = product.promotionalPrice
        ? Number(product.promotionalPrice)
        : Number(product.regularPrice);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        compareAtPrice: product.promotionalPrice
          ? Number(product.regularPrice)
          : null,
        image: product.images[0]?.url || null,
        stock: product.stockQuantity,
        status: product.status,
        category: product.categories[0]?.category || null,
        available: product.status === 'ACTIVE' && product.stockQuantity > 0,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page: searchQuery.page,
        pageSize: searchQuery.pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / searchQuery.pageSize),
        hasMore: skip + products.length < totalCount,
      },
    });
  } catch (error) {
    console.error('[product-search] Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
