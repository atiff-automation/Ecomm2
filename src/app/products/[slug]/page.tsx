/**
 * Product Detail Page - Server Component
 * Generates SEO metadata and fetches product data
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/lib/services/product-service';
import { SEOService } from '@/lib/seo/seo-service';
import { ProductClient } from './ProductClient';

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
    const product = await productService.getProduct(params.slug);

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
        keywords: product.metaKeywords,
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
      description: product.description,
      regularPrice: product.regularPrice,
      memberPrice: product.memberPrice,
      images: product.images.map(img => img.url),
      category: categoryName,
      brand: 'JRM HOLISTIK',
      sku: product.sku,
      stock: product.stockQuantity,
      rating: product.averageRating,
      reviewCount: product.reviewCount,
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
 */
export default async function ProductPage({ params }: PageProps) {
  let product;

  try {
    product = await productService.getProduct(params.slug);
  } catch (error) {
    // Product not found, show 404
    notFound();
  }

  // Track product view (async, non-blocking)
  productService.trackProductView(product.id).catch(err => {
    console.error('Failed to track product view:', err);
  });

  // Render client component with product data
  return <ProductClient product={product} />;
}
