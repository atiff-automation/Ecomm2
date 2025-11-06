/**
 * Robots.txt Configuration - JRM HOLISTIK
 * Controls search engine crawling behavior
 * Updated: 2025-11-06 - Fixed sitemap URL reference
 */

import { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/config/app-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl(true);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/cart/',
          '/checkout/',
          '/wishlist/',
          '/auth/',
          '/dashboard/',
          '/_next/',
          '/images/uploads/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/cart/',
          '/checkout/',
          '/wishlist/',
          '/auth/',
          '/dashboard/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/cart/',
          '/checkout/',
          '/wishlist/',
          '/auth/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
