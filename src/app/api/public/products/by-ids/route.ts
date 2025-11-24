/**
 * Public Products By IDs API
 * GET /api/public/products/by-ids?ids=id1,id2,id3
 *
 * Fetches products by their IDs for public display (e.g., landing page showcases)
 * No authentication required
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    // Parse comma-separated IDs
    const productIds = idsParam.split(',').filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products by IDs (only ACTIVE products)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        regularPrice: true,
        memberPrice: true,
        promotionalPrice: true,
        stockQuantity: true,
        status: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
        images: {
          where: { isPrimary: true },
          select: {
            url: true,
            altText: true,
          },
          take: 1,
        },
      },
    });

    // Format response (same format as admin search for compatibility)
    const formattedProducts = products.map((product) => {
      // Calculate effective price (promotional > regular)
      const effectivePrice = product.promotionalPrice
        ? Number(product.promotionalPrice)
        : Number(product.regularPrice);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        compareAtPrice: product.promotionalPrice
          ? Number(product.regularPrice)
          : null,
        image: product.images[0]?.url || null,
        stock: product.stockQuantity,
        status: product.status,
        category: product.categories[0]?.category || null,
        available: product.status === 'ACTIVE' && product.stockQuantity > 0,
      };
    });

    // Maintain the order from the input IDs
    const orderedProducts = productIds
      .map((id) => formattedProducts.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({
      products: orderedProducts,
      count: orderedProducts.length,
    });
  } catch (error) {
    console.error('[public-products-by-ids] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
