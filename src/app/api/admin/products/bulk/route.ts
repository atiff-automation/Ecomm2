/**
 * Admin Bulk Products API - JRM E-commerce Platform
 * Handles bulk operations on products following CLAUDE.md principles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { BulkOperationsService } from '@/lib/services/bulk-operations.service';
import { BULK_OPERATIONS_CONFIG } from '@/lib/config/bulk-operations';

const bulkDeleteSchema = z.object({
  productIds: z
    .array(z.string().min(1, 'Product ID cannot be empty'))
    .min(1, 'At least one product must be selected')
    .max(
      BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
      `Cannot select more than ${BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE} products at once`
    ),
  action: z.literal('DELETE'),
});

const bulkOperationsService = new BulkOperationsService();

// POST - Bulk delete products
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check - Admin only for bulk delete
    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Admin access required for bulk operations.'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkDeleteSchema.parse(body);

    // Execute bulk delete operation
    const result = await bulkOperationsService.bulkDeleteProducts({
      productIds: validatedData.productIds,
      userId: session.user.id,
    });

    // Return result with appropriate status code
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Bulk delete operation failed:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        message: BULK_OPERATIONS_CONFIG.ERROR_MESSAGES.OPERATION_FAILED,
      },
      { status: 500 }
    );
  }
}

// GET - Get product deletion summary for confirmation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get product IDs from URL search params
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { message: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',').filter(id => id.trim());

    if (productIds.length === 0) {
      return NextResponse.json(
        { message: 'At least one product ID is required' },
        { status: 400 }
      );
    }

    if (productIds.length > BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE) {
      return NextResponse.json(
        {
          message: `Cannot select more than ${BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE} products at once`,
        },
        { status: 400 }
      );
    }

    // Get deletion summary
    const summary = await bulkOperationsService.getProductDeletionSummary(productIds);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error getting product deletion summary:', error);
    return NextResponse.json(
      { message: 'Failed to get product deletion summary' },
      { status: 500 }
    );
  }
}