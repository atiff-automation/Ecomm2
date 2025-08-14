/**
 * Centralized Application Configuration - Malaysian E-commerce Platform
 * Single source of truth for all configurable values across the application
 */

/**
 * Environment variable validation and defaults
 */
const isServer = typeof window === 'undefined';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for environment variable ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Server-only environment variable access
const getServerEnvVar = (key: string, defaultValue?: string): string => {
  if (!isServer) {
    return defaultValue || '';
  }
  return getEnvVar(key, defaultValue);
};

const getServerEnvNumber = (key: string, defaultValue: number): number => {
  if (!isServer) {
    return defaultValue;
  }
  return getEnvNumber(key, defaultValue);
};

const getServerEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  if (!isServer) {
    return defaultValue;
  }
  return getEnvBoolean(key, defaultValue);
};

/**
 * Application Configuration
 */
export const appConfig = {
  // Application
  app: {
    name: 'JRM E-commerce Platform',
    version: '1.0.0',
    description: 'Malaysian E-commerce Platform with Membership System',
    environment: getEnvVar('NODE_ENV', 'development'),
    baseUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    apiUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
  },

  // Database (server-only)
  database: {
    url: getServerEnvVar('DATABASE_URL', ''),
    maxConnections: getServerEnvNumber('DATABASE_MAX_CONNECTIONS', 20),
    connectionTimeout: getServerEnvNumber('DATABASE_CONNECTION_TIMEOUT', 30000),
    queryTimeout: getServerEnvNumber('DATABASE_QUERY_TIMEOUT', 60000),
  },

  // Authentication
  auth: {
    secret: getServerEnvVar('NEXTAUTH_SECRET', ''),
    url: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
    sessionMaxAge: getEnvNumber('NEXTAUTH_SESSION_MAX_AGE', 30 * 24 * 60 * 60), // 30 days
    jwtMaxAge: getEnvNumber('NEXTAUTH_JWT_MAX_AGE', 24 * 60 * 60), // 24 hours
    
    // Google OAuth (server-only)
    google: {
      clientId: getServerEnvVar('GOOGLE_CLIENT_ID', ''),
      clientSecret: getServerEnvVar('GOOGLE_CLIENT_SECRET', ''),
    },
    
    // Password requirements
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
  },

  // Business Rules
  business: {
    // Membership system
    membership: {
      threshold: getEnvNumber('MEMBERSHIP_THRESHOLD', 80), // RM 80
      currency: 'MYR',
      benefitDiscountPercentage: getEnvNumber('MEMBER_DISCOUNT_PERCENTAGE', 15), // 15% member discount
      autoUpgradeEnabled: getEnvBoolean('AUTO_MEMBERSHIP_UPGRADE', true),
    },

    // Cart system
    cart: {
      maxItems: getEnvNumber('CART_MAX_ITEMS', 50),
      maxQuantityPerItem: getEnvNumber('CART_MAX_QUANTITY_PER_ITEM', 10),
      guestCartExpiry: getEnvNumber('GUEST_CART_EXPIRY_HOURS', 24), // 24 hours
      sessionCookieName: 'guest_cart_id',
    },

    // Order system
    order: {
      numberPrefix: 'ORD',
      autoConfirmAfterMinutes: getEnvNumber('ORDER_AUTO_CONFIRM_MINUTES', 30),
      cancelAfterHours: getEnvNumber('ORDER_CANCEL_AFTER_HOURS', 24),
      maxOrderValue: getEnvNumber('MAX_ORDER_VALUE', 10000), // RM 10,000
      shippingThreshold: getEnvNumber('FREE_SHIPPING_THRESHOLD', 100), // RM 100
    },

    // Product system
    product: {
      maxImagesPerProduct: getEnvNumber('MAX_IMAGES_PER_PRODUCT', 10),
      maxVariantsPerProduct: getEnvNumber('MAX_VARIANTS_PER_PRODUCT', 20),
      lowStockThreshold: getEnvNumber('LOW_STOCK_THRESHOLD', 10),
      outOfStockThreshold: 0,
    },

    // Pricing
    pricing: {
      currency: 'MYR',
      currencySymbol: 'RM',
      decimalPlaces: 2,
      taxRate: getEnvNumber('TAX_RATE_PERCENTAGE', 6), // 6% SST in Malaysia
      memberDiscountPercentage: getEnvNumber('MEMBER_DISCOUNT_PERCENTAGE', 15),
    },
  },

  // Security
  security: {
    // Rate limiting
    rateLimiting: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
      enableInDevelopment: getEnvBoolean('RATE_LIMIT_DEV', false),
    },

    // CORS
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        getEnvVar('NEXTAUTH_URL', ''),
        getEnvVar('NEXT_PUBLIC_APP_URL', ''),
      ].filter(Boolean),
      allowCredentials: true,
    },

    // Session security
    session: {
      cookieSecure: getEnvBoolean('COOKIE_SECURE', process.env.NODE_ENV === 'production'),
      cookieHttpOnly: true,
      cookieSameSite: 'lax' as const,
      maxAge: getEnvNumber('SESSION_MAX_AGE', 24 * 60 * 60 * 1000), // 24 hours
    },

    // File uploads
    uploads: {
      maxFileSize: getEnvNumber('MAX_FILE_SIZE_MB', 5) * 1024 * 1024, // 5MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedDocumentTypes: ['application/pdf'],
    },
  },

  // External Services
  services: {
    // Email service (server-only)
    email: {
      provider: getServerEnvVar('EMAIL_PROVIDER', 'smtp'),
      smtp: {
        host: getServerEnvVar('SMTP_HOST', ''),
        port: getServerEnvNumber('SMTP_PORT', 587),
        secure: getServerEnvBoolean('SMTP_SECURE', false),
        user: getServerEnvVar('SMTP_USER', ''),
        password: getServerEnvVar('SMTP_PASSWORD', ''),
      },
      from: {
        name: getServerEnvVar('EMAIL_FROM_NAME', 'JRM E-commerce'),
        address: getServerEnvVar('EMAIL_FROM_ADDRESS', 'noreply@example.com'),
      },
    },

    // Storage service (server-only)
    storage: {
      provider: getServerEnvVar('STORAGE_PROVIDER', 'local'),
      local: {
        uploadsDir: getServerEnvVar('UPLOADS_DIR', './public/uploads'),
        publicPath: '/uploads',
      },
      s3: {
        bucket: getServerEnvVar('AWS_S3_BUCKET', ''),
        region: getServerEnvVar('AWS_S3_REGION', 'ap-southeast-1'),
        accessKeyId: getServerEnvVar('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: getServerEnvVar('AWS_SECRET_ACCESS_KEY', ''),
      },
    },

    // Payment services (server-only secrets, client-safe keys)
    payment: {
      stripe: {
        publishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', ''),
        secretKey: getServerEnvVar('STRIPE_SECRET_KEY', ''),
        webhookSecret: getServerEnvVar('STRIPE_WEBHOOK_SECRET', ''),
        currency: 'myr',
      },
      paypal: {
        clientId: getEnvVar('NEXT_PUBLIC_PAYPAL_CLIENT_ID', ''),
        clientSecret: getServerEnvVar('PAYPAL_CLIENT_SECRET', ''),
        environment: getEnvVar('PAYPAL_ENVIRONMENT', 'sandbox'),
      },
    },

    // Telegram service (server-only)
    telegram: {
      botToken: getServerEnvVar('TELEGRAM_BOT_TOKEN', ''),
      chatId: getServerEnvVar('TELEGRAM_CHAT_ID', ''),
      enabled: getServerEnvBoolean('TELEGRAM_ENABLED', false),
    },

    // Analytics (client-safe)
    analytics: {
      googleAnalyticsId: getEnvVar('NEXT_PUBLIC_GA_MEASUREMENT_ID', ''),
      facebookPixelId: getEnvVar('NEXT_PUBLIC_FACEBOOK_PIXEL_ID', ''),
      hotjarId: getEnvVar('NEXT_PUBLIC_HOTJAR_ID', ''),
    },
  },

  // UI/UX
  ui: {
    // Pagination
    pagination: {
      defaultPageSize: getEnvNumber('DEFAULT_PAGE_SIZE', 20),
      maxPageSize: getEnvNumber('MAX_PAGE_SIZE', 100),
      productsPerPage: getEnvNumber('PRODUCTS_PER_PAGE', 20),
      ordersPerPage: getEnvNumber('ORDERS_PER_PAGE', 10),
      reviewsPerPage: getEnvNumber('REVIEWS_PER_PAGE', 10),
    },

    // Loading and animations
    loading: {
      debounceMs: getEnvNumber('SEARCH_DEBOUNCE_MS', 300),
      skeletonCount: getEnvNumber('SKELETON_COUNT', 6),
      animationDuration: getEnvNumber('ANIMATION_DURATION_MS', 200),
    },

    // Image optimization
    images: {
      defaultQuality: getEnvNumber('IMAGE_QUALITY', 80),
      thumbnailSize: getEnvNumber('THUMBNAIL_SIZE', 200),
      mediumSize: getEnvNumber('MEDIUM_SIZE', 500),
      largeSize: getEnvNumber('LARGE_SIZE', 1200),
      formats: ['webp', 'jpeg'],
    },

    // Theme
    theme: {
      defaultMode: getEnvVar('DEFAULT_THEME_MODE', 'light'),
      allowToggle: getEnvBoolean('ALLOW_THEME_TOGGLE', true),
      primaryColor: getEnvVar('PRIMARY_COLOR', '#3b82f6'),
      secondaryColor: getEnvVar('SECONDARY_COLOR', '#64748b'),
    },
  },

  // Development
  development: {
    // Logging
    logging: {
      level: getEnvVar('LOG_LEVEL', 'info'),
      enableConsole: getEnvBoolean('LOG_CONSOLE', true),
      enableFile: getEnvBoolean('LOG_FILE', false),
      enableDatabase: getEnvBoolean('LOG_DATABASE', false),
    },

    // Debug
    debug: {
      enabled: getEnvBoolean('DEBUG_ENABLED', process.env.NODE_ENV === 'development'),
      showQueries: getEnvBoolean('DEBUG_QUERIES', false),
      showPerformance: getEnvBoolean('DEBUG_PERFORMANCE', false),
    },

    // Testing
    testing: {
      skipAuth: getEnvBoolean('TEST_SKIP_AUTH', false),
      mockPayments: getEnvBoolean('TEST_MOCK_PAYMENTS', process.env.NODE_ENV !== 'production'),
      seedDatabase: getEnvBoolean('TEST_SEED_DATABASE', false),
    },
  },

  // Feature flags
  features: {
    membership: getEnvBoolean('FEATURE_MEMBERSHIP', true),
    guestCheckout: getEnvBoolean('FEATURE_GUEST_CHECKOUT', true),
    productReviews: getEnvBoolean('FEATURE_PRODUCT_REVIEWS', true),
    wishlist: getEnvBoolean('FEATURE_WISHLIST', true),
    compare: getEnvBoolean('FEATURE_COMPARE', true),
    coupons: getEnvBoolean('FEATURE_COUPONS', true),
    socialLogin: getEnvBoolean('FEATURE_SOCIAL_LOGIN', true),
    newsletter: getEnvBoolean('FEATURE_NEWSLETTER', true),
    chatSupport: getEnvBoolean('FEATURE_CHAT_SUPPORT', false),
    multiLanguage: getEnvBoolean('FEATURE_MULTI_LANGUAGE', false),
    darkMode: getEnvBoolean('FEATURE_DARK_MODE', true),
  },
} as const;

/**
 * Runtime configuration validation
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Only validate server-only environment variables on the server
  if (isServer) {
    const requiredServerVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
    ];

    for (const key of requiredServerVars) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }
  }

  // Validate client-safe environment variables
  const requiredClientVars = [
    'NEXT_PUBLIC_APP_URL',
  ];

  for (const key of requiredClientVars) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate business rules
  if (appConfig.business.membership.threshold <= 0) {
    errors.push('Membership threshold must be greater than 0');
  }

  if (appConfig.business.pricing.taxRate < 0 || appConfig.business.pricing.taxRate > 100) {
    errors.push('Tax rate must be between 0 and 100');
  }

  // Validate URLs
  try {
    new URL(appConfig.app.baseUrl);
  } catch {
    errors.push('Invalid base URL configuration');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration value by path
 */
export function getConfigValue<T>(path: string): T | undefined {
  const keys = path.split('.');
  let current: any = appConfig;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current as T;
}

/**
 * Type-safe configuration access
 */
export type AppConfig = typeof appConfig;
export type ConfigPath = 
  | 'business.membership.threshold'
  | 'business.cart.maxItems'
  | 'business.order.numberPrefix'
  | 'business.pricing.currency'
  | 'security.rateLimiting.maxRequests'
  | 'ui.pagination.defaultPageSize'
  | string;

/**
 * Configuration for different environments
 */
export const getEnvironmentConfig = () => {
  const env = appConfig.app.environment;
  
  const baseConfig = {
    ...appConfig,
  };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        development: {
          ...baseConfig.development,
          logging: {
            ...baseConfig.development.logging,
            level: 'debug',
            enableConsole: true,
          },
          debug: {
            ...baseConfig.development.debug,
            enabled: true,
            showQueries: true,
          },
        },
      };

    case 'test':
      return {
        ...baseConfig,
        development: {
          ...baseConfig.development,
          testing: {
            ...baseConfig.development.testing,
            skipAuth: true,
            mockPayments: true,
          },
        },
      };

    case 'production':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          rateLimiting: {
            ...baseConfig.security.rateLimiting,
            enableInDevelopment: false,
          },
          session: {
            ...baseConfig.security.session,
            cookieSecure: true,
          },
        },
        development: {
          ...baseConfig.development,
          debug: {
            enabled: false,
            showQueries: false,
            showPerformance: false,
          },
        },
      };

    default:
      return baseConfig;
  }
};

// Export the environment-specific configuration
export default getEnvironmentConfig();