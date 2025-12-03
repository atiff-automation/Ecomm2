/**
 * Public Product By ID API
 * GET /api/public/products/[id]
 *
 * Fetches single product by ID for public display (Click Pages, Product Cards)
 * Returns product data compatible with ProductCard component
 * No authentication required
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate product ID
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product with all required data for ProductCard component
    const product = await prisma.product.findUnique({
      where: {
        id,
        status: 'ACTIVE', // Only return active products
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
          select: {
            url: true,
            altText: true,
            isPrimary: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or deleted' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    // Check if product is promotional (has active promotional price)
    const now = new Date();
    const isPromotional = !!(
      product.promotionalPrice &&
      product.promotionalPrice > 0 &&
      (!product.promotionStartDate || new Date(product.promotionStartDate) <= now) &&
      (!product.promotionEndDate || new Date(product.promotionEndDate) >= now)
    );

    // Check if qualifying for membership
    const memberDiscount = product.memberPrice < product.regularPrice;
    const isQualifyingForMembership = memberDiscount && !product.memberOnlyAccess;

    // Transform to ProductPricingData format compatible with ProductCard
    const productData = {
      // ProductPricingData fields
      id: product.id,
      regularPrice: Number(product.regularPrice),
      memberPrice: Number(product.memberPrice),
      promotionalPrice: product.promotionalPrice ? Number(product.promotionalPrice) : null,
      promotionStartDate: product.promotionStartDate?.toISOString() || null,
      promotionEndDate: product.promotionEndDate?.toISOString() || null,
      memberOnlyUntil: product.memberOnlyUntil?.toISOString() || null,
      earlyAccessStart: product.earlyAccessStartDate?.toISOString() || null,
      stockQuantity: product.stockQuantity,
      isPromotional,
      isQualifyingForMembership,
      featured: product.featured || false,

      // Additional fields required by ProductCard
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription || '',
      metaTitle: product.metaTitle || product.name,
      averageRating,
      reviewCount: product.reviews.length,
      categories: product.categories.map(pc => ({
        category: {
          name: pc.category.name,
          slug: pc.category.slug,
        },
      })),
      images: product.images.map(img => ({
        url: img.url,
        altText: img.altText || product.name,
        isPrimary: img.isPrimary,
      })),
    };

    return NextResponse.json({ product: productData });
  } catch (error) {
    console.error('[public-product-by-id] Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
