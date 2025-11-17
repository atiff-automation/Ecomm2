/**
 * Article Constants - Single Source of Truth
 * All article-related constants and configurations
 */

export const ARTICLE_CONSTANTS = {
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
    ADMIN_ARTICLES: '/api/admin/articles',
    ADMIN_CATEGORIES: '/api/admin/article-categories',
    PUBLIC_ARTICLES: '/api/public/articles',
  },

  // Public routes
  PUBLIC_ROUTES: {
    ARTICLE: '/article',
  },

  // UI Configuration
  UI: {
    ARTICLES_PER_PAGE: 13,
    RELATED_ARTICLES_COUNT: 3,
    SEARCH_DEBOUNCE_MS: 300,
    EXCERPT_LENGTH: 150, // Characters for auto-generated excerpt
  },

  // Image Upload Configuration
  IMAGE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ACCEPTED_MIME_TYPES: 'image/jpeg,image/png,image/webp',
    MAX_FILES: 1, // For featured image
    OPTIMAL_WIDTH: 1200, // Optimal width for article images (in pixels)
    OPTIMAL_HEIGHT: 630, // Optimal height for article images (16:9 for social sharing)
  },

  // Tag Input Configuration
  TAG_EXAMPLES: 'e.g., health tips, herbal remedies, jamu benefits',

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
      // Regex for product link detection in article content
      // Matches both relative (/products/slug) and absolute (http://domain.com/products/slug) URLs
      LINK_PATTERN: /href=["'](?:https?:\/\/[^\/]+)?\/products?\/([a-z0-9-]+)["']/g,
      // Cache configuration
      CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
      CACHE_MAX_SIZE: 100, // Maximum cached products
      // Fetch configuration
      BATCH_FETCH_ENABLED: true,
      // Display configuration
      COMPACT_MODE: true, // Use compact layout in articles
    },
  },
} as const;

// Type helpers
export type ArticleStatusValue = keyof typeof ARTICLE_CONSTANTS.STATUS;

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
  const minutes = Math.ceil(wordCount / ARTICLE_CONSTANTS.VALIDATION.READING_SPEED_WPM);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Generate URL-friendly slug from title
 * @param title Article title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, ARTICLE_CONSTANTS.VALIDATION.SLUG_MAX_LENGTH);
}

/**
 * Generate excerpt from content
 * @param content HTML content
 * @param length Maximum length
 * @returns Plain text excerpt
 */
export function generateExcerpt(content: string, length: number = ARTICLE_CONSTANTS.UI.EXCERPT_LENGTH): string {
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
