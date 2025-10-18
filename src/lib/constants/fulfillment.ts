/**
 * Fulfillment Dialog Constants
 * Single source of truth for fulfillment-related values
 *
 * @see CLAUDE.md - No Hardcoding Rule
 * All constants centralized here to maintain DRY principle
 */

// ============================================================================
// PICKUP SCHEDULING CONSTANTS
// ============================================================================

/**
 * Maximum number of days ahead a pickup can be scheduled
 * Used for date picker max date calculation
 */
export const MAX_PICKUP_DAYS_AHEAD = 7;

// ============================================================================
// UI DIMENSIONS
// ============================================================================

/**
 * Mobile bottom sheet height (90% of viewport height)
 * Ensures content is visible while maintaining dismissible overlay area
 */
export const SHEET_HEIGHT_MOBILE = 'h-[90vh]';

/**
 * Desktop dialog maximum width
 * Responsive: small screens and above get max-width constraint
 */
export const DIALOG_MAX_WIDTH = 'sm:max-w-[500px]';

// ============================================================================
// TEXT CONSTANTS
// ============================================================================

/**
 * Text displayed when data is unavailable or unknown
 */
export const UNAVAILABLE_TEXT = 'N/A';

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Standardized error messages for fulfillment operations
 * Ensures consistent user-facing error communication
 */
export const ERROR_MESSAGES = {
  /** Failed to load courier options from API */
  LOAD_COURIERS: 'Failed to load courier options',

  /** User did not select required courier and pickup date */
  SELECT_REQUIRED: 'Please select courier and pickup date',

  /** Generic fulfillment operation failure */
  FULFILLMENT_FAILED: 'Failed to complete fulfillment',

  /** Invalid pickup date selected */
  INVALID_DATE: 'Invalid pickup date',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/**
 * Standardized success messages for fulfillment operations
 */
export const SUCCESS_MESSAGES = {
  /** Order successfully fulfilled */
  ORDER_FULFILLED: 'Order fulfilled successfully',
} as const;
