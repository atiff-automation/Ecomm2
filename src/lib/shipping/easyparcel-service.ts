/**
 * EasyParcel API Service
 *
 * Core integration layer for EasyParcel shipping API.
 * Handles rate calculation, shipment booking, tracking, and account balance.
 *
 * @module shipping/easyparcel-service
 */

import { EASYPARCEL_CONFIG, SHIPPING_ERROR_CODES } from './constants';
import type {
  DeliveryAddress,
  EasyParcelRateService,
  EasyParcelShipmentRequest,
  EasyParcelShipmentResponse,
  EasyParcelTrackingResponse,
  EasyParcelBalanceResponse,
  ShippingSettings,
} from './types';

/**
 * EasyParcel API Client
 *
 * Singleton service for interacting with EasyParcel API.
 * All methods include comprehensive error handling and logging.
 */
export class EasyParcelService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey;
    this.baseUrl =
      environment === 'production'
        ? EASYPARCEL_CONFIG.PRODUCTION_URL
        : EASYPARCEL_CONFIG.SANDBOX_URL;
    this.timeout = EASYPARCEL_CONFIG.DEFAULT_TIMEOUT;
  }

  /**
   * Fetch shipping rates for given addresses and parcel weight
   *
   * @param pickup - Pickup address (from shipping settings)
   * @param delivery - Customer delivery address
   * @param weight - Total parcel weight in kg
   * @returns Array of available shipping services with pricing
   * @throws EasyParcelError if API call fails
   */
  async getRates(
    pickup: Partial<ShippingSettings>,
    delivery: DeliveryAddress,
    weight: number
  ): Promise<EasyParcelRateService[]> {
    try {
      console.log('[EasyParcel] Fetching rates:', {
        pickupState: pickup.state,
        pickupPostcode: pickup.postalCode,
        deliveryState: delivery.state,
        deliveryPostcode: delivery.postalCode,
        weight,
      });

      // Build bulk array parameter for EPRateCheckingBulk
      const bulkParams: Record<string, unknown> = {
        'bulk[0][pick_code]': pickup.postalCode || '',
        'bulk[0][pick_state]': pickup.state || '',
        'bulk[0][pick_country]': pickup.country || 'MY',
        'bulk[0][send_code]': delivery.postalCode || '',
        'bulk[0][send_state]': delivery.state || '',
        'bulk[0][send_country]': delivery.country || 'MY',
        'bulk[0][weight]': weight,
      };

      const response = await this.makeRequest<{
        api_status: string;
        error_code: string;
        error_remark: string;
        result: Array<{
          status: string;
          remarks: string;
          rates: Array<{
            service_id: string;
            service_name: string;
            courier_name: string;
            courier_logo: string;
            service_type: string;
            service_detail: string;
            price: string;
            delivery: string;
            dropoff_point?: Array<{
              point_id: string;
              point_name: string;
              point_contact: string;
              point_addr1: string;
              point_addr2?: string;
              point_city: string;
              point_state: string;
              point_postcode: string;
              start_time: string;
              end_time: string;
              price: number;
            }>;
            pickup_point?: Array<unknown>;
          }>;
        }>;
      }>('EPRateCheckingBulk', bulkParams);

      // Check for API errors
      if (response.api_status !== 'Success' || response.error_code !== '0') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          response.error_remark || 'Failed to fetch shipping rates',
          { response }
        );
      }

      // Extract rates from bulk response
      const bulkResult = response.result?.[0];
      if (!bulkResult || bulkResult.status !== 'Success' || !bulkResult.rates) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.NO_COURIERS_AVAILABLE,
          bulkResult?.remarks || 'No couriers available for this destination',
          { delivery, weight }
        );
      }

      // Map EasyParcel response to our format
      const services: EasyParcelRateService[] = bulkResult.rates.map((rate) => ({
        service_id: rate.service_id,
        service_name: rate.service_name,
        courier_name: rate.courier_name,
        courier_logo: rate.courier_logo,
        service_type: rate.service_type,
        service_detail: rate.service_detail,
        price: parseFloat(rate.price),
        estimated_delivery_days: rate.delivery,
        dropoff_point: rate.dropoff_point || [],
        pickup_point: rate.pickup_point || [],
      }));

      console.log('[EasyParcel] Rates fetched successfully:', {
        count: services.length,
        cheapest: services[0]?.price,
        services: services.map(s => `${s.courier_name} (${s.service_detail})`),
      });

      return services;
    } catch (error) {
      if (error instanceof EasyParcelError) {
        throw error;
      }

      console.error('[EasyParcel] Rate fetch failed:', error);
      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        'Failed to fetch shipping rates',
        { originalError: error }
      );
    }
  }

  /**
   * Create shipment booking with EasyParcel
   *
   * @param request - Shipment creation request payload
   * @returns Shipment details including tracking number and AWB
   * @throws EasyParcelError if booking fails
   */
  async createShipment(
    request: EasyParcelShipmentRequest
  ): Promise<EasyParcelShipmentResponse> {
    try {
      console.log('[EasyParcel] Creating shipment:', {
        serviceId: request.service_id,
        pickupDate: request.pickup.pickup_date,
        reference: request.reference,
        whatsappTracking: request.addon_whatsapp_tracking_enabled,
      });

      const response = await this.makeRequest<EasyParcelShipmentResponse['data']>(
        '/shipments',
        'POST',
        request
      );

      if (!response.shipment_id || !response.tracking_number) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Invalid response from EasyParcel API',
          { response }
        );
      }

      console.log('[EasyParcel] Shipment created successfully:', {
        shipmentId: response.shipment_id,
        trackingNumber: response.tracking_number,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (error instanceof EasyParcelError) {
        throw error;
      }

      console.error('[EasyParcel] Shipment creation failed:', error);

      // Handle common error scenarios
      if (this.isInsufficientBalanceError(error)) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE,
          'Insufficient EasyParcel credit balance',
          { originalError: error }
        );
      }

      if (this.isInvalidAddressError(error)) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.INVALID_ADDRESS,
          'Invalid shipping address provided',
          { originalError: error }
        );
      }

      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        'Failed to create shipment',
        { originalError: error }
      );
    }
  }

  /**
   * Fetch tracking information for a shipment
   *
   * @param trackingNumber - EasyParcel tracking number
   * @returns Tracking events and current status
   * @throws EasyParcelError if tracking fetch fails
   */
  async getTracking(trackingNumber: string): Promise<EasyParcelTrackingResponse> {
    try {
      console.log('[EasyParcel] Fetching tracking:', trackingNumber);

      const response = await this.makeRequest<EasyParcelTrackingResponse['data']>(
        `/tracking/${trackingNumber}`,
        'GET'
      );

      if (!response.tracking_number) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND,
          'Tracking information not found',
          { trackingNumber }
        );
      }

      console.log('[EasyParcel] Tracking fetched successfully:', {
        trackingNumber,
        eventsCount: response.events?.length || 0,
        currentStatus: response.current_status,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (error instanceof EasyParcelError) {
        throw error;
      }

      console.error('[EasyParcel] Tracking fetch failed:', error);
      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.TRACKING_UPDATE_FAILED,
        'Failed to fetch tracking information',
        { trackingNumber, originalError: error }
      );
    }
  }

  /**
   * Get EasyParcel account balance
   *
   * @returns Current balance in MYR
   * @throws EasyParcelError if balance fetch fails
   */
  async getBalance(): Promise<EasyParcelBalanceResponse> {
    try {
      console.log('[EasyParcel] Fetching account balance');

      const response = await this.makeRequest<{
        result: string;
        api_status: string;
        error_code: string;
        error_remark: string;
      }>('EPCheckCreditBalance', {});

      // Check for API errors
      if (response.api_status !== 'Success' || response.error_code !== '0') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          response.error_remark || 'Failed to fetch account balance',
          { response }
        );
      }

      const balance = parseFloat(response.result);
      if (isNaN(balance)) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Invalid balance response from EasyParcel API',
          { response }
        );
      }

      console.log('[EasyParcel] Balance fetched successfully:', {
        balance,
        currency: 'MYR',
      });

      return {
        success: true,
        data: {
          balance,
          currency: 'MYR',
        },
      };
    } catch (error) {
      if (error instanceof EasyParcelError) {
        throw error;
      }

      console.error('[EasyParcel] Balance fetch failed:', error);
      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        'Failed to fetch account balance',
        { originalError: error }
      );
    }
  }

  /**
   * Test API connection
   *
   * @returns True if connection successful
   * @throws EasyParcelError if connection fails
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[EasyParcel] Testing API connection');

      // Use balance endpoint as health check
      await this.getBalance();

      console.log('[EasyParcel] Connection test successful');
      return true;
    } catch (error) {
      console.error('[EasyParcel] Connection test failed:', error);

      if (this.isAuthenticationError(error)) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.INVALID_API_KEY,
          'Invalid API key or authentication failed',
          { originalError: error }
        );
      }

      throw error;
    }
  }

  /**
   * Make HTTP request to EasyParcel API
   *
   * EasyParcel API format (from WordPress plugin):
   * - URL: base_url + "?ac=ActionName"
   * - Method: POST
   * - Content-Type: application/x-www-form-urlencoded
   * - Body: api=xxx&param1=value1&param2=value2
   *
   * @param action - EasyParcel API action (e.g., "EPCheckCreditBalance")
   * @param params - Additional parameters for the action
   * @returns Response data
   * @throws EasyParcelError if request fails
   * @private
   */
  private async makeRequest<T>(action: string, params: Record<string, unknown>): Promise<T> {
    // Build URL with action query parameter
    const url = `${this.baseUrl}?ac=${action}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Build form data with api key and params
      const formData = new URLSearchParams();
      formData.append('api', this.apiKey);

      // Add additional parameters
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }

      console.log('[EasyParcel] Making request:', {
        url,
        action,
        apiKeyPreview: `${this.apiKey.substring(0, 5)}...`,
        params: Object.keys(params),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new EasyParcelError(
          this.mapHttpStatusToErrorCode(response.status),
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, errorData }
        );
      }

      const data = await response.json();

      console.log('[EasyParcel] Response received:', {
        action,
        api_status: data.api_status,
        error_code: data.error_code,
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof EasyParcelError) {
        throw error;
      }

      // Handle timeout
      if ((error as Error).name === 'AbortError') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.API_TIMEOUT,
          'Request to EasyParcel API timed out',
          { timeout: this.timeout }
        );
      }

      // Handle network error
      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.NETWORK_ERROR,
        'Network error while connecting to EasyParcel API',
        { originalError: error }
      );
    }
  }

  /**
   * Map HTTP status code to shipping error code
   * @private
   */
  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case 401:
      case 403:
        return SHIPPING_ERROR_CODES.INVALID_API_KEY;
      case 400:
        return SHIPPING_ERROR_CODES.INVALID_ADDRESS;
      case 402:
        return SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE;
      case 404:
        return SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND;
      case 408:
        return SHIPPING_ERROR_CODES.API_TIMEOUT;
      case 503:
        return SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return SHIPPING_ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  /**
   * Check if error is insufficient balance error
   * @private
   */
  private isInsufficientBalanceError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('insufficient') ||
      errorMessage.includes('balance') ||
      errorMessage.includes('credit')
    );
  }

  /**
   * Check if error is invalid address error
   * @private
   */
  private isInvalidAddressError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('invalid address') ||
      errorMessage.includes('address not found') ||
      errorMessage.includes('postcode')
    );
  }

  /**
   * Check if error is authentication error
   * @private
   */
  private isAuthenticationError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('invalid api key')
    );
  }
}

/**
 * Custom Error class for EasyParcel API errors
 *
 * Provides structured error information with error codes and context.
 */
export class EasyParcelError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EasyParcelError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EasyParcelError);
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Factory function to create EasyParcel service instance
 *
 * @param settings - Shipping settings from database
 * @returns Configured EasyParcel service instance
 */
export function createEasyParcelService(settings: ShippingSettings): EasyParcelService {
  return new EasyParcelService(settings.apiKey, settings.environment);
}
