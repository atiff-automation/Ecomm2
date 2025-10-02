/**

export const dynamic = 'force-dynamic';

 * Categories API Routes - Malaysian E-commerce Platform
 * Handles category listing and management operations with hierarchy support
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.union([z.string(), z.null()]).optional(),
  isQualifyingCategory: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

interface CategoryWithHierarchy {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryWithHierarchy[];
  productCount?: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * GET /api/categories - Get categories with hierarchy
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get('hierarchy') === 'true';
    const parentId = searchParams.get('parentId');
    const includeProductCount =
      searchParams.get('includeProductCount') === 'true';

    if (includeHierarchy) {
      // Get all categories and build hierarchy
      const categories = await prisma.category.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          ...(includeProductCount && {
            _count: {
              select: {
                products: {
                  where: {
                    product: {
                      status: 'ACTIVE',
                    },
                  },
                },
              },
            },
          }),
        },
        orderBy: { name: 'asc' },
      });

      // Build hierarchy
      const categoryMap = new Map<string, CategoryWithHierarchy>();
      const rootCategories: CategoryWithHierarchy[] = [];

      // First pass: create all categories
      categories.forEach(category => {
        const categoryWithHierarchy: CategoryWithHierarchy = {
          ...category,
          children: [],
          ...(includeProductCount && {
            productCount: (category as any)._count?.products || 0,
          }),
        };
        categoryMap.set(category.id, categoryWithHierarchy);
      });

      // Second pass: build hierarchy
      categories.forEach(category => {
        const categoryWithHierarchy = categoryMap.get(category.id)!;

        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children!.push(categoryWithHierarchy);
          }
        } else {
          rootCategories.push(categoryWithHierarchy);
        }
      });

      return NextResponse.json({
        categories: rootCategories,
        totalCount: categories.length,
      });
    }

    // Get flat list with optional parent filter
    const where: any = {};
    if (parentId) {
      where.parentId = parentId;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        ...(includeProductCount && {
          _count: {
            select: {
              products: {
                where: {
                  product: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
    });

    const categoriesWithCount = categories.map(category => ({
      ...category,
      ...(includeProductCount && {
        productCount: (category as any)._count?.products || 0,
      }),
    }));

    return NextResponse.json({
      categories: categoriesWithCount,
      totalCount: categoriesWithCount.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories - Create new category (Admin only)
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
    const categoryData = createCategorySchema.parse(body);

    // Check if slug already exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug: categoryData.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { message: 'Category slug already exists', field: 'slug' },
        { status: 400 }
      );
    }

    // Verify parent category exists if provided
    if (categoryData.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { message: 'Parent category not found', field: 'parentId' },
          { status: 400 }
        );
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        image: categoryData.image || null,
        metaTitle: categoryData.metaTitle || null,
        metaDescription: categoryData.metaDescription || null,
        ...(categoryData.parentId && {
          parent: {
            connect: {
              id: categoryData.parentId,
            },
          },
        }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log the action (skip if audit log fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          resource: 'CATEGORY',
          resourceId: category.id,
          details: {
            categoryName: category.name,
            slug: category.slug,
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue execution - audit log failure should not block category creation
    }

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid category data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
