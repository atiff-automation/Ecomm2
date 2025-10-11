/**
 * toyyibPay Centralized Configuration
 * Single source of truth for all toyyibPay-related configurations
 * Following the same pattern as EasyParcel config to maintain consistency
 */

import { getAppUrl } from './app-url';

// Environment-based URL configuration
export const toyyibPayConfig = {
  urls: {
    sandbox: process.env.TOYYIBPAY_SANDBOX_URL || 'https://dev.toyyibpay.com',
    production: process.env.TOYYIBPAY_PRODUCTION_URL || 'https://toyyibpay.com',
  },

  timeouts: {
    default: parseInt(process.env.TOYYIBPAY_TIMEOUT || '30000', 10), // 30 seconds
    validation: parseInt(
      process.env.TOYYIBPAY_VALIDATION_TIMEOUT || '15000',
      10
    ), // 15 seconds
    callback: parseInt(process.env.TOYYIBPAY_CALLBACK_TIMEOUT || '30000', 10), // 30 seconds
  },

  // Note: Webhook URLs are now generated dynamically via getWebhookUrls()
  // to ensure they always use the correct base URL from NEXT_PUBLIC_APP_URL

  billSettings: {
    // Bill name constraints (toyyibPay limit: 30 characters, alphanumeric + space + underscore only)
    maxBillNameLength: 30,
    billNamePrefix: 'JRM_',

    // Bill description constraints (toyyibPay limit: 100 characters, alphanumeric + space + underscore only)
    maxBillDescriptionLength: 100,

    // Default bill settings
    defaultPriceSetting: 1, // 1 = fixed price
    defaultPayorInfo: 1, // 1 = require payer info
    defaultPaymentChannel: '2' as const, // '2' = Both FPX and Credit Card
  },

  paymentChannels: {
    FPX_ONLY: '0',
    CREDIT_CARD_ONLY: '1',
    BOTH: '2',
  } as const,

  // Response status codes from toyyibPay API
  statusCodes: {
    SUCCESS: '1',
    PENDING: '2',
    FAILED: '3',
  } as const,

  // Default category settings
  defaultCategory: {
    namePrefix: 'JRM_Ecommerce',
    description: 'JRM E-commerce payment category',
  },
};

/**
 * Get the appropriate toyyibPay URL based on environment
 */
export function getToyyibPayUrl(isSandbox: boolean): string {
  return isSandbox
    ? toyyibPayConfig.urls.sandbox
    : toyyibPayConfig.urls.production;
}

/**
 * Get timeout configuration based on operation type
 */
export function getToyyibPayTimeout(
  operation: 'default' | 'validation' | 'callback' = 'default'
): number {
  return toyyibPayConfig.timeouts[operation];
}

/**
 * Sanitize bill name for toyyibPay requirements
 * toyyibPay allows only alphanumeric characters, spaces, and underscores
 * Maximum length: 30 characters
 */
export function sanitizeBillName(name: string): string {
  // Remove special characters, keep only alphanumeric, spaces, and underscores
  let sanitized = name.replace(/[^a-zA-Z0-9\s_]/g, '_');

  // Limit to maximum length
  if (sanitized.length > toyyibPayConfig.billSettings.maxBillNameLength) {
    sanitized = sanitized.substring(
      0,
      toyyibPayConfig.billSettings.maxBillNameLength
    );
  }

  // Ensure it starts with prefix for identification
  if (!sanitized.startsWith(toyyibPayConfig.billSettings.billNamePrefix)) {
    const prefix = toyyibPayConfig.billSettings.billNamePrefix;
    const maxContentLength =
      toyyibPayConfig.billSettings.maxBillNameLength - prefix.length;
    sanitized = prefix + sanitized.substring(0, maxContentLength);
  }

  return sanitized;
}

/**
 * Sanitize bill description for toyyibPay requirements
 * toyyibPay allows only alphanumeric characters, spaces, and underscores
 * Maximum length: 100 characters
 */
export function sanitizeBillDescription(description: string): string {
  // Remove special characters, keep only alphanumeric, spaces, and underscores
  let sanitized = description.replace(/[^a-zA-Z0-9\s_]/g, '_');

  // Limit to maximum length
  if (
    sanitized.length > toyyibPayConfig.billSettings.maxBillDescriptionLength
  ) {
    sanitized = sanitized.substring(
      0,
      toyyibPayConfig.billSettings.maxBillDescriptionLength
    );
  }

  return sanitized;
}

/**
 * Convert Ringgit to cents (toyyibPay expects amount in cents)
 */
export function convertRinggitToCents(ringgit: number): number {
  return Math.round(ringgit * 100);
}

/**
 * Convert cents to Ringgit for display
 */
export function convertCentsToRinggit(cents: number): number {
  return cents / 100;
}

/**
 * Format amount for display in Malaysian Ringgit
 */
export function formatMalaysianCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Generate external reference number for orders
 */
export function generateExternalReference(orderNumber: string): string {
  // toyyibPay external reference should be unique and identifiable
  return `JRM_${orderNumber}_${Date.now()}`;
}

/**
 * Validate toyyibPay bill code format
 */
export function isValidBillCode(billCode: string): boolean {
  // toyyibPay bill codes are typically alphanumeric
  return /^[a-zA-Z0-9]+$/.test(billCode) && billCode.length > 0;
}

/**
 * Get webhook URLs for different environments
 *
 * ToyyibPay will redirect users to returnUrl with these query parameters:
 * - status_id: 1 (success), 2 (pending), 3 (fail)
 * - billcode: The bill's permanent link
 * - order_id: External payment reference number (order number)
 */
export function getWebhookUrls(environment: 'sandbox' | 'production') {
  // Use centralized app URL helper with localhost fallback for development
  // Consistent with EasyParcel and other config files
  const baseUrl = getAppUrl(true);

  const webhookUrls = {
    returnUrl: `${baseUrl}/thank-you`,
    callbackUrl: `${baseUrl}/api/webhooks/toyyibpay`,
    failedUrl: `${baseUrl}/thank-you`, // Same page handles all cases based on status_id
  };

  // Debug logging to track URL generation
  console.log('🔍 ToyyibPay Webhook URLs generated:', {
    environment,
    baseUrl,
    returnUrl: webhookUrls.returnUrl,
    callbackUrl: webhookUrls.callbackUrl,
  });

  return webhookUrls;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(isSandbox: boolean) {
  return {
    baseUrl: getToyyibPayUrl(isSandbox),
    timeout: getToyyibPayTimeout('default'),
    environment: isSandbox ? 'sandbox' : 'production',
    webhooks: getWebhookUrls(isSandbox ? 'sandbox' : 'production'),
  };
}

export default toyyibPayConfig;
