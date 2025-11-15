/**
 * Theme Constants - Malaysian E-commerce Platform
 * Single source of truth for color schemes and styling
 * Following @CLAUDE.md principles - centralized theme, no hardcoding
 */

/**
 * Member panel theme configurations
 */
export const THEME_CONSTANTS = {
  /** Member summary card styling */
  MEMBER_SUMMARY: {
    /** Member background gradient */
    BACKGROUND: 'bg-gradient-to-r from-purple-50 to-blue-50',
    /** Member border */
    BORDER: 'border-purple-200',
  },

  /** Member benefits cards */
  BENEFITS: {
    /** Exclusive pricing benefit */
    PRICING: {
      BACKGROUND: 'bg-green-50',
      TEXT: 'text-green-900',
      DESCRIPTION: 'text-green-700',
    },
    /** Priority support benefit */
    SUPPORT: {
      BACKGROUND: 'bg-blue-50',
      TEXT: 'text-blue-900',
      DESCRIPTION: 'text-blue-700',
    },
    /** Early access benefit */
    EARLY_ACCESS: {
      BACKGROUND: 'bg-purple-50',
      TEXT: 'text-purple-900',
      DESCRIPTION: 'text-purple-700',
    },
  },

  /** Badge variants */
  BADGES: {
    /** Member badge (qualified users) */
    MEMBER: 'bg-green-600 text-white',
    /** Regular customer badge (not yet qualified) */
    REGULAR: 'border-gray-300 text-gray-600',
  },

  /** Status colors (for order status, etc.) */
  STATUS: {
    SUCCESS: 'bg-green-100 text-green-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-800',
    ERROR: 'bg-red-100 text-red-800',
    DEFAULT: 'bg-gray-100 text-gray-800',
  },

  /** Password requirements info box */
  PASSWORD_REQUIREMENTS: {
    BACKGROUND: 'bg-blue-50',
    BORDER: 'border-blue-200',
    TEXT: 'text-blue-900',
    DESCRIPTION: 'text-blue-800',
  },

  /** Success message styling */
  SUCCESS_MESSAGE: {
    BACKGROUND: 'bg-green-50',
    BORDER: 'border-green-200',
    TEXT: 'text-green-900',
    DESCRIPTION: 'text-green-700',
  },

  /** Error message styling */
  ERROR_MESSAGE: {
    BACKGROUND: 'bg-red-50',
    BORDER: 'border-red-200',
    TEXT: 'text-red-800',
  },
} as const;

/**
 * Savings display theme (gradient backgrounds for impact)
 */
export const SAVINGS_THEME = {
  /** Main savings display */
  GRADIENT: 'bg-gradient-to-r from-green-50 to-blue-50',
  /** Savings amount color */
  AMOUNT_COLOR: 'text-green-600',
  /** Label color */
  LABEL_COLOR: 'text-gray-600',
} as const;
