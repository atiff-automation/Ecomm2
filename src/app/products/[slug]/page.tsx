/**
 * Product Detail Page - Server Component
 * Generates SEO metadata and fetches product data
 *
 * ARCHITECTURE: Uses direct Prisma queries (Server Component best practice)
 * - No HTTP calls to own API routes
 * - No custom caching layers (uses Next.js Data Cache)
 * - Consistent with products listing page pattern
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { SEOService } from '@/lib/seo/seo-service';
import { ProductClient } from './ProductClient';
import { ProductSchema } from '@/components/seo/ProductSchema';

interface PageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate dynamic metadata for product pages
 * Priority: metaTitle > SEO Service generated title
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    // Direct database query - no HTTP, no custom cache (Single Source of Truth)
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for does not exist.',
      };
    }

    // Calculate average rating
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = approvedReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
    const reviewCount = approvedReviews.length;

    // Priority 1: Use custom metaTitle and metaDescription if provided
    if (product.metaTitle || product.metaDescription) {
      const title = product.metaTitle || product.name;
      const description =
        product.metaDescription ||
        product.description?.substring(0, 160) ||
        `${product.name} - Produk dari JRM HOLISTIK`;

      return {
        title,
        description,
        keywords: product.metaKeywords as string[] | undefined,
        openGraph: {
          title,
          description,
          type: 'website',
          images: product.images.length > 0 ? [product.images[0].url] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: product.images.length > 0 ? [product.images[0].url] : [],
        },
      };
    }

    // Priority 2: Generate from SEO Service (Bahasa Malaysia)
    const categoryName =
      product.categories.length > 0
        ? product.categories[0].category.name
        : undefined;

    const seoData = SEOService.getProductSEO({
      name: product.name,
      description: product.description || undefined,
      regularPrice: Number(product.regularPrice),
      memberPrice: Number(product.memberPrice),
      images: product.images.map(img => img.url),
      category: categoryName,
      brand: 'JRM HOLISTIK',
      sku: product.sku,
      stock: product.stockQuantity,
      rating: averageRating,
      reviewCount: reviewCount,
      slug: product.slug,
    });

    return {
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords,
      openGraph: {
        title: seoData.title,
        description: seoData.description,
        type: 'website',
        images: product.images.length > 0 ? [product.images[0].url] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seoData.title,
        description: seoData.description,
        images: product.images.length > 0 ? [product.images[0].url] : [],
      },
    };
  } catch (error) {
    // Fallback metadata if product not found
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }
}

/**
 * Product Detail Page - Server Component
 * Direct database query - no HTTP calls, no custom cache
 */
export default async function ProductPage({ params }: PageProps) {
  // Direct database query (Single Source of Truth - same pattern as listing page)
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        orderBy: { createdAt: 'asc' },
      },
      reviews: {
        where: { isApproved: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          reviews: {
            where: { isApproved: true },
          },
        },
      },
    },
  });

  if (!product) {
    // Product not found, show 404
    notFound();
  }

  // Calculate average rating
  const approvedReviews = await prisma.review.findMany({
    where: {
      productId: product.id,
      isApproved: true,
    },
    select: {
      rating: true,
    },
  });

  const totalRating = approvedReviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  const averageRating =
    approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

  // Get related products from same categories
  const productCategoryIds = product.categories.map(cat => cat.category.id);
  const relatedProducts = await prisma.product.findMany({
    where: {
      categories: {
        some: {
          categoryId: {
            in: productCategoryIds,
          },
        },
      },
      status: 'ACTIVE',
      id: { not: product.id },
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  // Transform data to match ProductClient interface
  const productWithRating = {
    ...product,
    regularPrice: Number(product.regularPrice),
    memberPrice: Number(product.memberPrice),
    promotionalPrice: product.promotionalPrice
      ? Number(product.promotionalPrice)
      : null,
    weight: product.weight ? Number(product.weight) : null,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: product._count.reviews,
    categories: product.categories.map(pc => ({
      category: pc.category,
    })),
    reviews: product.reviews.map(review => ({
      ...review,
      user: {
        id: review.user.id,
        name: `${review.user.firstName} ${review.user.lastName}`,
      },
    })),
    relatedProducts: relatedProducts.map(rp => ({
      ...rp,
      regularPrice: Number(rp.regularPrice),
      memberPrice: Number(rp.memberPrice),
      promotionalPrice: rp.promotionalPrice ? Number(rp.promotionalPrice) : null,
      weight: rp.weight ? Number(rp.weight) : null,
      averageRating: 0,
      reviewCount: 0,
      categories: rp.categories.map(pc => ({
        category: pc.category,
      })),
    })),
  };

  // Note: Product view tracking is handled by ProductClient component on the client side
  // This ensures proper URL resolution and session handling

  // Determine the current price (promotional > member)
  const currentPrice = product.promotionalPrice
    ? Number(product.promotionalPrice)
    : Number(product.memberPrice);

  // Determine availability status
  const availability =
    product.status === 'ACTIVE' && product.stockQuantity > 0
      ? 'InStock'
      : product.status === 'ACTIVE' && product.stockQuantity === 0
        ? 'OutOfStock'
        : 'OutOfStock';

  // Render client component with product data and structured data
  return (
    <>
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.images.length > 0 ? product.images[0].url : ''}
        price={currentPrice}
        sku={product.sku || undefined}
        category={
          product.categories.length > 0
            ? product.categories[0].category.name
            : undefined
        }
        availability={availability as 'InStock' | 'OutOfStock'}
      />
      <ProductClient product={productWithRating} />
    </>
  );
}
