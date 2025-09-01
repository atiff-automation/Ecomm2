/**
 * Redis Configuration Management - Production Ready
 * Following @REDIS_PRODUCTION_IMPLEMENTATION_PLAN.md architecture (lines 441-482)
 * Following @CLAUDE.md: NO hardcoding, systematic approach, centralized
 * 
 * Environment-aware Redis configuration with production security and performance
 */

export interface RedisConfig {
  host?: string;
  port?: number;
  url?: string;
  username?: string;
  password?: string;
  db?: number;
  tls?: {
    servername?: string;
  };
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
  enableOfflineQueue?: boolean;
  maxMemoryPolicy?: string;
  keyPrefix?: string;
  enableReadyCheck?: boolean;
  family?: number;
  keepAlive?: boolean;
  retryStrategy?: (times: number) => number;
}

/**
 * Environment-specific Redis configurations
 * Following plan: Centralized configuration management
 */
export const REDIS_CONFIG: Record<string, RedisConfig> = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
    // No authentication for development - simplified setup
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 3000,
    enableReadyCheck: false,
    family: 4,
    keepAlive: true,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'dev:ecom:',
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 1000);
      return delay;
    },
  },
  staging: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    tls: {}, // Enable TLS for staging
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 5,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'staging:ecom:',
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 2000);
      return delay;
    },
  },
  production: {
    url: process.env.REDIS_URL,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: {
      servername: process.env.REDIS_HOST,
    },
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 10,
    lazyConnect: true,
    connectTimeout: 15000,
    commandTimeout: 8000,
    enableReadyCheck: true,
    family: 4,
    keepAlive: true,
    // Production-specific settings for reliability
    enableOfflineQueue: false,
    maxMemoryPolicy: 'allkeys-lru',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'prod:ecom:',
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 3000);
      if (times > 20) {
        // Stop retrying after 20 attempts
        return undefined;
      }
      return delay;
    },
  },
};

/**
 * Get environment-specific Redis configuration
 * Following @CLAUDE.md: Single source of truth, systematic approach
 */
export const getRedisConfig = (): RedisConfig => {
  const env = process.env.NODE_ENV || 'development';
  const config = REDIS_CONFIG[env] || REDIS_CONFIG.development;
  
  // Validate critical production settings
  if (env === 'production') {
    if (!config.password && !config.url) {
      console.warn('⚠️ Production Redis: No authentication configured');
    }
    if (!config.tls?.servername && !config.url?.includes('rediss://')) {
      console.warn('⚠️ Production Redis: TLS not properly configured');
    }
  }
  
  return config;
};

/**
 * Validate Redis configuration for environment
 * Following plan: Configuration validation and error prevention
 */
export const validateRedisConfig = (config: RedisConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const env = process.env.NODE_ENV || 'development';
  
  // Environment-specific validation
  switch (env) {
    case 'production':
      if (!config.password && !config.url) {
        errors.push('Production requires Redis authentication (password or URL)');
      }
      if (!config.tls && !config.url?.includes('rediss://')) {
        errors.push('Production should use TLS encryption');
      }
      if (config.maxRetriesPerRequest && config.maxRetriesPerRequest < 5) {
        errors.push('Production should have higher retry limits for reliability');
      }
      break;
      
    case 'staging':
      if (!config.password && !config.url) {
        errors.push('Staging should use authentication to match production');
      }
      break;
      
    case 'development':
      // More relaxed validation for development
      if (config.tls && !config.password) {
        errors.push('Development TLS requires password');
      }
      break;
  }
  
  // Common validation
  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Invalid Redis port number');
  }
  
  if (config.connectTimeout && config.connectTimeout < 1000) {
    errors.push('Connection timeout too low (minimum 1000ms recommended)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get Redis connection URL for environment
 * Following plan: Flexible connection string generation
 */
export const getRedisConnectionUrl = (): string | undefined => {
  const config = getRedisConfig();
  
  // If URL is provided, use it directly
  if (config.url) {
    return config.url;
  }
  
  // Build URL from components
  if (config.host && config.port) {
    const protocol = config.tls ? 'rediss' : 'redis';
    const auth = config.password ? `:${config.password}@` : '';
    const db = config.db ? `/${config.db}` : '';
    
    return `${protocol}://${auth}${config.host}:${config.port}${db}`;
  }
  
  return undefined;
};

/**
 * Redis configuration presets for common scenarios
 * Following @CLAUDE.md: Systematic approach, no hardcoding
 */
export const REDIS_PRESETS = {
  // High-performance preset for heavy workloads
  highPerformance: {
    maxRetriesPerRequest: 15,
    connectTimeout: 20000,
    commandTimeout: 10000,
    retryDelayOnFailover: 50,
    enableOfflineQueue: false,
    maxMemoryPolicy: 'allkeys-lru',
  },
  
  // Low-latency preset for real-time applications
  lowLatency: {
    maxRetriesPerRequest: 3,
    connectTimeout: 3000,
    commandTimeout: 1000,
    retryDelayOnFailover: 25,
    enableOfflineQueue: true,
    maxMemoryPolicy: 'volatile-lru',
  },
  
  // Resilient preset for unreliable networks
  resilient: {
    maxRetriesPerRequest: 20,
    connectTimeout: 30000,
    commandTimeout: 15000,
    retryDelayOnFailover: 200,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
  }
};

/**
 * Apply preset configuration overlay
 * Following plan: Flexible configuration composition
 */
export const applyRedisPreset = (baseConfig: RedisConfig, preset: keyof typeof REDIS_PRESETS): RedisConfig => {
  const presetConfig = REDIS_PRESETS[preset];
  return { ...baseConfig, ...presetConfig };
};

/**
 * Environment-aware logging for Redis configuration
 * Following @CLAUDE.md: Centralized logging approach
 */
export const logRedisConfig = (): void => {
  const env = process.env.NODE_ENV || 'development';
  const config = getRedisConfig();
  const validation = validateRedisConfig(config);
  
  console.log(`🔧 Redis Config [${env.toUpperCase()}]:`);
  console.log(`   - Connection: ${config.host || 'URL'}:${config.port || 'default'}`);
  console.log(`   - Key Prefix: ${config.keyPrefix || 'none'}`);
  console.log(`   - TLS: ${config.tls ? 'enabled' : 'disabled'}`);
  console.log(`   - Auth: ${config.password ? 'configured' : 'none'}`);
  console.log(`   - Max Retries: ${config.maxRetriesPerRequest}`);
  console.log(`   - Timeout: ${config.connectTimeout}ms`);
  
  if (!validation.valid) {
    console.warn('⚠️ Redis Configuration Issues:');
    validation.errors.forEach(error => console.warn(`   - ${error}`));
  } else {
    console.log('✅ Redis configuration validated successfully');
  }
};

export default getRedisConfig;