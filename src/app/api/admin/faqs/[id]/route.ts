/**
 * Admin FAQ API - Get, Update, Delete
 * GET    /api/admin/faqs/[id] - Get single FAQ
 * PUT    /api/admin/faqs/[id] - Update FAQ
 * DELETE /api/admin/faqs/[id] - Delete FAQ
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import { faqUpdateSchema, faqIdSchema } from '@/lib/validations/faq-validation';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/faqs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authorization
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Validate ID
    const faqId = faqIdSchema.parse(params.id);

    // 3. Fetch FAQ
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Error fetching FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid FAQ ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch FAQ' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/faqs/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authorization
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Validate ID
    const faqId = faqIdSchema.parse(params.id);

    // 3. Check FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // 4. Parse and validate update data
    const json = await request.json();
    const validatedData = faqUpdateSchema.parse(json);

    // 5. Update FAQ
    const updatedFAQ = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
        updatedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ faq: updatedFAQ });

  } catch (error) {
    console.error('Error updating FAQ:', error);

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
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/faqs/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authorization
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Validate ID
    const faqId = faqIdSchema.parse(params.id);

    // 3. Check FAQ exists
    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id: faqId },
    });

    if (!existingFAQ) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // 4. Delete FAQ
    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    return NextResponse.json(
      { message: 'FAQ deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting FAQ:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid FAQ ID' },
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
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
