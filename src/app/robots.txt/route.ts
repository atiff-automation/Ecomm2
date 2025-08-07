/**
 * Robots.txt Route - JRM E-commerce Platform
 * Dynamic robots.txt generation
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://jrm-ecommerce.com';

  const robotsContent = `User-agent: *
Allow: /

# Disallow admin areas
Disallow: /admin
Disallow: /api
Disallow: /member/dashboard
Disallow: /member/orders
Disallow: /member/addresses
Disallow: /member/settings

# Disallow auth pages from indexing
Disallow: /auth/

# Disallow cart and checkout
Disallow: /cart
Disallow: /checkout

# Allow legal pages
Allow: /legal/

# Allow product pages
Allow: /products/

# Sitemap location
Sitemap: ${baseUrl}/api/sitemap

# Crawl delay (in seconds)
Crawl-delay: 1

# Specific rules for major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;

  return new NextResponse(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
