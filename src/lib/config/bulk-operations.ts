/**
 * Bulk Operations Configuration
 * Centralized configuration for all bulk operations following CLAUDE.md principles
 * Single source of truth for bulk operation constants
 */

export const BULK_OPERATIONS_CONFIG = {
  /**
   * Maximum number of items that can be selected for bulk operations
   * Prevents performance issues and potential DOS attacks
   */
  MAX_SELECTION_SIZE: 100,

  /**
   * Batch size for processing bulk operations
   * Prevents database timeouts and memory issues
   */
  BATCH_SIZE: 10,

  /**
   * Operation timeout in milliseconds
   */
  TIMEOUT: 30000, // 30 seconds

  /**
   * User-facing confirmation messages
   */
  CONFIRMATION_MESSAGES: {
    DELETE:
      'Are you sure you want to delete {count} product(s)? This action cannot be undone.',
    DELETE_SINGLE:
      'Are you sure you want to delete this product? This action cannot be undone.',
  },

  /**
   * Success messages
   */
  SUCCESS_MESSAGES: {
    DELETE: 'Successfully deleted {count} product(s)',
    DELETE_PARTIAL:
      'Deleted {successCount} product(s). {failureCount} product(s) could not be deleted.',
  },

  /**
   * Error messages
   */
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'You do not have permission to perform this action',
    INVALID_SELECTION: 'Invalid product selection',
    MAX_SELECTION_EXCEEDED: 'Cannot select more than {max} products at once',
    OPERATION_FAILED: 'Operation failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  },

  /**
   * Supported bulk operations
   */
  OPERATIONS: {
    DELETE: 'DELETE',
  } as const,

  /**
   * UI Constants
   */
  UI: {
    ACTION_BAR_HEIGHT: 80,
    CHECKBOX_SIZE: 20,
    ANIMATION_DURATION: 200,
  },

  /**
   * API Rate Limiting
   */
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 10,
    WINDOW_MS: 60000, // 1 minute
  },
} as const;

/**
 * Type definitions for bulk operations
 */
export type BulkOperation =
  (typeof BULK_OPERATIONS_CONFIG.OPERATIONS)[keyof typeof BULK_OPERATIONS_CONFIG.OPERATIONS];

export type BulkOperationResult = {
  success: boolean;
  message: string;
  processedCount: number;
  failedCount: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
};

/**
 * Helper function to format confirmation messages
 */
export const formatMessage = (
  template: string,
  replacements: Record<string, string | number>
): string => {
  return Object.entries(replacements).reduce(
    (message, [key, value]) =>
      message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
};

/**
 * Validation helper for bulk operation parameters
 */
export const validateBulkOperation = (
  operation: string,
  selectionCount: number
): { valid: boolean; error?: string } => {
  if (
    !Object.values(BULK_OPERATIONS_CONFIG.OPERATIONS).includes(
      operation as BulkOperation
    )
  ) {
    return { valid: false, error: 'Invalid operation type' };
  }

  if (selectionCount === 0) {
    return { valid: false, error: 'No items selected' };
  }

  if (selectionCount > BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE) {
    return {
      valid: false,
      error: formatMessage(
        BULK_OPERATIONS_CONFIG.ERROR_MESSAGES.MAX_SELECTION_EXCEEDED,
        {
          max: BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
        }
      ),
    };
  }

  return { valid: true };
};
