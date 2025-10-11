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
  EasyParcelPaymentRequest,
  EasyParcelPaymentResponse,
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
   * Format phone number for EasyParcel API
   * EasyParcel expects Malaysian phone numbers without the '+' prefix
   * @param phone - Phone number in various formats
   * @returns Formatted phone number
   * @private
   */
  private formatPhoneNumber(phone: string | null | undefined): string {
    // Handle null/undefined phone numbers
    if (!phone) {
      return '';
    }

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with '60' (Malaysia country code), keep it
    // If starts with '0', keep it (local format)
    // Otherwise, assume it's missing the country code and prepend '60'
    if (cleaned.startsWith('60')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return cleaned;
    } else {
      return '60' + cleaned;
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

      // Format phone numbers for EasyParcel API
      const pickupPhone = this.formatPhoneNumber(request.pickup.phone);
      const deliveryPhone = this.formatPhoneNumber(request.delivery.phone);

      console.log('[EasyParcel] Formatted phone numbers:', {
        pickup: { original: request.pickup.phone, formatted: pickupPhone },
        delivery: { original: request.delivery.phone, formatted: deliveryPhone },
      });

      // Build bulk array parameter for EPSubmitOrderBulk
      const bulkParams: Record<string, unknown> = {
        'bulk[0][service_id]': request.service_id,
        'bulk[0][weight]': request.parcel.weight,
        'bulk[0][content]': request.parcel.content || 'General Merchandise',
        'bulk[0][value]': request.parcel.value || request.parcel.weight * 100,

        // Pickup details
        'bulk[0][pick_name]': request.pickup.name,
        'bulk[0][pick_contact]': pickupPhone,
        'bulk[0][pick_addr1]': request.pickup.address,
        'bulk[0][pick_addr2]': request.pickup.address2 || '',
        'bulk[0][pick_city]': request.pickup.city,
        'bulk[0][pick_state]': request.pickup.state,
        'bulk[0][pick_code]': request.pickup.postcode,
        'bulk[0][pick_country]': request.pickup.country,

        // Delivery details
        'bulk[0][send_name]': request.delivery.name,
        'bulk[0][send_contact]': deliveryPhone,
        'bulk[0][send_addr1]': request.delivery.address,
        'bulk[0][send_addr2]': request.delivery.address2 || '',
        'bulk[0][send_city]': request.delivery.city,
        'bulk[0][send_state]': request.delivery.state,
        'bulk[0][send_code]': request.delivery.postcode,
        'bulk[0][send_country]': request.delivery.country,

        // Pickup date
        'bulk[0][collect_date]': request.pickup.pickup_date,
      };

      // Add optional parcel dimensions if provided
      if (request.parcel.width) {
        bulkParams['bulk[0][width]'] = request.parcel.width;
      }
      if (request.parcel.height) {
        bulkParams['bulk[0][height]'] = request.parcel.height;
      }
      if (request.parcel.length) {
        bulkParams['bulk[0][length]'] = request.parcel.length;
      }

      // Add reference (order number)
      if (request.reference) {
        bulkParams['bulk[0][reference]'] = request.reference;
      }

      // Add WhatsApp tracking if enabled
      if (request.addon_whatsapp_tracking_enabled) {
        bulkParams['bulk[0][addon_whatsapp_tracking_enabled]'] = request.addon_whatsapp_tracking_enabled;
      }

      const response = await this.makeRequest<{
        api_status: string;
        error_code: string;
        error_remark: string;
        result: Array<{
          status: string;
          remarks: string;
          order_number?: string; // EasyParcel uses order_number (not order_id)
          parcel_number?: string; // EasyParcel uses parcel_number (not tracking_no)
          courier?: string;
          collect_date?: string;
          price?: string;
          addon_price?: string;
          shipment_price?: string;
          shipment_tax?: string;
          label_url?: string;
          tracking_url?: string;
        }>;
      }>('EPSubmitOrderBulk', bulkParams);

      // Check for API errors
      if (response.api_status !== 'Success' || response.error_code !== '0') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          response.error_remark || 'Failed to create shipment',
          { response }
        );
      }

      // DEBUG: Log complete response FIRST before any processing
      console.log('[EasyParcel] ===== RAW API RESPONSE =====');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('[EasyParcel] ===== END RAW RESPONSE =====');

      // Write to file for detailed inspection
      const fs = require('fs');
      try {
        fs.writeFileSync('/tmp/easyparcel-response.json', JSON.stringify(response, null, 2));
        console.log('[EasyParcel] Response written to /tmp/easyparcel-response.json');
      } catch (e) {
        console.log('[EasyParcel] Could not write response file:', e);
      }

      // Extract shipment details from bulk response
      const bulkResult = response.result?.[0];

      // DEBUG: Log bulkResult details
      console.log('[EasyParcel] ===== BULK RESULT DETAILS =====');
      console.log('bulkResult exists?:', !!bulkResult);
      console.log('bulkResult.status:', bulkResult?.status);
      console.log('bulkResult keys:', Object.keys(bulkResult || {}));
      console.log('bulkResult.order_number:', bulkResult?.order_number);
      console.log('bulkResult.parcel_number:', bulkResult?.parcel_number);
      console.log('[EasyParcel] ===== END BULK RESULT =====');

      if (!bulkResult || bulkResult.status !== 'Success') {
        console.log('[EasyParcel] ❌ Bulk result failed status check');
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          bulkResult?.remarks || 'Failed to create shipment',
          { response }
        );
      }

      // EasyParcel API returns order_number and parcel_number (not order_id and tracking_no)
      // Access fields directly without type checking since TypeScript types might not match exactly
      const orderNumber = (bulkResult as any).order_number;
      const parcelNumber = (bulkResult as any).parcel_number;

      console.log('[EasyParcel] 🔍 Extracted values:', {
        orderNumber,
        parcelNumber,
        hasOrderNumber: !!orderNumber,
        hasParcelNumber: !!parcelNumber,
        typeOfOrderNumber: typeof orderNumber,
        typeOfParcelNumber: typeof parcelNumber,
      });

      if (!orderNumber || !parcelNumber) {
        console.error('[EasyParcel] ❌ Missing shipment details:', {
          orderNumber,
          parcelNumber,
          bulkResultKeys: Object.keys(bulkResult || {}),
          bulkResult: JSON.stringify(bulkResult, null, 2),
        });

        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Invalid response from EasyParcel API - missing shipment details',
          { response, orderNumber, parcelNumber }
        );
      }

      console.log('[EasyParcel] ✅ Shipment created successfully:', {
        orderNumber,
        parcelNumber,
        courier: (bulkResult as any).courier,
      });

      return {
        success: true,
        data: {
          shipment_id: orderNumber,
          tracking_number: parcelNumber,
          awb_number: parcelNumber, // Use parcel_number as AWB
          label_url: (bulkResult as any).label_url || '',
          tracking_url: (bulkResult as any).tracking_url || '',
        },
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
   * Pay for an order with EasyParcel
   *
   * This method processes payment for a previously created order.
   * It deducts from your EasyParcel credit balance and generates:
   * - AWB (Airway Bill) number
   * - AWB PDF label link
   * - Tracking URL
   *
   * @param orderNumber - EasyParcel order number from createShipment response
   * @returns Payment details including AWB and tracking information
   * @throws EasyParcelError if payment fails
   */
  async payOrder(orderNumber: string): Promise<EasyParcelPaymentResponse> {
    try {
      console.log('[EasyParcel] Processing payment for order:', orderNumber);

      // Build bulk array parameter for EPPayOrderBulk
      const bulkParams: Record<string, unknown> = {
        'bulk[0][order_no]': orderNumber,
      };

      const response = await this.makeRequest<{
        api_status: string;
        error_code: string;
        error_remark: string;
        result: Array<{
          status: string;
          remarks: string;
          orderno?: string;
          messagenow?: string; // "Fully Paid" or error message
          parcel?: Array<{
            parcelno: string;
            awb: string;
            awb_id_link: string;
            tracking_url: string;
          }>;
        }>;
      }>('EPPayOrderBulk', bulkParams);

      // Check for API errors
      if (response.api_status !== 'Success' || response.error_code !== '0') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          response.error_remark || 'Failed to process order payment',
          { response }
        );
      }

      // DEBUG: Log complete payment response FIRST before any processing
      console.log('[EasyParcel] ===== RAW PAYMENT API RESPONSE =====');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('[EasyParcel] ===== END RAW PAYMENT RESPONSE =====');

      // Write payment response to file for detailed inspection
      const fs = require('fs');
      try {
        fs.writeFileSync('/tmp/easyparcel-payment-response.json', JSON.stringify(response, null, 2));
        console.log('[EasyParcel] Payment response written to /tmp/easyparcel-payment-response.json');
      } catch (e) {
        console.log('[EasyParcel] Could not write payment response file:', e);
      }

      // Extract payment details from bulk response
      const bulkResult = response.result?.[0];

      // DEBUG: Log payment response details
      console.log('[EasyParcel] ===== PAYMENT RESPONSE DETAILS =====');
      console.log('bulkResult exists?:', !!bulkResult);
      console.log('bulkResult.status:', bulkResult?.status);
      console.log('bulkResult.messagenow:', bulkResult?.messagenow);
      console.log('bulkResult.parcel count:', bulkResult?.parcel?.length || 0);
      console.log('[EasyParcel] ===== END PAYMENT RESPONSE =====');

      if (!bulkResult || bulkResult.status !== 'Success') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          bulkResult?.remarks || 'Failed to process order payment',
          { response }
        );
      }

      // Extract parcel details first
      const parcels = bulkResult.parcel || [];
      if (parcels.length === 0) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          'No parcel details returned after payment',
          { orderNumber, response }
        );
      }

      // IMPORTANT: If we got here with parcels, payment succeeded
      // The messagenow field is informational and can vary ("Fully Paid", "paid", etc.)
      // EasyParcel API docs don't guarantee exact string match
      // Only check for actual payment failures (insufficient balance)
      if (bulkResult.messagenow) {
        const message = bulkResult.messagenow.toLowerCase();
        if (message.includes('insufficient') || message.includes('not enough credit')) {
          throw new EasyParcelError(
            SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE,
            bulkResult.messagenow,
            { orderNumber, response }
          );
        }
      }

      console.log('[EasyParcel] Payment successful:', {
        orderNumber: bulkResult.orderno,
        paymentStatus: bulkResult.messagenow,
        parcelCount: parcels.length,
        parcels: parcels.map(p => ({
          parcelNo: p.parcelno,
          awb: p.awb,
          hasAwbLink: !!p.awb_id_link,
          hasTrackingUrl: !!p.tracking_url,
        })),
      });

      return {
        success: true,
        data: {
          order_number: bulkResult.orderno || orderNumber,
          payment_status: bulkResult.messagenow,
          parcels: parcels.map(p => ({
            parcelno: p.parcelno,
            awb: p.awb,
            awb_id_link: p.awb_id_link,
            tracking_url: p.tracking_url,
          })),
        },
      };
    } catch (error) {
      if (error instanceof EasyParcelError) {
        throw error;
      }

      console.error('[EasyParcel] Payment failed:', error);

      // Handle common error scenarios
      if (this.isInsufficientBalanceError(error)) {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.INSUFFICIENT_BALANCE,
          'Insufficient EasyParcel credit balance to complete payment',
          { originalError: error }
        );
      }

      throw new EasyParcelError(
        SHIPPING_ERROR_CODES.UNKNOWN_ERROR,
        'Failed to process order payment',
        { originalError: error }
      );
    }
  }

  /**
   * Fetch tracking information for a shipment
   *
   * @param trackingNumber - EasyParcel tracking number (AWB number)
   * @returns Tracking events and current status
   * @throws EasyParcelError if tracking fetch fails
   */
  async getTracking(trackingNumber: string): Promise<EasyParcelTrackingResponse> {
    try {
      console.log('[EasyParcel] Fetching tracking:', trackingNumber);

      // Build bulk array parameter for EPTrackingBulk
      const bulkParams: Record<string, unknown> = {
        'bulk[0][awb_no]': trackingNumber,
      };

      const response = await this.makeRequest<{
        api_status: string;
        error_code: string;
        error_remark: string;
        result: Array<{
          status: string;
          remarks: string;
          awb_no?: string;
          current_status?: string;
          latest_update?: string;
          sender_name?: string;
          sender_contact?: string;
          receiver_name?: string;
          receiver_contact?: string;
          events?: Array<{
            date: string;
            time: string;
            status: string;
            location: string;
            description: string;
          }>;
        }>;
      }>('EPTrackingBulk', bulkParams);

      // Check for API errors
      if (response.api_status !== 'Success' || response.error_code !== '0') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.SERVICE_UNAVAILABLE,
          response.error_remark || 'Failed to fetch tracking information',
          { response }
        );
      }

      // Extract tracking details from bulk response
      const bulkResult = response.result?.[0];
      if (!bulkResult || bulkResult.status !== 'Success') {
        throw new EasyParcelError(
          SHIPPING_ERROR_CODES.TRACKING_NOT_FOUND,
          bulkResult?.remarks || 'Tracking information not found',
          { trackingNumber }
        );
      }

      console.log('[EasyParcel] Tracking fetched successfully:', {
        trackingNumber,
        eventsCount: bulkResult.events?.length || 0,
        currentStatus: bulkResult.current_status,
      });

      return {
        success: true,
        data: {
          tracking_number: bulkResult.awb_no || trackingNumber,
          current_status: bulkResult.current_status || '',
          latest_update: bulkResult.latest_update || '',
          sender_name: bulkResult.sender_name,
          sender_contact: bulkResult.sender_contact,
          receiver_name: bulkResult.receiver_name,
          receiver_contact: bulkResult.receiver_contact,
          events: bulkResult.events?.map(event => ({
            date: event.date,
            time: event.time,
            status: event.status,
            location: event.location,
            description: event.description,
          })) || [],
        },
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
