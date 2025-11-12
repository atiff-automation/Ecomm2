/**
 * Admin Articles API - Reorder
 * PATCH /api/admin/articles/reorder - Update article sort order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { articleReorderSchema } from '@/lib/validations/article-validation';
import { z } from 'zod';

/**
 * PATCH /api/admin/articles/reorder
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const { updates } = articleReorderSchema.parse(json);

    // 3. Update all article sort orders in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.article.update({
          where: { id: update.id },
          data: {
            sortOrder: update.sortOrder,
            updatedBy: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Articles reordered successfully',
      updated: updates.length,
    });
  } catch (error) {
    console.error('Error reordering articles:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder articles' },
      { status: 500 }
    );
  }
}
