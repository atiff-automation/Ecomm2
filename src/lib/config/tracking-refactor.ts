/**
 * Tracking Refactor Configuration System
 * Centralized configuration for the new tracking cache architecture
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

export const TRACKING_REFACTOR_CONFIG = {
  // Update Frequencies (minutes)
  UPDATE_FREQUENCIES: {
    PRE_SHIPMENT: parseInt(
      process.env.TRACKING_PRE_SHIPMENT_FREQ || '1440',
      10
    ), // 24 hours
    IN_TRANSIT: parseInt(process.env.TRACKING_IN_TRANSIT_FREQ || '120', 10), // 2 hours
    OUT_FOR_DELIVERY: parseInt(
      process.env.TRACKING_OUT_FOR_DELIVERY_FREQ || '30',
      10
    ), // 30 min
    EXCEPTION_HANDLING: parseInt(
      process.env.TRACKING_EXCEPTION_FREQ || '60',
      10
    ), // 1 hour
    DELIVERED_FINAL: 0, // No more updates
  },

  // Job Processing
  JOB_PROCESSING: {
    BATCH_SIZE: parseInt(process.env.TRACKING_JOB_BATCH_SIZE || '10', 10),
    MAX_CONCURRENT: parseInt(process.env.TRACKING_MAX_CONCURRENT || '3', 10),
    RETRY_DELAYS: [60, 300, 900], // 1min, 5min, 15min (in seconds)
    MAX_FAILURES: parseInt(process.env.TRACKING_MAX_FAILURES || '5', 10),
  },

  // API Management
  API_MANAGEMENT: {
    REQUEST_TIMEOUT: parseInt(process.env.TRACKING_API_TIMEOUT || '10000', 10),
    RATE_LIMIT_BUFFER: parseInt(process.env.TRACKING_RATE_BUFFER || '5', 10),
    DAILY_API_BUDGET: parseInt(process.env.TRACKING_DAILY_BUDGET || '1000', 10),
  },

  // Cache Management
  CACHE_SETTINGS: {
    TTL_HOURS: parseInt(process.env.TRACKING_CACHE_TTL || '24', 10),
    CLEANUP_INTERVAL: parseInt(
      process.env.TRACKING_CLEANUP_INTERVAL || '3600',
      10
    ),
    MAX_EVENT_HISTORY: parseInt(process.env.TRACKING_MAX_EVENTS || '50', 10),
  },

  // Job Priorities (lower number = higher priority)
  JOB_PRIORITIES: {
    MANUAL: 50,
    RETRY: 75,
    SCHEDULED: 100,
    CLEANUP: 200,
  },

  // Status Mapping for Update Frequency
  STATUS_UPDATE_MAPPING: {
    PENDING: 'PRE_SHIPMENT',
    CONFIRMED: 'PRE_SHIPMENT',
    PROCESSING: 'PRE_SHIPMENT',
    SHIPPED: 'IN_TRANSIT',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED_FINAL',
    CANCELLED: 'DELIVERED_FINAL',
    FAILED: 'EXCEPTION_HANDLING',
    EXCEPTION: 'EXCEPTION_HANDLING',
  },

  // Localization
  LOCALIZATION: {
    TIMEZONE: process.env.TRACKING_TIMEZONE || 'Asia/Kuala_Lumpur',
    DATE_FORMAT: process.env.TRACKING_DATE_FORMAT || 'en-MY',
    CURRENCY: process.env.TRACKING_CURRENCY || 'MYR',
  },

  // Performance Monitoring
  PERFORMANCE: {
    REQUEST_TIMEOUT_MS: parseInt(
      process.env.TRACKING_REQUEST_TIMEOUT || '10000',
      10
    ),
    SLOW_REQUEST_THRESHOLD_MS: parseInt(
      process.env.TRACKING_SLOW_THRESHOLD || '5000',
      10
    ),
    MAX_RETRY_ATTEMPTS: parseInt(process.env.TRACKING_MAX_RETRIES || '3', 10),
  },

  // Security Settings
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: parseInt(
      process.env.TRACKING_MAX_LOGIN_ATTEMPTS || '5',
      10
    ),
    LOCKOUT_DURATION_MS: parseInt(
      process.env.TRACKING_LOCKOUT_DURATION || '300000',
      10
    ), // 5 minutes
    SESSION_TIMEOUT_MS: parseInt(
      process.env.TRACKING_SESSION_TIMEOUT || '1800000',
      10
    ), // 30 minutes
    API_KEY_ROTATION_DAYS: parseInt(
      process.env.TRACKING_API_KEY_ROTATION || '30',
      10
    ),
  },

  // Debug and Development
  DEBUG: {
    ENABLE_DEBUG: process.env.TRACKING_ENABLE_DEBUG === 'true',
    LOG_LEVEL: process.env.TRACKING_LOG_LEVEL || 'info',
    VERBOSE_LOGGING: process.env.TRACKING_VERBOSE_LOGGING === 'true',
    MOCK_API_RESPONSES: process.env.TRACKING_MOCK_API === 'true',
  },

  // Auto Refresh Settings
  AUTO_REFRESH: {
    ENABLED: process.env.TRACKING_AUTO_REFRESH_ENABLED !== 'false',
    INTERVAL_MS: parseInt(process.env.TRACKING_AUTO_REFRESH || '300000', 10), // 5 minutes
    MANUAL_COOLDOWN_MS: parseInt(
      process.env.TRACKING_MANUAL_COOLDOWN || '30000',
      10
    ), // 30 seconds
  },

  // Notification Settings
  NOTIFICATIONS: {
    STATUS_CHANGE_ENABLED: process.env.TRACKING_NOTIFY_STATUS === 'true',
    DELIVERY_ALERTS_ENABLED: process.env.TRACKING_NOTIFY_DELIVERY === 'true',
    EXCEPTION_ALERTS_ENABLED: process.env.TRACKING_NOTIFY_EXCEPTIONS === 'true',
    ADMIN_ALERT_THRESHOLD: parseInt(
      process.env.TRACKING_ADMIN_ALERT_THRESHOLD || '10',
      10
    ),
  },

  // Archive and Cleanup
  ARCHIVE: {
    ARCHIVE_AFTER_DAYS: parseInt(process.env.TRACKING_ARCHIVE_DAYS || '90', 10),
    DELETE_AFTER_DAYS: parseInt(process.env.TRACKING_DELETE_DAYS || '365', 10),
    BATCH_ARCHIVE_SIZE: parseInt(
      process.env.TRACKING_ARCHIVE_BATCH || '100',
      10
    ),
  },
} as const;

/**
 * Get update frequency for a given status
 */
export const getUpdateFrequency = (status: string): number => {
  const normalizedStatus = status.toUpperCase();
  const mappedCategory =
    TRACKING_REFACTOR_CONFIG.STATUS_UPDATE_MAPPING[normalizedStatus] ||
    'IN_TRANSIT';
  return TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES[
    mappedCategory as keyof typeof TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES
  ];
};

/**
 * Check if status is terminal (no more updates needed)
 */
export const isTerminalStatus = (status: string): boolean => {
  const frequency = getUpdateFrequency(status);
  return frequency === 0;
};

/**
 * Get job priority for job type
 */
export const getJobPriority = (jobType: string): number => {
  const upperJobType = jobType.toUpperCase();
  return (
    TRACKING_REFACTOR_CONFIG.JOB_PRIORITIES[
      upperJobType as keyof typeof TRACKING_REFACTOR_CONFIG.JOB_PRIORITIES
    ] || TRACKING_REFACTOR_CONFIG.JOB_PRIORITIES.SCHEDULED
  );
};

/**
 * Calculate next update time based on status and current conditions
 */
export const calculateNextUpdate = (
  currentStatus: string,
  lastUpdate: Date,
  consecutiveFailures: number = 0,
  estimatedDelivery?: Date
): Date => {
  // Base frequency from configuration
  let frequencyMinutes = getUpdateFrequency(currentStatus);

  // If terminal status, no more updates
  if (frequencyMinutes === 0) {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year in future
  }

  // Increase frequency for delivery day
  if (estimatedDelivery && isDeliveryDay(estimatedDelivery)) {
    frequencyMinutes = Math.min(frequencyMinutes, 30);
  }

  // Reduce frequency for failures (exponential backoff)
  if (consecutiveFailures > 0) {
    const backoffMultiplier = Math.pow(2, Math.min(consecutiveFailures, 4));
    frequencyMinutes *= backoffMultiplier;
  }

  // Weekend/holiday adjustments (reduce frequency)
  if (isWeekendOrHoliday()) {
    frequencyMinutes *= 1.5;
  }

  // Ensure minimum and maximum bounds
  const minFrequency = 15; // Minimum 15 minutes
  const maxFrequency = 24 * 60; // Maximum 24 hours
  frequencyMinutes = Math.max(
    minFrequency,
    Math.min(maxFrequency, frequencyMinutes)
  );

  return new Date(Date.now() + frequencyMinutes * 60 * 1000);
};

/**
 * Check if date is delivery day (today or tomorrow)
 */
export const isDeliveryDay = (estimatedDelivery: Date): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const deliveryDate = new Date(
    estimatedDelivery.getFullYear(),
    estimatedDelivery.getMonth(),
    estimatedDelivery.getDate()
  );

  return (
    deliveryDate.getTime() === today.getTime() ||
    deliveryDate.getTime() === tomorrow.getTime()
  );
};

/**
 * Check if current time is weekend or holiday
 */
export const isWeekendOrHoliday = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Weekend check (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // Malaysian public holidays check (simplified)
  const month = now.getMonth() + 1;
  const date = now.getDate();

  // New Year's Day
  if (month === 1 && date === 1) {
    return true;
  }

  // Malaysia Day
  if (month === 9 && date === 16) {
    return true;
  }

  // Independence Day (Merdeka)
  if (month === 8 && date === 31) {
    return true;
  }

  // Christmas
  if (month === 12 && date === 25) {
    return true;
  }

  // Add more holidays as needed
  return false;
};

/**
 * Get retry delay for failed attempts
 */
export const getRetryDelay = (attemptNumber: number): number => {
  const delays = TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.RETRY_DELAYS;
  const index = Math.min(attemptNumber - 1, delays.length - 1);
  return delays[index] * 1000; // Convert to milliseconds
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  return TRACKING_REFACTOR_CONFIG.DEBUG.ENABLE_DEBUG;
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isDevelopment,
    isProduction,
    isTest: process.env.NODE_ENV === 'test',

    // Adjust settings based on environment
    updateFrequencies: isDevelopment
      ? {
          ...TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES,
          IN_TRANSIT: 5, // 5 minutes for development
          OUT_FOR_DELIVERY: 2, // 2 minutes for development
        }
      : TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES,

    apiTimeout: isDevelopment
      ? 30000
      : TRACKING_REFACTOR_CONFIG.API_MANAGEMENT.REQUEST_TIMEOUT,
    batchSize: isDevelopment
      ? 5
      : TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE,
  };
};

/**
 * Validate configuration on startup
 */
export const validateConfiguration = (): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Validate numeric configurations
  const numericConfigs = {
    'UPDATE_FREQUENCIES.IN_TRANSIT':
      TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES.IN_TRANSIT,
    'JOB_PROCESSING.BATCH_SIZE':
      TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE,
    'API_MANAGEMENT.REQUEST_TIMEOUT':
      TRACKING_REFACTOR_CONFIG.API_MANAGEMENT.REQUEST_TIMEOUT,
  };

  Object.entries(numericConfigs).forEach(([key, value]) => {
    if (isNaN(value) || value < 0) {
      errors.push(`Invalid configuration for ${key}: ${value}`);
    }
  });

  // Validate batch size limits
  if (TRACKING_REFACTOR_CONFIG.JOB_PROCESSING.BATCH_SIZE > 50) {
    errors.push(
      'JOB_PROCESSING.BATCH_SIZE should not exceed 50 for performance reasons'
    );
  }

  // Validate timeout values
  if (TRACKING_REFACTOR_CONFIG.API_MANAGEMENT.REQUEST_TIMEOUT < 1000) {
    errors.push('API_MANAGEMENT.REQUEST_TIMEOUT should be at least 1000ms');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Log configuration on startup (for debugging)
 */
export const logConfiguration = (): void => {
  if (TRACKING_REFACTOR_CONFIG.DEBUG.ENABLE_DEBUG) {
    console.log('🔧 Tracking Refactor Configuration:', {
      updateFrequencies: TRACKING_REFACTOR_CONFIG.UPDATE_FREQUENCIES,
      jobProcessing: TRACKING_REFACTOR_CONFIG.JOB_PROCESSING,
      apiManagement: TRACKING_REFACTOR_CONFIG.API_MANAGEMENT,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }
};

// Validate configuration on module load
const configValidation = validateConfiguration();
if (!configValidation.isValid) {
  console.error('❌ Invalid tracking configuration:', configValidation.errors);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid tracking configuration in production');
  }
}

// Log configuration if debug is enabled
logConfiguration();
