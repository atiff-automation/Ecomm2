/**

export const dynamic = 'force-dynamic';

 * Similar Products API
 * Returns similar products for comparison suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { comparisonService } from '@/lib/comparison/comparison-service';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // Get product by slug first to get the ID
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const similarProducts =
      await comparisonService.getSimilarProductsForComparison(
        product.id,
        Math.min(limit, 20) // Maximum 20 products
      );

    return NextResponse.json({
      similarProducts,
      productId: product.id,
      count: similarProducts.length,
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
