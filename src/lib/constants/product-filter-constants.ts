/**
 * Product Filter Constants
 * Single source of truth for product filtering configuration and query parameters
 * Following @CLAUDE.md "No Hardcoding" and "Single Source of Truth" principles
 */

/**
 * URL Query Parameter Names
 * Used for filtering products via URL query strings
 */
export const PRODUCT_FILTER_PARAMS = {
  /** Search query parameter */
  SEARCH: 'search',

  /** Category filter parameter */
  CATEGORY: 'category',

  /** Sort order parameter */
  SORT_BY: 'sortBy',

  /** Page number parameter */
  PAGE: 'page',

  /** Promotional products filter (true/false) */
  PROMOTIONAL: 'promotional',

  /** Featured products filter (true/false) */
  FEATURED: 'featured',
} as const;

/**
 * Filter Display Labels
 * Human-readable labels for active filters
 */
export const FILTER_LABELS = {
  PROMOTIONAL: 'On Promotion',
  FEATURED: 'Featured Products',
  ALL_CATEGORIES: 'All Categories',
} as const;

/**
 * Filter Values
 */
export const FILTER_VALUES = {
  /** Default category value (shows all) */
  ALL_CATEGORIES: 'all',

  /** Boolean string values for promotional/featured filters */
  TRUE: 'true',
  FALSE: 'false',
} as const;

/**
 * Default Sort Options
 */
export const SORT_OPTIONS = {
  CREATED_DESC: 'created-desc',
  CREATED_ASC: 'created-asc',
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
  PRICE_ASC: 'price-asc',
  PRICE_DESC: 'price-desc',
  RATING_DESC: 'rating-desc',
} as const;

/**
 * Type definitions for type safety
 */
export type ProductFilterParam = typeof PRODUCT_FILTER_PARAMS[keyof typeof PRODUCT_FILTER_PARAMS];
export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

/**
 * Helper function to check if a string is "true"
 */
export function isFilterTrue(value: string | undefined | null): boolean {
  return value === FILTER_VALUES.TRUE;
}

/**
 * Helper function to get filter label
 */
export function getFilterLabel(filterType: 'promotional' | 'featured'): string {
  return filterType === 'promotional'
    ? FILTER_LABELS.PROMOTIONAL
    : FILTER_LABELS.FEATURED;
}
