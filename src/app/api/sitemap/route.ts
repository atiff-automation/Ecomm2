/**
 * Dynamic Sitemap Generation - JRM E-commerce Platform
 * Generates XML sitemap with all public pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://jrm-ecommerce.com';

    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/products', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/contact', priority: '0.8', changefreq: 'monthly' },
      { url: '/faq', priority: '0.7', changefreq: 'monthly' },
      { url: '/auth/signup', priority: '0.8', changefreq: 'monthly' },
      { url: '/auth/signin', priority: '0.8', changefreq: 'monthly' },
      { url: '/legal/terms', priority: '0.6', changefreq: 'monthly' },
      { url: '/legal/privacy', priority: '0.6', changefreq: 'monthly' },
      { url: '/legal/shipping', priority: '0.6', changefreq: 'monthly' },
      { url: '/legal/cookies', priority: '0.6', changefreq: 'monthly' },
      { url: '/legal/returns', priority: '0.6', changefreq: 'monthly' },
    ];

    // Get products with stock
    const products = await prisma.product.findMany({
      where: {
        stockQuantity: {
          gt: 0,
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

    // Get categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${products
  .map(
    product => `  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
${categories
  .map(
    category => `  <url>
    <loc>${baseUrl}/products?category=${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}
