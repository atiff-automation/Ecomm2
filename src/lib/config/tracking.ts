/**
 * Customer Tracking Configuration
 * Centralized configuration for all tracking-related settings
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

export const TRACKING_CONFIG = {
  // Rate Limiting
  RATE_LIMITS: {
    GUEST: {
      REQUESTS_PER_HOUR: parseInt(process.env.GUEST_TRACKING_RATE_LIMIT || '10', 10),
      WINDOW_MS: 60 * 60 * 1000, // 1 hour
    },
    CUSTOMER: {
      REQUESTS_PER_MINUTE: parseInt(process.env.CUSTOMER_TRACKING_RATE_LIMIT || '10', 10),
      WINDOW_MS: 60 * 1000, // 1 minute
    },
  },

  // Order Number Format
  ORDER_FORMAT: {
    PREFIX: 'ORD',
    DATE_FORMAT: 'YYYYMMDD',
    SUFFIX_LENGTH: 4,
    PATTERN: /^ORD-\d{8}-\w{4}$/i,
    EXAMPLE: 'ORD-20250821-A1B2',
    MAX_LENGTH: 17,
  },

  // Tracking Status Mapping
  STATUS_MAPPING: {
    // Delivered states
    DELIVERED: {
      keywords: ['delivered', 'completed'],
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: 'CheckCircle',
      priority: 100,
      isTerminal: true,
    },
    // In transit states
    IN_TRANSIT: {
      keywords: ['in_transit', 'transit', 'shipped', 'on_the_way'],
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: 'Truck',
      priority: 80,
      isTerminal: false,
    },
    // Out for delivery
    OUT_FOR_DELIVERY: {
      keywords: ['out_for_delivery', 'out for delivery', 'delivering'],
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'Truck',
      priority: 90,
      isTerminal: false,
    },
    // Processing states
    PROCESSING: {
      keywords: ['processing', 'confirmed', 'preparing'],
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: 'Package',
      priority: 60,
      isTerminal: false,
    },
    // Pending states
    PENDING: {
      keywords: ['pending', 'created', 'waiting'],
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: 'Clock',
      priority: 40,
      isTerminal: false,
    },
    // Exception states
    EXCEPTION: {
      keywords: ['exception', 'failed', 'error', 'issue', 'problem'],
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: 'AlertCircle',
      priority: 20,
      isTerminal: false,
    },
    // Unknown/default
    UNKNOWN: {
      keywords: [],
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: 'Package',
      priority: 0,
      isTerminal: false,
    },
  } as const,

  // Security Settings
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_TRACKING_LOGIN_ATTEMPTS || '5', 10),
    LOCKOUT_DURATION_MS: parseInt(process.env.TRACKING_LOCKOUT_DURATION || '300000', 10), // 5 minutes
    SESSION_TIMEOUT_MS: parseInt(process.env.TRACKING_SESSION_TIMEOUT || '1800000', 10), // 30 minutes
  },

  // Data Privacy
  PRIVACY: {
    GUEST_DATA_RETENTION_HOURS: parseInt(process.env.GUEST_TRACKING_RETENTION || '0', 10), // Don't store
    LOG_RETENTION_DAYS: parseInt(process.env.TRACKING_LOG_RETENTION || '30', 10),
    SENSITIVE_FIELDS: ['address', 'phone', 'email', 'name', 'location'] as const,
  },

  // UI Configuration
  UI: {
    REFRESH_INTERVALS: {
      AUTOMATIC_MS: parseInt(process.env.TRACKING_AUTO_REFRESH || '300000', 10), // 5 minutes
      MANUAL_COOLDOWN_MS: parseInt(process.env.TRACKING_MANUAL_COOLDOWN || '10000', 10), // 10 seconds
    },
    TIMELINE: {
      MAX_EVENTS: parseInt(process.env.MAX_TIMELINE_EVENTS || '50', 10),
      PAGINATION_SIZE: parseInt(process.env.TIMELINE_PAGE_SIZE || '10', 10),
    },
    MOBILE: {
      BREAKPOINTS: {
        SM: '640px',
        MD: '768px',
        LG: '1024px',
      },
    },
  },

  // Malaysian-specific settings
  LOCALIZATION: {
    TIMEZONE: process.env.TRACKING_TIMEZONE || 'Asia/Kuala_Lumpur',
    CURRENCY: process.env.TRACKING_CURRENCY || 'MYR',
    PHONE_PATTERN: /^(\+?6?0?1[0-9]-?[0-9]{7,8}|[\d\s\-\+\(\)]{8,15})$/,
    DATE_FORMAT: 'en-MY',
  },

  // Performance Optimization
  PERFORMANCE: {
    CACHE_TTL_MS: parseInt(process.env.TRACKING_CACHE_TTL || '300000', 10), // 5 minutes
    REQUEST_TIMEOUT_MS: parseInt(process.env.TRACKING_REQUEST_TIMEOUT || '10000', 10), // 10 seconds
    BATCH_SIZE: parseInt(process.env.TRACKING_BATCH_SIZE || '20', 10),
  },
} as const;

/**
 * Get tracking status info by status string
 */
export const getTrackingStatusInfo = (status?: string) => {
  if (!status) return TRACKING_CONFIG.STATUS_MAPPING.UNKNOWN;

  const normalizedStatus = status.toLowerCase();
  
  // Find matching status by keywords
  for (const [key, config] of Object.entries(TRACKING_CONFIG.STATUS_MAPPING)) {
    if (config.keywords.some(keyword => normalizedStatus.includes(keyword))) {
      return { ...config, key };
    }
  }
  
  return TRACKING_CONFIG.STATUS_MAPPING.UNKNOWN;
};

/**
 * Validate order number format
 */
export const validateOrderNumber = (orderNumber: string): boolean => {
  return TRACKING_CONFIG.ORDER_FORMAT.PATTERN.test(orderNumber);
};

/**
 * Format order number input
 */
export const formatOrderNumber = (value: string): string => {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Auto-format to ORD-YYYYMMDD-XXXX pattern
  if (cleaned.startsWith('ORD')) {
    let formatted = cleaned;
    if (formatted.length > 3 && formatted[3] !== '-') {
      formatted = formatted.slice(0, 3) + '-' + formatted.slice(3);
    }
    if (formatted.length > 12 && formatted[12] !== '-') {
      formatted = formatted.slice(0, 12) + '-' + formatted.slice(12);
    }
    return formatted.slice(0, TRACKING_CONFIG.ORDER_FORMAT.MAX_LENGTH);
  } else {
    return cleaned.slice(0, TRACKING_CONFIG.ORDER_FORMAT.MAX_LENGTH);
  }
};

/**
 * Check if tracking status is terminal (no further updates expected)
 */
export const isTerminalStatus = (status?: string): boolean => {
  const statusInfo = getTrackingStatusInfo(status);
  return statusInfo.isTerminal;
};

/**
 * Get status priority for sorting
 */
export const getStatusPriority = (status?: string): number => {
  const statusInfo = getTrackingStatusInfo(status);
  return statusInfo.priority;
};