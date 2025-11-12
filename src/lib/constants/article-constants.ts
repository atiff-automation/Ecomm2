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

  // UI Configuration
  UI: {
    ARTICLES_PER_PAGE: 13,
    RELATED_ARTICLES_COUNT: 3,
    SEARCH_DEBOUNCE_MS: 300,
    EXCERPT_LENGTH: 150, // Characters for auto-generated excerpt
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
