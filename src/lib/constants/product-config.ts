/**
 * Product Configuration Constants
 * Single source of truth for product-related configuration values
 * Following @CLAUDE.md "No Hardcoding" principle
 */

/**
 * Product listing and pagination configuration
 */
export const PRODUCT_LISTING = {
  /** Default number of products per page in admin listing */
  PAGINATION_LIMIT: 20,

  /** Default low stock alert value for new products */
  DEFAULT_LOW_STOCK_ALERT: 10,
} as const;

/**
 * Product image configuration
 */
export const PRODUCT_IMAGES = {
  /** Maximum number of images allowed per product */
  MAX_IMAGES: 5,

  /** Maximum file size in bytes (5MB) */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,

  /** Maximum file size in MB (for display) */
  MAX_SIZE_MB: 5,

  /** Accepted image MIME types */
  ACCEPTED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
} as const;

/**
 * Bulk operations configuration
 */
export const BULK_OPERATIONS = {
  /** Maximum number of items that can be selected for bulk operations */
  MAX_SELECTION: 100,
} as const;

/**
 * Product validation constraints
 */
export const PRODUCT_VALIDATION = {
  /** Minimum weight in kg (required for shipping calculations) */
  MIN_WEIGHT_KG: 0.01,

  /** Maximum short description length */
  MAX_SHORT_DESC_LENGTH: 160,
} as const;

/**
 * Re-export for convenience
 */
export const PRODUCT_CONSTANTS = {
  ...PRODUCT_LISTING,
  ...PRODUCT_IMAGES,
  ...BULK_OPERATIONS,
  ...PRODUCT_VALIDATION,
} as const;
