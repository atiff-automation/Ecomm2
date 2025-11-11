/**
 * Admin FAQ API - Reorder
 * PATCH /api/admin/faqs/reorder - Batch update sort orders
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import { faqReorderSchema } from '@/lib/validations/faq-validation';
import { z } from 'zod';

export async function PATCH(request: NextRequest) {
  try {
    // 1. Authorization
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    // 2. Parse and validate request
    const json = await request.json();
    const { updates } = faqReorderSchema.parse(json);

    // 3. Update all FAQs in a transaction
    await prisma.$transaction(
      updates.map(({ id, sortOrder }) =>
        prisma.fAQ.update({
          where: { id },
          data: {
            sortOrder,
            updatedBy: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'FAQs reordered successfully',
    });

  } catch (error) {
    console.error('Error reordering FAQs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder FAQs' },
      { status: 500 }
    );
  }
}
