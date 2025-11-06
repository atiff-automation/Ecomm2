/**
 * SEO Service - JRM E-commerce Platform
 * Comprehensive SEO optimization and meta tag management
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  structuredData?: Record<string, any> | undefined;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface ProductSEO extends SEOData {
  price?: number;
  memberPrice?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'limited_stock';
  brand?: string | undefined;
  category?: string | undefined; // Primary category name
  sku?: string;
  rating?: number | undefined;
  reviewCount?: number | undefined;
}

export interface CategorySEO extends SEOData {
  productCount?: number | undefined;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export class SEOService {
  private static readonly SITE_NAME = 'JRM HOLISTIK - Jamu Ratu Malaya';
  private static readonly SITE_URL =
    process.env.NEXTAUTH_URL || 'https://jrm-ecommerce.com';
  private static readonly DEFAULT_IMAGE = '/images/og-default.jpg';
  private static readonly COMPANY_NAME = 'JRM HOLISTIK (Jamu Ratu Malaya)';
  private static readonly COMPANY_NAME_MALAY = 'Jamu Ratu Malaya - JRM HOLISTIK';
  private static readonly FOUNDER = 'Bonda Rozita Ibrahim';

  /**
   * Generate SEO metadata for homepage
   */
  static getHomepageSEO(): SEOData {
    return {
      title: 'JRM HOLISTIK | Jamu Ratu Malaya - Jamu Kesihatan Wanita Terbaik Malaysia',
      description:
        'Jamu Ratu Malaya (JRM HOLISTIK) - Produk jamu tradisional terbaik untuk kesihatan dan kecantikan wanita. Lulus KKM, 100% halal, dipercayai ribuan wanita Malaysia. Dipersembahkan oleh Bonda Rozita Ibrahim.',
      keywords: [
        'JRM HOLISTIK',
        'Jamu Ratu Malaya',
        'jamu untuk wanita',
        'jamu tradisional Malaysia',
        'jamu kesihatan wanita',
        'jamu lulus KKM',
        'jamu halal',
        'beli jamu online Malaysia',
        'Mega Ratu',
        'jamu terbaik Malaysia',
      ],
      ogType: 'website',
      ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      ogImageAlt: 'JRM HOLISTIK - Jamu Ratu Malaya | Jamu Kesihatan Wanita',
      twitterCard: 'summary_large_image',
      structuredData: this.generateOrganizationSchema(),
    };
  }

  /**
   * Generate SEO metadata for product pages
   */
  static getProductSEO(product: {
    name: string;
    description?: string;
    regularPrice: number;
    memberPrice: number;
    images?: string[];
    category?: string; // Primary category name
    brand?: string;
    sku: string;
    stock: number;
    rating?: number;
    reviewCount?: number;
    slug: string;
  }): ProductSEO {
    const availability = product.stock > 0 ? 'in_stock' : 'out_of_stock';
    const image = product.images?.[0] || this.DEFAULT_IMAGE;
    const priceRange = `RM${product.memberPrice} - RM${product.regularPrice}`;

    return {
      title: `${product.name} - ${priceRange} | JRM E-commerce Malaysia`,
      description: product.description
        ? `${product.description.substring(0, 160)}...`
        : `Buy ${product.name} online in Malaysia. Member price from RM${product.memberPrice}. ${availability === 'in_stock' ? 'In stock' : 'Currently unavailable'}.`,
      keywords: [
        product.name.toLowerCase(),
        '', // Category keywords should be provided as primary category name
        product.brand?.toLowerCase() || '',
        'Malaysia',
        'online shopping',
        'member price',
        'buy online Malaysia',
      ].filter(Boolean),
      canonical: `${this.SITE_URL}/products/${product.slug}`,
      ogType: 'product',
      ogImage: `${this.SITE_URL}${image}`,
      ogImageAlt: product.name,
      twitterCard: 'summary_large_image',
      price: product.regularPrice,
      memberPrice: product.memberPrice,
      currency: 'MYR',
      availability,
      brand: product.brand || undefined,
      category: product.category || undefined, // Expects primary category name to be passed in
      sku: product.sku,
      rating: product.rating || undefined,
      reviewCount: product.reviewCount || undefined,
      structuredData: this.generateProductSchema(product),
    };
  }

  /**
   * Generate SEO metadata for category pages
   */
  static getCategorySEO(
    category: {
      name: string;
      description?: string;
      slug: string;
      productCount?: number;
      parentCategory?: string;
    },
    breadcrumbs: Array<{ name: string; url: string }> = []
  ): CategorySEO {
    return {
      title: `${category.name} - Shop Online Malaysia | JRM E-commerce`,
      description: category.description
        ? `${category.description.substring(0, 160)}...`
        : `Shop ${category.name} online in Malaysia. ${category.productCount || 'Many'} products with member pricing. Free shipping available.`,
      keywords: [
        category.name.toLowerCase(),
        'Malaysia',
        'online shopping',
        'buy online',
        'member price',
        'e-commerce Malaysia',
      ],
      canonical: `${this.SITE_URL}/products?category=${category.slug}`,
      ogType: 'website',
      ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      ogImageAlt: `${category.name} - JRM E-commerce`,
      twitterCard: 'summary',
      productCount: category.productCount,
      breadcrumbs,
      structuredData: this.generateBreadcrumbSchema(breadcrumbs) || undefined,
    };
  }

  /**
   * Generate SEO metadata for search pages
   */
  static getSearchSEO(query: string, resultCount: number): SEOData {
    return {
      title: `Search results for "${query}" | JRM E-commerce Malaysia`,
      description: `Found ${resultCount} products matching "${query}". Shop online in Malaysia with member pricing and free shipping.`,
      canonical: `${this.SITE_URL}/search?q=${encodeURIComponent(query)}`,
      ogType: 'website',
      noindex: true, // Don't index search result pages
      structuredData: this.generateSearchResultsSchema(query, resultCount),
    };
  }

  /**
   * Generate Organization structured data
   */
  private static generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.COMPANY_NAME,
      url: this.SITE_URL,
      logo: `${this.SITE_URL}/images/logo.png`,
      description:
        'JRM HOLISTIK (Jamu Ratu Malaya) - Produk jamu tradisional terbaik untuk kesihatan dan kecantikan wanita Malaysia. Dipersembahkan oleh Bonda Rozita Ibrahim.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'MY',
        addressLocality: 'Kuala Lumpur',
        addressRegion: 'Selangor',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+60-3-1234-5678',
        contactType: 'customer support',
        areaServed: 'MY',
        availableLanguage: ['Bahasa Malaysia', 'English'],
      },
      sameAs: [
        'https://facebook.com/jrmecommerce',
        'https://instagram.com/jrmecommerce',
        'https://twitter.com/jrmecommerce',
      ],
    };
  }

  /**
   * Generate Product structured data
   */
  private static generateProductSchema(product: {
    name: string;
    description?: string;
    regularPrice: number;
    memberPrice: number;
    images?: string[];
    brand?: string;
    sku: string;
    stock: number;
    rating?: number;
    reviewCount?: number;
  }) {
    const offers = [
      {
        '@type': 'Offer',
        price: product.regularPrice,
        priceCurrency: 'MYR',
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 30 days from now
        seller: {
          '@type': 'Organization',
          name: this.COMPANY_NAME,
        },
      },
    ];

    // Add member pricing offer if different
    if (product.memberPrice !== product.regularPrice) {
      offers.push({
        '@type': 'Offer',
        price: product.memberPrice,
        priceCurrency: 'MYR',
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        seller: {
          '@type': 'Organization',
          name: this.COMPANY_NAME,
        },
      });
    }

    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${product.name} - JRM HOLISTIK`,
      description: product.description,
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'JRM HOLISTIK - Jamu Ratu Malaya',
        logo: `${this.SITE_URL}/images/logo.png`,
        url: this.SITE_URL,
      },
      inLanguage: 'ms',
      image: product.images?.map(img => `${this.SITE_URL}${img}`) || [
        `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      ],
      offers: offers,
    };

    // Add aggregate rating if available
    if (product.rating && product.reviewCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }

    return schema;
  }

  /**
   * Generate Breadcrumb structured data
   */
  private static generateBreadcrumbSchema(
    breadcrumbs: Array<{ name: string; url: string }>
  ) {
    if (!breadcrumbs.length) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${this.SITE_URL}${crumb.url}`,
      })),
    };
  }

  /**
   * Generate Search Results structured data
   */
  private static generateSearchResultsSchema(
    query: string,
    resultCount: number
  ) {
    return {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: resultCount,
        name: `Search results for "${query}"`,
      },
    };
  }

  /**
   * Generate FAQ structured data
   */
  static generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate default meta tags object
   */
  static generateMetaTags(seoData: SEOData) {
    const tags: Record<string, string> = {
      title: seoData.title,
      description: seoData.description,
      'og:title': seoData.title,
      'og:description': seoData.description,
      'og:type': seoData.ogType || 'website',
      'og:site_name': this.SITE_NAME,
      'twitter:card': seoData.twitterCard || 'summary',
      'twitter:title': seoData.title,
      'twitter:description': seoData.description,
    };

    if (seoData.keywords?.length) {
      tags['keywords'] = seoData.keywords.join(', ');
    }

    if (seoData.canonical) {
      tags['canonical'] = seoData.canonical;
    }

    if (seoData.ogImage) {
      tags['og:image'] = seoData.ogImage;
      tags['twitter:image'] = seoData.ogImage;
    }

    if (seoData.ogImageAlt) {
      tags['og:image:alt'] = seoData.ogImageAlt;
      tags['twitter:image:alt'] = seoData.ogImageAlt;
    }

    if (seoData.noindex) {
      tags['robots'] = seoData.nofollow ? 'noindex,nofollow' : 'noindex,follow';
    } else if (seoData.nofollow) {
      tags['robots'] = 'index,nofollow';
    }

    return tags;
  }
}
