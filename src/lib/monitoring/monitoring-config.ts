/**
 * Centralized Monitoring Configuration - Malaysian E-commerce Platform
 * Single Source of Truth for all monitoring settings
 * Following @CLAUDE.md principles: systematic, DRY, centralized
 */

interface MonitoringConfig {
  // Core feature controls - Single source of truth
  features: {
    [key: string]: boolean;
  };

  // Systematic throttling configuration
  throttling: {
    performance: {
      maxCallsPerMinute: number;
      batchSize: number;
      debounceMs: number;
    };
    events: {
      maxCallsPerMinute: number;
      batchSize: number;
      debounceMs: number;
    };
    errors: {
      maxCallsPerMinute: number;
      batchSize: number;
      debounceMs: number;
    };
  };

  // Circuit breaker configuration per feature
  circuitBreaker: {
    [feature: string]: {
      maxFailures: number;
      resetTimeoutMs: number;
      enabled: boolean;
    };
  };

  // Environment-specific sampling
  sampling: {
    [environment: string]: number;
  };

  // API endpoints - Centralized configuration
  endpoints: {
    performance: string;
    events: string;
    errors: string;
    health: string;
  };
}

/**
 * CENTRALIZED MONITORING CONFIGURATION
 * All monitoring behavior controlled from this single location
 */
export const MONITORING_CONFIG: MonitoringConfig = {
  // Single source of truth for feature enables/disables
  features: {
    performance: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    errors: process.env.ENABLE_ERROR_MONITORING === 'true',
    events: process.env.ENABLE_EVENT_MONITORING === 'true',
    userTracking: process.env.ENABLE_USER_TRACKING === 'true',
  },

  // Systematic throttling - No hardcoded values
  throttling: {
    performance: {
      maxCallsPerMinute: parseInt(
        process.env.MONITORING_MAX_CALLS_PER_MINUTE || '10',
        10
      ),
      batchSize: parseInt(process.env.MONITORING_BATCH_SIZE || '5', 10),
      debounceMs: parseInt(process.env.MONITORING_DEBOUNCE_MS || '5000', 10),
    },
    events: {
      maxCallsPerMinute: parseInt(
        process.env.MONITORING_MAX_CALLS_PER_MINUTE || '20',
        10
      ),
      batchSize: parseInt(process.env.MONITORING_BATCH_SIZE || '10', 10),
      debounceMs: parseInt(process.env.MONITORING_DEBOUNCE_MS || '2000', 10),
    },
    errors: {
      maxCallsPerMinute: parseInt(
        process.env.MONITORING_MAX_CALLS_PER_MINUTE || '50',
        10
      ),
      batchSize: parseInt(process.env.MONITORING_BATCH_SIZE || '20', 10),
      debounceMs: parseInt(process.env.MONITORING_DEBOUNCE_MS || '1000', 10),
    },
  },

  // Circuit breaker protection - Systematic failure handling
  circuitBreaker: {
    performance: {
      maxFailures: parseInt(process.env.MONITORING_MAX_FAILURES || '3', 10),
      resetTimeoutMs: parseInt(
        process.env.MONITORING_RESET_TIMEOUT || '60000',
        10
      ),
      enabled: true,
    },
    events: {
      maxFailures: parseInt(process.env.MONITORING_MAX_FAILURES || '5', 10),
      resetTimeoutMs: parseInt(
        process.env.MONITORING_RESET_TIMEOUT || '30000',
        10
      ),
      enabled: true,
    },
    errors: {
      maxFailures: parseInt(process.env.MONITORING_MAX_FAILURES || '10', 10),
      resetTimeoutMs: parseInt(
        process.env.MONITORING_RESET_TIMEOUT || '15000',
        10
      ),
      enabled: true,
    },
  },

  // Environment-specific sampling rates
  sampling: {
    development: 0.1, // 10% sampling in development
    production: 0.05, // 5% sampling in production
    test: 0.0, // No monitoring in tests
  },

  // Centralized API endpoints
  endpoints: {
    performance: '/api/monitoring/performance',
    events: '/api/monitoring/events',
    errors: '/api/monitoring/errors',
    health: '/api/health',
  },
};

/**
 * Get monitoring configuration - Single access point
 */
export function getMonitoringConfig(): MonitoringConfig {
  return MONITORING_CONFIG;
}

/**
 * Check if a monitoring feature is enabled - DRY pattern
 */
export function isFeatureEnabled(feature: string): boolean {
  // Emergency disable override - Systematic control
  if (process.env.MONITORING_EMERGENCY_DISABLE === 'true') {
    return false;
  }

  return MONITORING_CONFIG.features[feature] === true;
}

/**
 * Get sampling rate for current environment - Centralized logic
 */
export function getSamplingRate(): number {
  const environment = process.env.NODE_ENV || 'development';
  return MONITORING_CONFIG.sampling[environment] || 0.1;
}

/**
 * Get throttling config for a feature - Systematic access
 */
export function getThrottlingConfig(feature: string) {
  return (
    MONITORING_CONFIG.throttling[
      feature as keyof typeof MONITORING_CONFIG.throttling
    ] || MONITORING_CONFIG.throttling.performance
  );
}

/**
 * Get circuit breaker config for a feature - Systematic access
 */
export function getCircuitBreakerConfig(feature: string) {
  return (
    MONITORING_CONFIG.circuitBreaker[feature] ||
    MONITORING_CONFIG.circuitBreaker.performance
  );
}

/**
 * Dynamic configuration update - Centralized control
 */
export function updateMonitoringConfig(
  updates: Partial<MonitoringConfig>
): void {
  if (updates.features) {
    Object.assign(MONITORING_CONFIG.features, updates.features);
  }

  if (updates.throttling) {
    Object.assign(MONITORING_CONFIG.throttling, updates.throttling);
  }

  if (updates.circuitBreaker) {
    Object.assign(MONITORING_CONFIG.circuitBreaker, updates.circuitBreaker);
  }

  if (updates.sampling) {
    Object.assign(MONITORING_CONFIG.sampling, updates.sampling);
  }
}

/**
 * Emergency disable all monitoring - Emergency control
 */
export function emergencyDisableMonitoring(): void {
  Object.keys(MONITORING_CONFIG.features).forEach(feature => {
    MONITORING_CONFIG.features[feature] = false;
  });

  console.warn('🚨 EMERGENCY: All monitoring features disabled');
}

/**
 * Validate configuration on startup - Quality assurance
 */
export function validateMonitoringConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate throttling values
  Object.values(MONITORING_CONFIG.throttling).forEach((config, index) => {
    if (config.maxCallsPerMinute <= 0) {
      errors.push(`Invalid maxCallsPerMinute in throttling config ${index}`);
    }
    if (config.batchSize <= 0) {
      errors.push(`Invalid batchSize in throttling config ${index}`);
    }
    if (config.debounceMs < 0) {
      errors.push(`Invalid debounceMs in throttling config ${index}`);
    }
  });

  // Validate circuit breaker values
  Object.values(MONITORING_CONFIG.circuitBreaker).forEach((config, index) => {
    if (config.maxFailures <= 0) {
      errors.push(`Invalid maxFailures in circuit breaker config ${index}`);
    }
    if (config.resetTimeoutMs <= 0) {
      errors.push(`Invalid resetTimeoutMs in circuit breaker config ${index}`);
    }
  });

  // Validate sampling rates
  Object.values(MONITORING_CONFIG.sampling).forEach((rate, index) => {
    if (rate < 0 || rate > 1) {
      errors.push(
        `Invalid sampling rate ${rate} at index ${index} (must be 0-1)`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Type exports for systematic usage
export type { MonitoringConfig };
