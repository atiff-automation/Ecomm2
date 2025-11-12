/**
 * FAQ Categories Reorder API
 * PUT /api/admin/faq-categories/reorder
 *
 * Updates sortOrder for multiple FAQ categories in a single transaction
 * Following CLAUDE.md:
 * - Zod validation for all inputs
 * - Prisma transactions (atomic operations)
 * - Proper error handling with try-catch
 * - No raw SQL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reorderRequestSchema } from '@/lib/validations/reorder-validation';
import { DRAG_DROP_CONSTANTS } from '@/lib/constants/drag-drop-constants';
import { ZodError } from 'zod';

export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod schema
    const validated = reorderRequestSchema.parse(body);

    // Update sortOrder in transaction (atomic operation)
    // All updates succeed together or all fail together
    const result = await prisma.$transaction(
      validated.items.map((item) =>
        prisma.fAQCategory.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: DRAG_DROP_CONSTANTS.MESSAGES.SUCCESS,
        updatedCount: result.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reorder FAQ categories error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: DRAG_DROP_CONSTANTS.MESSAGES.VALIDATION_ERROR,
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors (e.g., record not found)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        {
          error: 'One or more categories not found',
        },
        { status: 404 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: DRAG_DROP_CONSTANTS.MESSAGES.ERROR,
      },
      { status: 500 }
    );
  }
}
