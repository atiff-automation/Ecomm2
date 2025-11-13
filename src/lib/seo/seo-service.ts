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
    metaKeywords?: string[] | null;
  }): ProductSEO {
    const availability = product.stock > 0 ? 'in_stock' : 'out_of_stock';
    const image = product.images?.[0] || this.DEFAULT_IMAGE;
    const categoryDisplay = product.category || 'Jamu Kesihatan Wanita';

    return {
      title: `${product.name} - JRM HOLISTIK | ${categoryDisplay}`,
      description: product.description
        ? `${product.description.substring(0, 157)}...`
        : `${product.name} - Produk jamu dari JRM HOLISTIK (Jamu Ratu Malaya). Harga ahli dari RM${product.memberPrice}. ${availability === 'in_stock' ? 'Stok tersedia' : 'Stok habis'}.`,
      keywords: product.metaKeywords && product.metaKeywords.length > 0
        ? product.metaKeywords
        : [
            product.name.toLowerCase(),
            product.category?.toLowerCase() || '',
            product.brand?.toLowerCase() || '',
            'jamu Malaysia',
            'beli jamu online',
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
   * Generate SEO metadata for About Us page
   */
  static getAboutUsSEO(): SEOData {
    return {
      title: 'Tentang Kami - JRM HOLISTIK Ajah (Dealer Rasmi UG 237) | Jamu Ratu Malaya',
      description:
        'JRM HOLISTIK Ajah adalah dealer rasmi produk Jamu Ratu Malaya (UG 237). Kami menawarkan produk jamu tradisional berkualiti dari Bonda Rozita Ibrahim - 100% tulen, lulus KKM, dan halal.',
      keywords: [
        'tentang JRM HOLISTIK',
        'JRM HOLISTIK Ajah',
        'dealer JRM HOLISTIK',
        'Jamu Ratu Malaya dealer',
        'Bonda Rozita Ibrahim',
        'dealer rasmi UG 237',
        'tentang jamu ratu malaya',
        'sejarah JRM HOLISTIK',
        'produk jamu Malaysia',
        'jamu tradisional tulen',
      ],
      canonical: `${this.SITE_URL}/about-us`,
      ogType: 'website',
      ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      ogImageAlt: 'JRM HOLISTIK Ajah - Dealer Rasmi Jamu Ratu Malaya',
      twitterCard: 'summary_large_image',
      structuredData: this.generateAboutUsSchema(),
    };
  }

  /**
   * Generate SEO metadata for FAQ page
   */
  static getFAQPageSEO(faqs: Array<{ question: string; answer: string }> = []): SEOData {
    return {
      title: 'Soalan Lazim (FAQ) - JRM HOLISTIK | Jamu Ratu Malaya',
      description:
        'Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan produk jamu kami. Ketahui lebih lanjut tentang produk, penghantaran, pembayaran, keahlian, dan keselamatan produk jamu kami.',
      keywords: [
        'FAQ JRM HOLISTIK',
        'soalan lazim jamu',
        'soalan tentang JRM',
        'cara order jamu',
        'penghantaran jamu Malaysia',
        'pembayaran jamu online',
        'keahlian JRM HOLISTIK',
        'produk jamu selamat',
        'jamu lulus KKM',
        'jamu halal Malaysia',
      ],
      canonical: `${this.SITE_URL}/faq`,
      ogType: 'website',
      ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      ogImageAlt: 'Soalan Lazim JRM HOLISTIK - Jamu Ratu Malaya',
      twitterCard: 'summary_large_image',
      structuredData: faqs.length > 0 ? this.generateFAQSchema(faqs) : undefined,
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
   * Generate SEO metadata for article listing page
   */
  static getArticleListingSEO(page: number = 1): SEOData {
    const pageTitle = page > 1 ? ` - Page ${page}` : '';

    return {
      title: `Articles & Tips${pageTitle} | JRM HOLISTIK - Jamu Ratu Malaya`,
      description:
        'Read the latest articles, health tips, and wellness guides about traditional jamu from JRM HOLISTIK. Expert advice on women\'s health and natural remedies.',
      keywords: [
        'JRM HOLISTIK articles',
        'jamu health tips',
        'traditional medicine Malaysia',
        'women health tips',
        'jamu benefits',
        'wellness blog Malaysia',
        'herbal remedies',
        'Jamu Ratu Malaya blog',
      ],
      canonical: `${this.SITE_URL}/article${page > 1 ? `?page=${page}` : ''}`,
      ogType: 'website',
      ogImage: `${this.SITE_URL}${this.DEFAULT_IMAGE}`,
      twitterCard: 'summary_large_image',
      structuredData: this.generateBlogSchema(),
    };
  }

  /**
   * Generate SEO metadata for single article page
   */
  static getArticleSEO(article: {
    title: string;
    excerpt: string | null;
    content: string;
    featuredImage: string;
    featuredImageAlt: string;
    category: { name: string };
    author: { firstName: string; lastName: string };
    publishedAt: Date;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string[] | null;
  }): SEOData {
    const metaTitle = article.metaTitle || article.title;
    const metaDesc =
      article.metaDescription ||
      article.excerpt ||
      article.content.replace(/<[^>]*>/g, '').substring(0, 157) + '...';
    const authorName = `${article.author.firstName} ${article.author.lastName}`;

    return {
      title: `${metaTitle} | JRM HOLISTIK Blog`,
      description: metaDesc,
      keywords: article.metaKeywords || [
        article.title.toLowerCase(),
        article.category.name.toLowerCase(),
        'JRM HOLISTIK',
        'jamu Malaysia',
        'health tips',
      ],
      canonical: `${this.SITE_URL}/article/${article.slug}`,
      ogType: 'article',
      ogImage: `${this.SITE_URL}${article.featuredImage}`,
      ogImageAlt: article.featuredImageAlt,
      twitterCard: 'summary_large_image',
      structuredData: this.generateArticleSchema(article, authorName),
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
   * Generate Article structured data
   */
  private static generateArticleSchema(
    article: {
      title: string;
      excerpt: string | null;
      content: string;
      featuredImage: string;
      publishedAt: Date;
    },
    authorName: string
  ) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt || undefined,
      image: `${this.SITE_URL}${article.featuredImage}`,
      datePublished: article.publishedAt.toISOString(),
      dateModified: article.publishedAt.toISOString(),
      author: {
        '@type': 'Person',
        name: authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: this.COMPANY_NAME,
        logo: {
          '@type': 'ImageObject',
          url: `${this.SITE_URL}/images/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.SITE_URL}/article`,
      },
      inLanguage: 'ms',
    };
  }

  /**
   * Generate Blog structured data for listing page
   */
  private static generateBlogSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${this.SITE_URL}/article`,
      name: 'JRM HOLISTIK Blog - Articles & Health Tips',
      description:
        'Expert articles and health tips about traditional jamu and women\'s wellness',
      publisher: {
        '@type': 'Organization',
        name: this.COMPANY_NAME,
        logo: {
          '@type': 'ImageObject',
          url: `${this.SITE_URL}/images/logo.png`,
        },
      },
      inLanguage: 'ms',
    };
  }

  /**
   * Generate About Us page structured data
   */
  private static generateAboutUsSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${this.SITE_URL}/about-us`,
      mainEntity: {
        '@type': 'Organization',
        name: 'JRM HOLISTIK Ajah - Dealer Rasmi UG 237',
        alternateName: this.COMPANY_NAME,
        url: this.SITE_URL,
        logo: `${this.SITE_URL}/images/logo.png`,
        description:
          'Dealer rasmi produk Jamu Ratu Malaya (JRM HOLISTIK). Menawarkan produk jamu tradisional berkualiti tinggi dari Bonda Rozita Ibrahim - 100% tulen, lulus KKM, dan halal.',
        founder: {
          '@type': 'Person',
          name: this.FOUNDER,
          jobTitle: 'Pengasas JRM HOLISTIK & Sendayu Tinggi',
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'MY',
          addressLocality: 'Kuala Lumpur',
          addressRegion: 'Selangor',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Malaysia',
        },
        knowsAbout: [
          'Jamu Tradisional',
          'Kesihatan Wanita',
          'Herba Malaysia',
          'Penjagaan Selepas Bersalin',
          'Kecantikan Semula Jadi',
        ],
        award: ['Lulus KKM', 'Halal', 'Dipercayai Ribuan Pelanggan'],
      },
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
