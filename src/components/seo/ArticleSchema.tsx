/**
 * Article Schema (JSON-LD) for SEO
 * Provides Google with structured article data for rich snippets
 */

import { getAppUrl } from '@/lib/config/app-url';

interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  category?: string;
}

export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName = 'JRM HOLISTIK',
  category,
}: ArticleSchemaProps) {
  const baseUrl = getAppUrl(true);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
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
      articleSection: category,
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}
