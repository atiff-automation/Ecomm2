/**
 * Admin FAQ API - List & Create
 * GET  /api/admin/faqs - List all FAQs
 * POST /api/admin/faqs - Create new FAQ
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import { faqCreateSchema, faqFilterSchema } from '@/lib/validations/faq-validation';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/faqs
 * List all FAQs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = faqFilterSchema.parse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // 3. Build Prisma where clause
    const where: Prisma.FAQWhereInput = {};

    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { question: { contains: filters.search, mode: 'insensitive' } },
        { answer: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 4. Fetch FAQs with relations
    const faqs = await prisma.fAQ.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 5. Return response
    return NextResponse.json({
      faqs,
      total: faqs.length,
    });

  } catch (error) {
    console.error('Error fetching FAQs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/faqs
 * Create new FAQ
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const validatedData = faqCreateSchema.parse(json);

    // 3. Create FAQ in database
    const faq = await prisma.fAQ.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 4. Return created FAQ
    return NextResponse.json(
      { faq },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
