/**
 * EasyParcel API Configuration
 * Centralized configuration for all EasyParcel API settings
 */

export const easyParcelConfig = {
  /**
   * API Endpoints
   */
  urls: {
    sandbox: process.env.EASYPARCEL_SANDBOX_URL || 'http://demo.connect.easyparcel.my',
    production: process.env.EASYPARCEL_PRODUCTION_URL || 'https://connect.easyparcel.my'
  },

  /**
   * Timeout Configuration (milliseconds)
   */
  timeouts: {
    sandbox: parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '8000'),
    production: parseInt(process.env.EASYPARCEL_PRODUCTION_TIMEOUT || '15000'),
    validation: parseInt(process.env.EASYPARCEL_VALIDATION_TIMEOUT || '10000')
  },

  /**
   * Cache Configuration (milliseconds)
   */
  cache: {
    credentialDuration: parseInt(process.env.EASYPARCEL_CREDENTIAL_CACHE_DURATION || '300000'), // 5 minutes
    balanceDuration: parseInt(process.env.EASYPARCEL_BALANCE_CACHE_DURATION || '600000'), // 10 minutes
    rateDuration: parseInt(process.env.EASYPARCEL_RATE_CACHE_DURATION || '3600000') // 1 hour
  },

  /**
   * API Endpoints
   */
  endpoints: {
    checkBalance: '/?ac=EPCheckCreditBalance',
    rateChecking: '/?ac=EPRateCheckingBulk',
    submitOrder: '/?ac=EPSubmitOrderV2',
    trackOrder: '/?ac=EPTrackShipment',
    pickupRequest: '/?ac=EPPickupRequest',
    cancelOrder: '/?ac=EPCancelOrder'
  },

  /**
   * Business Logic Configuration
   */
  business: {
    balanceThresholds: {
      low: parseFloat(process.env.BALANCE_LOW_THRESHOLD || '100'),
      critical: parseFloat(process.env.BALANCE_CRITICAL_THRESHOLD || '20')
    },
    mockBalance: parseFloat(process.env.MOCK_CREDIT_BALANCE || '1000.00'),
    maxRetries: parseInt(process.env.EASYPARCEL_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.EASYPARCEL_RETRY_DELAY || '1000')
  },

  /**
   * Request Headers
   */
  headers: {
    contentType: 'application/x-www-form-urlencoded',
    accept: 'application/json'
  }
} as const;

/**
 * Get URL for current environment
 */
export function getEasyParcelUrl(isSandbox: boolean): string {
  return isSandbox ? easyParcelConfig.urls.sandbox : easyParcelConfig.urls.production;
}

/**
 * Get timeout for current environment
 */
export function getEasyParcelTimeout(isSandbox: boolean): number {
  return isSandbox ? easyParcelConfig.timeouts.sandbox : easyParcelConfig.timeouts.production;
}

/**
 * Get environment label
 */
export function getEnvironmentLabel(isSandbox: boolean): string {
  return isSandbox ? 'sandbox' : 'production';
}