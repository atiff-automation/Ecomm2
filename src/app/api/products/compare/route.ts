/**
 * Product Comparison API
 * Handles product comparison functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { comparisonService } from '@/lib/comparison/comparison-service';
import { z } from 'zod';

const compareProductsSchema = z.object({
  productIds: z.array(z.string()).min(2).max(4),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = compareProductsSchema.parse(body);

    const comparisonData =
      await comparisonService.getComparisonTable(productIds);

    return NextResponse.json({
      products: comparisonData.products,
      specifications: comparisonData.specifications,
      maxProducts: comparisonService.getMaxComparisonProducts(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Product comparison error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { message: 'productIds parameter is required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',').filter(id => id.trim());

    if (productIds.length < 2 || productIds.length > 4) {
      return NextResponse.json(
        { message: 'Must provide between 2 and 4 product IDs' },
        { status: 400 }
      );
    }

    const comparisonData =
      await comparisonService.getComparisonTable(productIds);

    return NextResponse.json({
      products: comparisonData.products,
      specifications: comparisonData.specifications,
      maxProducts: comparisonService.getMaxComparisonProducts(),
    });
  } catch (error) {
    console.error('Product comparison error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
