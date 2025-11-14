/**
 * Admin API: FAQ Category Management
 * GET /api/admin/faq-categories - List categories
 * POST /api/admin/faq-categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import {
  faqCategoryCreateSchema,
  faqCategoryQuerySchema,
} from '@/lib/validations/faq-category-validation';
import { ZodError } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/faq-categories
 * List all FAQ categories with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = faqCategoryQuerySchema.parse({
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
    const categories = await prisma.fAQCategory.findMany({
      where,
      orderBy: {
        [queryParams.sortBy]: queryParams.sortOrder,
      },
      include: {
        _count: {
          select: { faqs: true },
        },
      },
    });

    return NextResponse.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/faq-categories
 * Create new FAQ category
 */
export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();
    const validatedData = faqCategoryCreateSchema.parse(body);

    // Check if category with same name already exists
    const existing = await prisma.fAQCategory.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.fAQCategory.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      { category, message: 'FAQ category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating FAQ category:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create FAQ category' },
      { status: 500 }
    );
  }
}
