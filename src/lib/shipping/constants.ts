/**
 * Shipping System Constants
 *
 * Centralized constants for EasyParcel shipping integration.
 * These values are used across frontend and backend to ensure consistency.
 *
 * @module shipping/constants
 */

// ============================================================================
// SERVICE TYPES & DETAILS
// ============================================================================

/**
 * EasyParcel service types (type of shipment)
 */
export const SERVICE_TYPES = {
  PARCEL: 'parcel',
  DOCUMENT: 'document',
} as const;

export type ServiceType = (typeof SERVICE_TYPES)[keyof typeof SERVICE_TYPES];

/**
 * EasyParcel service details (pickup/dropoff method)
 */
export const SERVICE_DETAILS = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  PICKUP_OR_DROPOFF: 'dropoff or pickup',
} as const;

export type ServiceDetail = (typeof SERVICE_DETAILS)[keyof typeof SERVICE_DETAILS];

/**
 * Validate service detail value
 */
export function isValidServiceDetail(value: string): value is ServiceDetail {
  return Object.values(SERVICE_DETAILS).includes(value as ServiceDetail);
}

/**
 * Check if service supports dropoff
 */
export function supportsDropoff(serviceDetail: string): boolean {
  return serviceDetail === SERVICE_DETAILS.DROPOFF ||
         serviceDetail === SERVICE_DETAILS.PICKUP_OR_DROPOFF;
}

/**
 * Check if service supports pickup
 */
export function supportsPickup(serviceDetail: string): boolean {
  return serviceDetail === SERVICE_DETAILS.PICKUP ||
         serviceDetail === SERVICE_DETAILS.PICKUP_OR_DROPOFF;
}

// ============================================================================
// LOCATION & GEOGRAPHY
// ============================================================================

/**
 * Malaysian States
 *
 * CRITICAL: Use dropdown (not free text) in forms to prevent typos.
 * Maps state codes to full state names for display purposes.
 *
 * Source: EasyParcel API requirements
 */
export const MALAYSIAN_STATES = {
  jhr: 'Johor',
  kdh: 'Kedah',
  ktn: 'Kelantan',
  mlk: 'Melaka',
  nsn: 'Negeri Sembilan',
  phg: 'Pahang',
  prk: 'Perak',
  pls: 'Perlis',
  png: 'Penang',
  sgr: 'Selangor',
  trg: 'Terengganu',
  kul: 'Kuala Lumpur',
  pjy: 'Putrajaya',
  srw: 'Sarawak',
  sbh: 'Sabah',
  lbn: 'Labuan',
} as const;

/**
 * Type helper for Malaysian state codes
 */
export type MalaysianStateCode = keyof typeof MALAYSIAN_STATES;

/**
 * Country Configuration
 *
 * Default country for shipping operations.
 * v1: Malaysia only, following EasyParcel API requirements.
 *
 * IMPORTANT: Use ISO 3166-1 alpha-2 code ("MY"), not full name ("Malaysia")
 */
export const DEFAULT_COUNTRY = {
  CODE: 'MY', // ISO 3166-1 alpha-2 code for Malaysia
  NAME: 'Malaysia',
} as const;

export type CountryCode = typeof DEFAULT_COUNTRY.CODE;

/**
 * Courier Selection Strategies
 *
 * Determines how shipping options are presented to customers at checkout.
 *
 * - CHEAPEST: Auto-select lowest cost (recommended, simplest UX)
 * - SHOW_ALL: Customer chooses from all available couriers
 * - SELECTED: Admin limits to specific pre-approved couriers (customer chooses)
 * - PRIORITY: Show only highest priority courier available from ranked list
 */
export const COURIER_SELECTION_STRATEGIES = {
  CHEAPEST: 'cheapest',
  SHOW_ALL: 'all',
  SELECTED: 'selected',
  PRIORITY: 'priority',
} as const;

export type CourierSelectionStrategy =
  (typeof COURIER_SELECTION_STRATEGIES)[keyof typeof COURIER_SELECTION_STRATEGIES];

/**
 * Priority Courier Limits
 *
 * Configuration for priority courier strategy.
 */
export const PRIORITY_COURIER_CONFIG = {
  MAX_RANKED_COURIERS: 3, // Maximum number of couriers that can be ranked
  MIN_RANKED_COURIERS: 1, // Minimum (1st priority is required)
} as const;

/**
 * Free Shipping Configuration
 *
 * Default threshold for free shipping eligibility.
 * Admin can override in settings.
 */
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150; // RM

/**
 * Weight Limits
 *
 * Business rules for parcel weight validation.
 */
export const WEIGHT_LIMITS = {
  MIN: 0.01, // kg
  MAX: 1000, // kg
  DEFAULT: 0.5, // kg (for products without weight)
} as const;

/**
 * API Configuration
 *
 * EasyParcel API endpoints and defaults.
 */
export const EASYPARCEL_CONFIG = {
  SANDBOX_URL: 'https://demo.connect.easyparcel.my',
  PRODUCTION_URL: 'https://connect.easyparcel.my',
  DEFAULT_TIMEOUT: 30000, // 30 seconds - EasyParcel production API can be slow
  MAX_RETRIES: 3,
} as const;

/**
 * Shipping Status Display Names
 *
 * User-friendly status labels for order tracking.
 */
export const SHIPPING_STATUS_LABELS = {
  PENDING: 'Pending Payment',
  PAID: 'Paid - Ready for Fulfillment',
  READY_TO_SHIP: 'Ready to Ship',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
} as const;

/**
 * Tracking Update Frequency
 *
 * Configuration for automatic tracking updates via cron job.
 */
export const TRACKING_CONFIG = {
  UPDATE_INTERVAL_HOURS: 4,
  CRON_SCHEDULE: '0 */4 * * *', // Every 4 hours, on the hour
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
} as const;

/**
 * Validation Patterns
 *
 * Regular expressions for input validation (used in Zod schemas).
 */
export const VALIDATION_PATTERNS = {
  PHONE_MY: /^\+60[0-9]{8,10}$/, // Malaysian phone format
  POSTAL_CODE_MY: /^\d{5}$/, // 5-digit Malaysian postal code
  API_KEY: /^[A-Za-z0-9_\-+=/.]+$/, // Allows common API key characters (letters, numbers, dash, underscore, etc)
} as const;

/**
 * Error Codes
 *
 * Standardized error codes for shipping operations.
 * These are returned in API responses for client-side handling.
 */
export const SHIPPING_ERROR_CODES = {
  // Configuration Errors
  NOT_CONFIGURED: 'SHIPPING_NOT_CONFIGURED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_PICKUP_ADDRESS: 'INVALID_PICKUP_ADDRESS',

  // Calculation Errors
  NO_COURIERS_AVAILABLE: 'NO_COURIERS_AVAILABLE',
  INVALID_DESTINATION: 'INVALID_DESTINATION',
  WEIGHT_EXCEEDED: 'WEIGHT_EXCEEDED',

  // Fulfillment Errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  COURIER_UNAVAILABLE: 'COURIER_UNAVAILABLE',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  API_TIMEOUT: 'API_TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Tracking Errors
  TRACKING_NOT_FOUND: 'TRACKING_NOT_FOUND',
  TRACKING_UPDATE_FAILED: 'TRACKING_UPDATE_FAILED',

  // General Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ShippingErrorCode =
  (typeof SHIPPING_ERROR_CODES)[keyof typeof SHIPPING_ERROR_CODES];

/**
 * Credit Balance Warning Threshold
 *
 * Show low balance warning when EasyParcel account balance falls below this amount.
 */
export const LOW_BALANCE_THRESHOLD = 50; // RM

/**
 * Pickup Date Configuration
 *
 * Business rules for scheduling courier pickups.
 */
export const PICKUP_CONFIG = {
  MIN_ADVANCE_HOURS: 4, // Minimum 4 hours notice for same-day pickup
  MAX_ADVANCE_DAYS: 7, // Can schedule up to 7 days ahead
  EXCLUDED_DAYS: [0], // Sunday (0 = Sunday in JavaScript Date)
} as const;

/**
 * Malaysian Public Holidays 2025
 *
 * Used to calculate next business day for pickup scheduling.
 * TODO: Move to database for easier updates.
 */
export const MALAYSIAN_PUBLIC_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-29', // Chinese New Year
  '2025-01-30', // Chinese New Year
  '2025-03-31', // Hari Raya Puasa (estimated)
  '2025-05-01', // Labour Day
  '2025-05-12', // Wesak Day
  '2025-06-02', // Agong's Birthday
  '2025-06-07', // Hari Raya Haji (estimated)
  '2025-06-28', // Awal Muharram (estimated)
  '2025-08-31', // National Day
  '2025-09-16', // Malaysia Day
  '2025-09-27', // Prophet Muhammad's Birthday (estimated)
  '2025-10-24', // Deepavali (estimated)
  '2025-12-25', // Christmas
] as const;

/**
 * Fulfillment Widget States
 *
 * Visual states for the fulfillment UI component.
 */
export const FULFILLMENT_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial', // Shipment created but AWB download failed
} as const;

export type FulfillmentState =
  (typeof FULFILLMENT_STATES)[keyof typeof FULFILLMENT_STATES];
