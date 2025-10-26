/**
 * Shipping System Type Definitions
 *
 * Complete TypeScript interfaces for the EasyParcel shipping integration.
 * All types follow strict typing standards (no 'any' types allowed).
 *
 * @module shipping/types
 */

import type {
  CourierSelectionStrategy,
  MalaysianStateCode,
  ShippingErrorCode,
  FulfillmentState,
} from './constants';

// ============================================================================
// SHIPPING SETTINGS
// ============================================================================

/**
 * Shipping configuration stored in SystemConfig table
 *
 * NOTE: Pickup address (sender information) is sourced from BusinessProfile.shippingAddress
 * to maintain single source of truth. Use getPickupAddressFromBusinessProfile() to retrieve.
 */
export interface ShippingSettings {
  // API Configuration
  apiKey: string;
  environment: 'sandbox' | 'production';

  // Courier Selection Strategy
  courierSelectionMode: CourierSelectionStrategy;
  selectedCouriers?: string[]; // Array of courier IDs (only if mode === 'selected')

  // Priority Courier Configuration (only if mode === 'priority')
  priorityCouriers?: {
    first: string; // Required: 1st priority courier ID
    second?: string; // Optional: 2nd priority courier ID
    third?: string; // Optional: 3rd priority courier ID
  };

  // Free Shipping Configuration
  freeShippingEnabled: boolean;
  freeShippingThreshold?: number; // Minimum order amount in RM

  // Automation Settings
  autoUpdateOrderStatus: boolean; // Auto-update order status based on tracking

  // Notification Settings
  whatsappNotificationsEnabled: boolean; // Send WhatsApp tracking updates (+RM 0.20/order)

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Partial settings for updates (all fields optional except what's being changed)
 */
export type ShippingSettingsUpdate = Partial<
  Omit<ShippingSettings, 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// SHIPPING ADDRESS
// ============================================================================

/**
 * Delivery address for shipping calculation and fulfillment
 *
 * IMPORTANT: For nationwide rate checking (admin courier listing):
 * - city: '' (empty string)
 * - state: '' (empty string)
 * - postalCode: '' (empty string)
 * - country: 'MY'
 *
 * This matches WooCommerce plugin behavior for statewide/nationwide zones.
 */
export interface DeliveryAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: MalaysianStateCode | ''; // Allow empty string for nationwide
  postalCode: string;
  country: 'MY'; // v1: Malaysia only
}

// ============================================================================
// SHIPPING OPTIONS & RATES
// ============================================================================

/**
 * Dropoff point location details
 */
export interface DropoffPoint {
  point_id: string;
  point_name: string;
  point_addr1: string;
  point_addr2?: string;
  point_city: string;
  point_state: string;
  point_postcode: string;
  start_time: string; // Opening time (HH:mm format)
  end_time: string; // Closing time (HH:mm format)
  latitude?: number;
  longitude?: number;
  price_difference?: number; // Cost difference from pickup (negative = cheaper)
}

/**
 * Pickup point location details
 */
export interface PickupPoint {
  point_id: string;
  point_name: string;
  point_addr1: string;
  point_addr2?: string;
  point_city: string;
  point_state: string;
  point_postcode: string;
  operating_hours: string;
  contact_number?: string;
}

/**
 * Single shipping option returned from EasyParcel API
 */
export interface ShippingOption {
  serviceId: string; // EasyParcel service_id
  courierName: string; // e.g., "City-Link Express"
  serviceType: string; // 'parcel' or 'document' - type of service
  serviceDetail: string; // 'pickup', 'dropoff', or 'dropoff or pickup'
  cost: number; // Shipping cost in RM
  originalCost: number; // Original cost before free shipping discount
  freeShipping: boolean; // True if free shipping applied
  estimatedDays: string; // e.g., "2-3 working days"
  savedAmount?: number; // Amount saved if free shipping (originalCost - cost)
  dropoffPoints?: DropoffPoint[]; // Available dropoff locations (if serviceDetail includes 'dropoff')
  pickupPoints?: PickupPoint[]; // Available pickup locations
}

/**
 * Response from shipping calculation API
 */
export interface ShippingCalculationResult {
  success: boolean;
  shipping?: {
    options: ShippingOption[];
    strategy: CourierSelectionStrategy;
    freeShippingApplied: boolean;
    cartSubtotal: number;
    totalWeight: number; // Total calculated weight in kg
  };
  error?: ShippingErrorCode;
  message?: string;
}

// ============================================================================
// ORDER FULFILLMENT
// ============================================================================

/**
 * Courier option for fulfillment (with admin override capability)
 */
export interface CourierOption {
  serviceId: string;
  courierName: string;
  cost: number;
  estimatedDays: string;
  isCustomerSelected: boolean; // Flag to highlight customer's choice
}

/**
 * Request payload for order fulfillment
 */
export interface FulfillmentRequest {
  orderId: string;
  serviceId: string; // Can differ from customer's selection (admin override)
  pickupDate: string; // ISO date string (YYYY-MM-DD)
  overriddenByAdmin: boolean; // Track if admin changed courier
}

/**
 * Fulfillment success response
 */
export interface FulfillmentSuccessResponse {
  success: true;
  tracking: {
    trackingNumber: string;
    awbNumber: string;
    labelUrl: string; // Path to downloaded AWB label PDF
    trackingUrl: string; // EasyParcel tracking page URL
  };
  pickup: {
    scheduledDate: string; // ISO date string
    status: 'scheduled';
  };
}

/**
 * Fulfillment error response
 */
export interface FulfillmentErrorResponse {
  success: false;
  error: {
    code: ShippingErrorCode;
    message: string; // User-friendly error message
    details?: Record<string, unknown>; // Additional error context
    retryable: boolean; // Can the operation be retried?
    suggestedActions: FulfillmentAction[];
  };
}

/**
 * Combined fulfillment response type
 */
export type FulfillmentResponse =
  | FulfillmentSuccessResponse
  | FulfillmentErrorResponse;

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Single tracking event from EasyParcel API
 */
export interface TrackingEvent {
  eventCode: string;
  eventName: string;
  description: string;
  location?: string;
  eventTime: Date;
  timezone: string;
}

/**
 * Complete tracking information for an order
 */
export interface TrackingInfo {
  trackingNumber: string;
  courierName: string;
  currentStatus: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: TrackingEvent[];
  lastUpdated: Date;
}

/**
 * Tracking update response from API
 */
export interface TrackingUpdateResponse {
  success: boolean;
  tracking?: TrackingInfo;
  error?: ShippingErrorCode;
  message?: string;
}

// ============================================================================
// EASYPARCEL API TYPES
// ============================================================================

/**
 * EasyParcel API rate calculation response (single service)
 */
export interface EasyParcelRateService {
  service_id: string;
  service_name: string;
  courier_name: string;
  courier_logo: string;
  service_type: string; // 'parcel' or 'document' - type of service
  service_detail: string; // 'pickup', 'dropoff', or 'dropoff or pickup'
  price: number;
  estimated_delivery_days: string;
  dropoff_point?: DropoffPoint[]; // Available dropoff locations
  pickup_point?: PickupPoint[]; // Available pickup locations
}

/**
 * EasyParcel API shipment creation request
 */
export interface EasyParcelShipmentRequest {
  service_id: string;
  pickup: {
    name: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    pickup_date: string; // YYYY-MM-DD
  };
  delivery: {
    name: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  parcel: {
    weight: number;
    width?: number;
    height?: number;
    length?: number;
    content: string;
    value: number;
  };
  reference?: string; // Order number
  addon_whatsapp_tracking_enabled?: number; // 1 = enabled, 0 = disabled (WhatsApp notifications)
}

/**
 * EasyParcel API shipment creation response
 *
 * ⚠️ IMPORTANT: EasyParcel returns 'courier' field (not 'courier_name') in EPSubmitOrderBulk
 */
export interface EasyParcelShipmentResponse {
  success: boolean;
  data?: {
    shipment_id: string;
    tracking_number: string;
    awb_number: string;
    label_url: string;
    tracking_url: string;
    price?: number | null;
    courier?: string; // ✅ Actual courier returned by EPSubmitOrderBulk (e.g., "Pickupp")
    courier_name?: string; // Legacy field (may not be present)
    service_name?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * EasyParcel API order payment request
 */
export interface EasyParcelPaymentRequest {
  order_number: string; // Order number from EPSubmitOrderBulk response
}

/**
 * Single parcel details from payment response
 */
export interface EasyParcelParcelDetails {
  parcelno: string; // Parcel number (e.g., "EP-PQKTE")
  awb: string; // Airway bill number (e.g., "238770015234")
  awb_id_link: string; // AWB PDF download link
  tracking_url: string; // Tracking page URL
}

/**
 * EasyParcel API order payment response
 */
export interface EasyParcelPaymentResponse {
  success: boolean;
  data?: {
    order_number: string; // Order number that was paid
    payment_status: string; // "Fully Paid" or error message
    parcels: EasyParcelParcelDetails[]; // Array of parcels in this order
    total_amount?: number; // Total amount charged
    balance_remaining?: number; // Remaining EasyParcel credit balance
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * EasyParcel API tracking response
 */
export interface EasyParcelTrackingResponse {
  success: boolean;
  data?: {
    tracking_number: string;
    courier_name: string;
    current_status: string;
    estimated_delivery?: string; // ISO date string
    actual_delivery?: string; // ISO date string
    events: Array<{
      event_code: string;
      event_name: string;
      description: string;
      location?: string;
      event_time: string; // ISO datetime string
      timezone: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * EasyParcel API account balance response
 */
export interface EasyParcelBalanceResponse {
  success: boolean;
  data?: {
    balance: number; // in RM
    currency: 'MYR';
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// WEIGHT CALCULATION
// ============================================================================

/**
 * Cart item for weight calculation
 */
export interface CartItemWithWeight {
  product: {
    weight: number | string; // Product weight (may come as string from DB)
  };
  quantity: number;
}

// ============================================================================
// VALIDATION SCHEMAS (Zod Schema Types)
// ============================================================================

/**
 * Shipping calculation request validation
 */
export interface ShippingCalculateRequest {
  deliveryAddress: DeliveryAddress;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  orderValue: number; // Cart subtotal for free shipping calculation
}

/**
 * Shipping settings validation
 *
 * NOTE: Pickup address fields removed - sourced from BusinessProfile instead
 */
export interface ShippingSettingsRequest {
  apiKey: string;
  environment: 'sandbox' | 'production';
  courierSelectionMode: CourierSelectionStrategy;
  selectedCouriers?: string[];
  priorityCouriers?: {
    first: string;
    second?: string;
    third?: string;
  };
  freeShippingEnabled: boolean;
  freeShippingThreshold?: number;
  autoUpdateOrderStatus: boolean;
  whatsappNotificationsEnabled: boolean;
}

// ============================================================================
// EMAIL NOTIFICATION TYPES
// ============================================================================

/**
 * Order confirmation email data
 */
export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: DeliveryAddress;
}

/**
 * Tracking notification email data
 */
export interface TrackingNotificationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  trackingUrl: string;
  courierName: string;
  estimatedDelivery: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API response wrapper (success case)
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * API response wrapper (error case)
 */
export interface ApiError {
  success: false;
  error: ShippingErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Combined API response type
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Type guard to check if response is error
 */
export function isApiError(
  response: ApiResponse<unknown>
): response is ApiError {
  return !response.success;
}

/**
 * Type guard to check if response is success
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccess<T> {
  return response.success;
}
