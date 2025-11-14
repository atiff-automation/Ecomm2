/**
 * Organization Schema (JSON-LD) for SEO
 * Provides Google with structured data about JRM HOLISTIK business
 */

import { getAppUrl } from '@/lib/config/app-url';

export function OrganizationSchema() {
  const baseUrl = getAppUrl(true);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JRM HOLISTIK - Jamu Ratu Malaya',
    alternateName: 'Jamu Ratu Malaya',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      'Produk jamu tradisional terbaik untuk kesihatan dan kecantikan wanita Malaysia. Lulus KKM, 100% halal, dipercayai oleh ribuan wanita. Dipersembahkan oleh Bonda Rozita Ibrahim.',
    founder: {
      '@type': 'Person',
      name: 'Bonda Rozita Ibrahim',
    },
    foundingDate: '2020',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Malay', 'English'],
    },
    sameAs: [
      // Add social media profiles here when available
      // 'https://www.facebook.com/jrmholistik',
      // 'https://www.instagram.com/jrmholistik',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MY',
      addressRegion: 'Malaysia',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Malaysia',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'JRM HOLISTIK Products',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Women Health Products',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Traditional Jamu Products',
                category: 'Health & Beauty',
              },
            },
          ],
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}
