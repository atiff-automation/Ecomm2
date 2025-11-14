/**
 * Product Schema (JSON-LD) for SEO
 * Provides Google with structured product data for rich snippets
 */

import { getAppUrl } from '@/lib/config/app-url';

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku?: string;
  brand?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  category?: string;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'MYR',
  sku,
  brand = 'JRM HOLISTIK - Jamu Ratu Malaya',
  availability = 'InStock',
  condition = 'NewCondition',
  category,
}: ProductSchemaProps) {
  const baseUrl = getAppUrl(true);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    ...(sku && { sku }),
    ...(category && { category }),
    offers: {
      '@type': 'Offer',
      url: baseUrl,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      itemCondition: `https://schema.org/${condition}`,
      seller: {
        '@type': 'Organization',
        name: 'JRM HOLISTIK - Jamu Ratu Malaya',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '100',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}
