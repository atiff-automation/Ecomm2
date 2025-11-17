/**
 * Admin Landing Pages API - Reorder
 * PATCH /api/admin/landing-pages/reorder - Update landing page sort order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { landingPageReorderSchema } from '@/lib/validations/landing-page-validation';
import { z } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * PATCH /api/admin/landing-pages/reorder
 */
export async function PATCH(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const { updates } = landingPageReorderSchema.parse(json);

    // 3. Update all landing page sort orders in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.landingPage.update({
          where: { id: update.id },
          data: {
            sortOrder: update.sortOrder,
            updatedBy: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Landing pages reordered successfully',
      updated: updates.length,
    });
  } catch (error) {
    console.error('Error reordering landing pages:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder landing pages' },
      { status: 500 }
    );
  }
}
