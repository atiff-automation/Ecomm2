/**
 * Admin API: Article Category Management
 * GET /api/admin/article-categories - List categories
 * POST /api/admin/article-categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import {
  articleCategoryCreateSchema,
} from '@/lib/validations/article-validation';
import { ZodError } from 'zod';
import { z } from 'zod';

// Query schema for filtering
const articleCategoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['sortOrder', 'name', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/admin/article-categories
 * List all article categories with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = articleCategoryQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      sortBy: searchParams.get('sortBy') || 'sortOrder',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    });

    // Build where clause
    const where: any = {};

    if (queryParams.search) {
      where.OR = [
        { name: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
      ];
    }

    if (queryParams.isActive !== undefined) {
      where.isActive = queryParams.isActive;
    }

    // Fetch categories
    const categories = await prisma.articleCategory.findMany({
      where,
      orderBy: {
        [queryParams.sortBy]: queryParams.sortOrder,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching article categories:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch article categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/article-categories
 * Create new article category
 */
export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();
    const validatedData = articleCategoryCreateSchema.parse(body);

    // Check if category with same name already exists
    const existing = await prisma.articleCategory.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.articleCategory.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      { category, message: 'Article category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating article category:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create article category' },
      { status: 500 }
    );
  }
}
