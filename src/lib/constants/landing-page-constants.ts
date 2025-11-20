/**
 * Landing Page Constants - Single Source of Truth
 * All landing page-related constants and configurations
 */

export const LANDING_PAGE_CONSTANTS = {
  // Status options
  STATUS: {
    DRAFT: {
      value: 'DRAFT',
      label: 'Draft',
      color: 'gray',
      icon: 'FileEdit',
    },
    PUBLISHED: {
      value: 'PUBLISHED',
      label: 'Published',
      color: 'green',
      icon: 'Globe',
    },
  },

  // Validation limits
  VALIDATION: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 200,
    EXCERPT_MIN_LENGTH: 20,
    EXCERPT_MAX_LENGTH: 500,
    CONTENT_MIN_LENGTH: 100,
    SLUG_MAX_LENGTH: 200,
    META_TITLE_MAX_LENGTH: 200,
    META_DESCRIPTION_MAX_LENGTH: 300,
    FEATURED_IMAGE_ALT_MAX_LENGTH: 200,
    MAX_TAGS: 10,
    READING_SPEED_WPM: 200, // Words per minute for reading time calculation
  },

  // API endpoints
  API_ROUTES: {
    ADMIN_LANDING_PAGES: '/api/admin/landing-pages',
    ADMIN_CATEGORIES: '/api/admin/landing-page-categories',
    PUBLIC_LANDING_PAGES: '/api/public/landing-pages',
  },

  // Public routes
  PUBLIC_ROUTES: {
    LANDING_PAGE: '/landing',
  },

  // UI Configuration
  UI: {
    LANDING_PAGES_PER_PAGE: 13,
    RELATED_LANDING_PAGES_COUNT: 3,
    SEARCH_DEBOUNCE_MS: 300,
    EXCERPT_LENGTH: 150, // Characters for auto-generated excerpt
  },

  // Image Upload Configuration
  IMAGE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ACCEPTED_MIME_TYPES: 'image/jpeg,image/png,image/webp',
    MAX_FILES: 1, // For featured image
    OPTIMAL_WIDTH: 1200, // Optimal width for landing page images (in pixels)
    OPTIMAL_HEIGHT: 630, // Optimal height for landing page images (16:9 for social sharing)
  },

  // Tag Input Configuration
  TAG_EXAMPLES: 'e.g., promo, campaign, seasonal sale',

  // Embed Configuration
  EMBEDS: {
    YOUTUBE: {
      // Regex patterns for YouTube URL detection
      PATTERNS: {
        WATCH: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
        SHORT: /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/g,
      },
      // Privacy-enhanced embed URL (GDPR compliant)
      EMBED_BASE_URL: 'https://www.youtube-nocookie.com/embed/',
      // Video ID validation
      VIDEO_ID_LENGTH: 11,
      // Responsive aspect ratio
      ASPECT_RATIO: '16/9',
      // iframe attributes
      IFRAME_ATTRIBUTES: {
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowFullScreen: true,
        loading: 'lazy' as const,
      },
    },
    PRODUCT: {
      // Regex for product link detection in landing page content
      // Matches both relative (/products/slug) and absolute (http://domain.com/products/slug) URLs
      LINK_PATTERN: /href=["'](?:https?:\/\/[^\/]+)?\/products?\/([a-z0-9-]+)["']/g,
      // Cache configuration
      CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
      CACHE_MAX_SIZE: 100, // Maximum cached products
      // Fetch configuration
      BATCH_FETCH_ENABLED: true,
      // Display configuration
      COMPACT_MODE: true, // Use compact layout in landing pages
    },
  },

  // Product Showcase Configuration (Phase 2)
  PRODUCT_SHOWCASE: {
    MAX_FEATURED_PRODUCTS: 12, // Maximum products allowed in showcase
    LAYOUTS: {
      GRID: {
        value: 'GRID',
        label: 'Grid Layout',
        description: 'Display products in a responsive grid',
        cols: 3, // Default grid columns
        icon: 'LayoutGrid',
      },
      CAROUSEL: {
        value: 'CAROUSEL',
        label: 'Carousel',
        description: 'Scrollable carousel with autoplay',
        autoplay: true,
        interval: 5000, // 5 seconds
        icon: 'ArrowRightCircle',
      },
      FEATURED: {
        value: 'FEATURED',
        label: 'Featured Hero',
        description: 'One large hero product with smaller grid',
        cols: 4, // Total slots (1 hero + 3-4 smaller)
        icon: 'Star',
      },
    },
    CARD_STYLE: 'compact', // Optimized for landing pages
  },
} as const;

// Type helpers
export type LandingPageStatusValue = keyof typeof LANDING_PAGE_CONSTANTS.STATUS;

/**
 * Calculate reading time from content
 * @param content HTML content from TipTap
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Count words (split by whitespace)
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

  // Calculate reading time (round up to nearest minute)
  const minutes = Math.ceil(wordCount / LANDING_PAGE_CONSTANTS.VALIDATION.READING_SPEED_WPM);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Generate URL-friendly slug from title
 * @param title Landing page title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, LANDING_PAGE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Generate excerpt from content
 * @param content HTML content
 * @param length Maximum length
 * @returns Plain text excerpt
 */
export function generateExcerpt(content: string, length: number = LANDING_PAGE_CONSTANTS.UI.EXCERPT_LENGTH): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Trim to length
  if (text.length <= length) {
    return text;
  }

  // Cut at last complete word
  const trimmed = text.substring(0, length);
  const lastSpace = trimmed.lastIndexOf(' ');

  return trimmed.substring(0, lastSpace > 0 ? lastSpace : length) + '...';
}
