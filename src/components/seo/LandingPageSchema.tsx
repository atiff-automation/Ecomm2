/**
 * Landing Page Schema (JSON-LD) for SEO
 * Provides Google with structured landingPage data for rich snippets
 */

import { getAppUrl } from '@/lib/config/app-url';

interface LandingPageSchemaProps {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  category?: string;
}

export function LandingPageSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName = 'JRM HOLISTIK',
  category,
}: LandingPageSchemaProps) {
  const baseUrl = getAppUrl(true);

  const landingPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'Landing Page',
    headline: title,
    description,
    ...(image && {
      image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    }),
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'JRM HOLISTIK - Jamu Ratu Malaya',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    ...(category && {
      landingPageSection: category,
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(landingPageSchema) }}
    />
  );
}
