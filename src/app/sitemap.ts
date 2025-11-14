/**
 * Dynamic Sitemap Generation - JRM HOLISTIK
 * Automatically generates sitemap.xml for search engines
 * Includes homepage, products, categories, and static pages
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getAppUrl } from '@/lib/config/app-url';

// Force dynamic generation - don't cache the sitemap
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl(true);

  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/article`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Fetch all active products (publicly visible)
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Product pages - high priority for SEO
    const productPages: MetadataRoute.Sitemap = products.map(product => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Fetch all categories with active products
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            product: {
              status: 'ACTIVE',
            },
          },
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Category pages - medium-high priority
    const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
      url: `${baseUrl}/products?category=${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Fetch all published articles
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Article pages - high priority for SEO and content marketing
    const articlePages: MetadataRoute.Sitemap = articles.map(article => ({
      url: `${baseUrl}/article/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    // Combine all pages
    return [...staticPages, ...productPages, ...categoryPages, ...articlePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if database fails
    return staticPages;
  }
}
