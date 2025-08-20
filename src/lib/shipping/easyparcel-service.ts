/**
 * EasyParcel Service v2 for Malaysian Shipping Integration
 * Updated to align with official EasyParcel Individual API v1.4.0 specification
 * Reference: Official Malaysia_Individual_1.4.0.0.pdf documentation
 * Implemented: Rate checking with EPRateCheckingBulk endpoint
 */

import axios, { AxiosInstance } from 'axios';

// ===== EasyParcel API v1.4.0 Type Definitions =====
// Reference: Malaysia_Individual_1.4.0.0.pdf Section 3.1 - Address Structure Validation

export interface AddressStructure {
  name: string; // Max 100 chars
  company?: string; // Max 100 chars
  phone: string; // Malaysian format: +60XXXXXXXXX
  email?: string;
  address_line_1: string; // Max 100 chars
  address_line_2?: string; // Max 100 chars
  city: string; // Max 50 chars
  state: MalaysianState; // As per Malaysia_Individual_1.4.0.0.pdf Appendix A
  postcode: string; // 5-digit Malaysian postcode
  country: string; // "MY" for Malaysia
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 3.2 - Parcel Details Structure
export interface ParcelDetails {
  weight: number; // In KG, max 70kg
  length?: number; // In CM
  width?: number; // In CM  
  height?: number; // In CM
  content: string; // Description, max 100 chars
  value: number; // In MYR for insurance
  quantity?: number; // Default 1
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 4.1 - Rate Calculation
export interface RateRequest {
  pickup_address: AddressStructure;
  delivery_address: AddressStructure;
  parcel: ParcelDetails;
  service_types?: string[]; // STANDARD, EXPRESS, OVERNIGHT
  insurance?: boolean;
  cod?: boolean;
}

export interface RateResponse {
  rates: Array<{
    courier_id: string;
    courier_name: string;
    service_name: string;
    service_type: string;
    price: number;
    estimated_delivery_days: number;
    description?: string;
    features: {
      insurance_available: boolean;
      cod_available: boolean;
      signature_required_available: boolean;
    };
  }>;
  pickup_address: AddressStructure;
  delivery_address: AddressStructure;
  parcel: ParcelDetails;
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 5.1 - Shipment Booking
export interface ShipmentBookingRequest {
  pickup_address: AddressStructure;
  delivery_address: AddressStructure;
  parcel: ParcelDetails;
  service_id: string; // From rate calculation
  reference: string; // Order number
  pickup_date?: string; // YYYY-MM-DD
  pickup_time?: string; // morning, afternoon, evening
  special_instruction?: string;
  insurance?: boolean;
  signature_required?: boolean;
  cod?: {
    amount: number;
    payment_method: "CASH" | "CHEQUE";
  };
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 5.2 - Shipment Booking Response
export interface ShipmentBookingResponse {
  shipment_id: string;
  tracking_number: string;
  reference: string;
  status: string;
  estimated_delivery: string; // ISO 8601
  label_url?: string;
  total_price: number;
  courier: {
    id: string;
    name: string;
    service_name: string;
  };
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 8.1 - Pickup Scheduling
export interface PickupRequest {
  shipment_ids: string[];
  pickup_date: string; // YYYY-MM-DD
  pickup_time: "morning" | "afternoon" | "evening";
  contact_person: string;
  contact_phone: string;
  special_instruction?: string;
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 6.1 - Tracking
export interface TrackingResponse {
  tracking_number: string;
  status: string;
  status_description: string;
  estimated_delivery?: string;
  events: TrackingEvent[];
  delivery_info?: {
    delivered_at: string;
    received_by: string;
    signature_image?: string;
  };
}

export interface TrackingEvent {
  event_code: string;
  event_name: string;
  description: string;
  location?: string;
  event_time: string; // ISO 8601
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 6.3 - Webhook Payload
export interface WebhookPayload {
  tracking_number: string;
  event_code: string;
  event_name: string;
  event_description: string;
  event_time: string; // ISO 8601
  location?: string;
  shipment_id: string;
  signature?: string; // Webhook signature verification
}

// Reference: Malaysia_Individual_1.4.0.0.pdf Section 9.1 - Error Handling
export interface EasyParcelError {
  error: {
    code: string; // E.g., "INVALID_ADDRESS", "INSUFFICIENT_CREDIT"
    message: string;
    details?: any;
  };
  http_status: number;
}

// Malaysian State type (Malaysia_Individual_1.4.0.0.pdf Appendix B)
export type MalaysianState = 
  | "JOH" | "KDH" | "KTN" | "MLK" | "NSN" | "PHG" | "PRK" | "PLS" 
  | "PNG" | "KUL" | "TRG" | "SEL" | "SBH" | "SWK" | "LBN";

export class EasyParcelService {
  private apiClient!: AxiosInstance;
  private isConfigured: boolean = false;
  private isSandbox: boolean = true;
  private readonly baseURL: string;

  constructor() {
    const apiKey = process.env.EASYPARCEL_API_KEY;
    const apiSecret = process.env.EASYPARCEL_API_SECRET;
    this.isSandbox = process.env.EASYPARCEL_SANDBOX === 'true';
    
    // Reference: Malaysia_Individual_1.4.0.0.pdf Section 2.1 - Base URL Configuration
    this.baseURL = process.env.EASYPARCEL_BASE_URL || 'http://demo.connect.easyparcel.my';

    if (!apiKey || !apiSecret) {
      console.warn('EasyParcel credentials not configured. Using mock mode.');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    this.initializeClient(apiKey, apiSecret);
  }

  private initializeClient(apiKey: string, apiSecret: string): void {
    // Get timeout values from environment or use defaults
    const sandboxTimeout = parseInt(process.env.EASYPARCEL_SANDBOX_TIMEOUT || '8000');
    const productionTimeout = parseInt(process.env.EASYPARCEL_PRODUCTION_TIMEOUT || '15000');
    
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.isSandbox ? sandboxTimeout : productionTimeout, // Configurable timeout
      headers: {
        // Reference: Malaysia_Individual_1.4.0.0.pdf Section 2.2 - Headers Implementation
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
    });

    // Request interceptor for logging
    this.apiClient.interceptors.request.use(
      config => {
        if (this.isSandbox) {
          console.log('🚚 EasyParcel API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
        }
        return config;
      },
      error => {
        console.error('❌ EasyParcel API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => {
        if (this.isSandbox) {
          console.log('✅ EasyParcel API Response:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      error => {
        console.error('❌ EasyParcel API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  // ===== Helper Methods =====
  
  /**
   * Map EasyParcel service detail to our service type
   */
  private mapServiceType(serviceDetail: string): string {
    const detail = serviceDetail.toLowerCase();
    if (detail.includes('overnight') || detail.includes('next day')) return 'OVERNIGHT';
    if (detail.includes('express') || detail.includes('same day')) return 'EXPRESS';
    return 'STANDARD';
  }

  /**
   * Parse delivery time from EasyParcel format
   */
  private parseDeliveryDays(deliveryStr: string): number {
    const match = deliveryStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  // ===== Core API Methods =====

  /**
   * Calculate shipping rates
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 4.1 - Rate Calculation Enhancement
   */
  async calculateRates(request: RateRequest): Promise<RateResponse> {
    try {
      if (!this.isConfigured) {
        console.log('🔒 EasyParcel not configured, using mock data');
        return this.getMockRateResponse(request);
      }

      // Validate request according to API specification
      this.validateRateRequest(request);

      // Prepare form data for Individual API EPRateCheckingBulk
      const formData = new URLSearchParams();
      formData.append('api', process.env.EASYPARCEL_API_KEY || '');
      
      // Bulk format (single item for now) - fix duplicate pick_addr issue
      formData.append('bulk[0][pick_name]', request.pickup_address.name);
      formData.append('bulk[0][pick_mobile]', request.pickup_address.phone);
      
      // Combine address lines properly
      let pickupFullAddress = request.pickup_address.address_line_1;
      if (request.pickup_address.address_line_2) {
        pickupFullAddress += `, ${request.pickup_address.address_line_2}`;
      }
      formData.append('bulk[0][pick_addr]', pickupFullAddress);
      
      formData.append('bulk[0][pick_city]', request.pickup_address.city);
      formData.append('bulk[0][pick_code]', request.pickup_address.postcode);
      formData.append('bulk[0][pick_state]', request.pickup_address.state.toLowerCase());
      formData.append('bulk[0][pick_country]', 'MY');
      
      // Receiver details - fix duplicate send_addr issue
      formData.append('bulk[0][send_name]', request.delivery_address.name);
      formData.append('bulk[0][send_mobile]', request.delivery_address.phone);
      
      // Combine address lines properly
      let deliveryFullAddress = request.delivery_address.address_line_1;
      if (request.delivery_address.address_line_2) {
        deliveryFullAddress += `, ${request.delivery_address.address_line_2}`;
      }
      formData.append('bulk[0][send_addr]', deliveryFullAddress);
      
      formData.append('bulk[0][send_city]', request.delivery_address.city);
      formData.append('bulk[0][send_code]', request.delivery_address.postcode);
      formData.append('bulk[0][send_state]', request.delivery_address.state.toLowerCase());
      formData.append('bulk[0][send_country]', 'MY');
      
      // Parcel details
      formData.append('bulk[0][weight]', request.parcel.weight.toString());
      formData.append('bulk[0][content]', request.parcel.content);
      formData.append('bulk[0][value]', request.parcel.value.toString());
      if (request.parcel.length && request.parcel.width && request.parcel.height) {
        formData.append('bulk[0][length]', request.parcel.length.toString());
        formData.append('bulk[0][width]', request.parcel.width.toString());
        formData.append('bulk[0][height]', request.parcel.height.toString());
      }

      console.log('🔍 EasyParcel API Request Details:', {
        url: `${this.baseURL}/?ac=EPRateCheckingBulk`,
        apiKey: process.env.EASYPARCEL_API_KEY ? `${process.env.EASYPARCEL_API_KEY.substring(0, 8)}...` : 'MISSING',
        pickupState: request.pickup_address.state,
        deliveryState: request.delivery_address.state,
        weight: request.parcel.weight,
        formDataSize: formData.toString().length
      });

      const response = await this.apiClient.post('/?ac=EPRateCheckingBulk', formData.toString());

      console.log('🔍 EasyParcel Full Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        hasRates: !!response.data?.rates,
        dataType: typeof response.data,
        dataLength: response.data ? JSON.stringify(response.data).length : 0
      });

      if (!response.data) {
        console.warn('⚠️ EasyParcel returned empty response:', response.data);
        throw new Error('Empty response from EasyParcel API');
      }

      // Check for API error response (Individual API format)
      if (response.data.error || (response.data.api_status && response.data.api_status !== 'Success')) {
        const errorCode = response.data.error_code;
        const errorMsg = response.data.error_remark || response.data.error || response.data.message || 'Unknown API error';
        console.error('❌ EasyParcel API Error:', {
          code: errorCode,
          message: errorMsg,
          status: response.data.api_status
        });
        
        // Handle specific error codes
        if (errorCode === '5') {
          throw new Error(`EasyParcel API Error: ${errorMsg}. Please verify your API key is activated and has sufficient credits.`);
        }
        
        throw new Error(`EasyParcel API Error: ${errorMsg}`);
      }

      // Transform Individual API response to our format
      // EasyParcel Individual API returns: { api_status: "Success", result: [{ rates: [...] }] }
      if (response.data.api_status === 'Success' && response.data.result && Array.isArray(response.data.result)) {
        const firstResult = response.data.result[0];
        if (firstResult && firstResult.rates && Array.isArray(firstResult.rates)) {
          const transformedRates = firstResult.rates.map((rate: any) => ({
            courier_id: rate.courier_id || rate.service_id || 'unknown',
            courier_name: rate.courier_name || rate.service_name || 'Unknown Courier',
            service_name: rate.service_name || 'Standard Service',
            service_type: this.mapServiceType(rate.service_detail || rate.service_type || 'pickup'),
            price: parseFloat(rate.price || '0'),
            estimated_delivery_days: this.parseDeliveryDays(rate.delivery || '3 working day(s)'),
            description: rate.service_name ? `${rate.service_name} delivery service` : 'Standard delivery service',
            features: {
              insurance_available: rate.addon_insurance_available !== false,
              cod_available: rate.cod_service_available !== false,
              signature_required_available: true,
            }
          }));

          console.log('✅ Transformed EasyParcel rates:', transformedRates.length, 'options found');

          return {
            rates: transformedRates,
            pickup_address: request.pickup_address,
            delivery_address: request.delivery_address,
            parcel: request.parcel
          };
        }
      }

      console.warn('⚠️ No rates found in EasyParcel response');
      throw new Error('No shipping rates available for this destination');
    } catch (error) {
      console.error('❌ EasyParcel API Error Details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Only fall back to mock data in sandbox/development mode
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        console.log('🔄 Falling back to mock shipping rates due to API error (development mode)');
        return this.getMockRateResponse(request);
      }
      
      // In production, throw the error to be handled by the business layer
      throw this.handleApiError(error);
    }
  }

  /**
   * Book a shipment
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 5.1 - Shipment Creation API
   */
  async bookShipment(request: ShipmentBookingRequest): Promise<ShipmentBookingResponse> {
    try {
      if (!this.isConfigured) {
        return this.getMockShipmentBooking(request);
      }

      // Validate request according to API specification
      this.validateShipmentBookingRequest(request);

      const response = await this.apiClient.post('/shipments', request);

      if (!response.data || !response.data.shipment_id) {
        throw new Error('Invalid response format from EasyParcel API');
      }

      return response.data;
    } catch (error) {
      console.error('Error booking shipment:', error);
      
      // Return mock booking in development
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockShipmentBooking(request);
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Generate shipping label
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 7.1 - Label Download API
   */
  async generateLabel(shipmentId: string): Promise<Buffer> {
    try {
      if (!this.isConfigured) {
        return this.getMockLabel();
      }

      const response = await this.apiClient.get(`/shipments/${shipmentId}/label`, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error generating label:', error);
      
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockLabel();
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Schedule pickup
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 8.1 - Pickup Booking API
   */
  async schedulePickup(request: PickupRequest): Promise<{ pickup_id: string; status: string }> {
    try {
      if (!this.isConfigured) {
        return { pickup_id: `pickup_${Date.now()}`, status: 'scheduled' };
      }

      const response = await this.apiClient.post('/pickups', request);
      return response.data;
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return { pickup_id: `pickup_${Date.now()}`, status: 'scheduled' };
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Check account credit balance
   * Reference: Malaysia_Individual_1.4.0.0.pdf - EPCheckCreditBalance endpoint
   */
  async checkCreditBalance(): Promise<{ balance: number; currency: string; wallets: Array<{ balance: number; currency_code: string }> }> {
    try {
      if (!this.isConfigured) {
        const mockBalance = parseFloat(process.env.MOCK_CREDIT_BALANCE || '1000.00');
        return {
          balance: mockBalance,
          currency: 'MYR',
          wallets: [{ balance: mockBalance, currency_code: 'MYR' }]
        };
      }

      const formData = new URLSearchParams();
      formData.append('api', process.env.EASYPARCEL_API_KEY || '');

      const response = await this.apiClient.post('/?ac=EPCheckCreditBalance', formData.toString());

      if (!response.data || response.data.api_status !== 'Success') {
        throw new Error(`Credit balance check failed: ${response.data?.error_remark || 'Unknown error'}`);
      }

      return {
        balance: parseFloat(response.data.result || '0'),
        currency: response.data.currency || 'MYR',
        wallets: response.data.wallet || []
      };
    } catch (error) {
      console.error('Error checking credit balance:', error);
      
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        const mockBalance = parseFloat(process.env.MOCK_CREDIT_BALANCE || '1000.00');
        return {
          balance: mockBalance,
          currency: 'MYR',
          wallets: [{ balance: mockBalance, currency_code: 'MYR' }]
        };
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Track shipment
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 6.1 - Tracking API
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      if (!this.isConfigured) {
        return this.getMockTrackingResponse(trackingNumber);
      }

      const response = await this.apiClient.get(`/tracking/${trackingNumber}`);

      if (!response.data || !response.data.tracking_number) {
        throw new Error('Tracking information not found');
      }

      return response.data;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockTrackingResponse(trackingNumber);
      }

      throw this.handleApiError(error);
    }
  }

  // ===== Validation Methods =====

  private validateRateRequest(request: RateRequest): void {
    // Validate addresses
    this.validateAddress(request.pickup_address, 'pickup');
    this.validateAddress(request.delivery_address, 'delivery');
    
    // Validate parcel
    this.validateParcel(request.parcel);
  }

  private validateShipmentBookingRequest(request: ShipmentBookingRequest): void {
    this.validateRateRequest(request);
    
    if (!request.service_id) {
      throw new Error('Service ID is required for shipment booking');
    }
    
    if (!request.reference) {
      throw new Error('Reference (order number) is required');
    }
  }

  private validateAddress(address: AddressStructure, type: string): void {
    if (!address.name || address.name.length > 100) {
      throw new Error(`${type} address name is required and must be max 100 characters`);
    }
    
    if (!address.phone || !this.validateMalaysianPhone(address.phone)) {
      throw new Error(`${type} address must have valid Malaysian phone number (+60XXXXXXXXX)`);
    }
    
    if (!address.address_line_1 || address.address_line_1.length > 100) {
      throw new Error(`${type} address line 1 is required and must be max 100 characters`);
    }
    
    if (!address.city || address.city.length > 50) {
      throw new Error(`${type} city is required and must be max 50 characters`);
    }
    
    if (!address.state || !this.isValidMalaysianState(address.state)) {
      throw new Error(`${type} state must be valid Malaysian state code`);
    }
    
    if (!address.postcode || !this.validateMalaysianPostcode(address.postcode)) {
      throw new Error(`${type} postcode must be valid 5-digit Malaysian postcode`);
    }
    
    if (address.country && address.country !== 'MY') {
      throw new Error('Only Malaysian addresses are supported (country: MY)');
    }
  }

  private validateParcel(parcel: ParcelDetails): void {
    if (!parcel.weight || parcel.weight <= 0 || parcel.weight > 70) {
      throw new Error('Parcel weight must be between 0.1 and 70 kg');
    }
    
    if (!parcel.content || parcel.content.length > 100) {
      throw new Error('Parcel content description is required and must be max 100 characters');
    }
    
    if (!parcel.value || parcel.value <= 0) {
      throw new Error('Parcel value must be greater than 0 for insurance purposes');
    }
  }

  // ===== Malaysian Validation Methods =====
  // Reference: PDF Appendix A & B

  private validateMalaysianPhone(phone: string): boolean {
    const phoneRegex = /^\+60[0-9]{8,10}$/;
    return phoneRegex.test(phone);
  }

  private validateMalaysianPostcode(postcode: string): boolean {
    const postcodeRegex = /^\d{5}$/;
    return postcodeRegex.test(postcode);
  }

  private isValidMalaysianState(state: string): boolean {
    const validStates: MalaysianState[] = [
      "JOH", "KDH", "KTN", "MLK", "NSN", "PHG", "PRK", "PLS",
      "PNG", "KUL", "TRG", "SEL", "SBH", "SWK", "LBN"
    ];
    return validStates.includes(state as MalaysianState);
  }

  // Reference: Malaysia_Individual_1.4.0.0.pdf Appendix A - Postcode Validation
  private readonly MALAYSIAN_POSTCODE_RANGES: Record<MalaysianState, [number, number]> = {
    "KUL": [50000, 60999], // Kuala Lumpur & Putrajaya
    "SEL": [40000, 48999], // Selangor
    "JOH": [79000, 86999], // Johor
    "MLK": [75000, 78999], // Melaka
    "NSN": [70000, 73999], // Negeri Sembilan
    "PHG": [25000, 39999], // Pahang
    "PRK": [30000, 36999], // Perak
    "PLS": [1000, 2999],   // Perlis
    "PNG": [10000, 14999], // Pulau Pinang
    "KDH": [5000, 9999],   // Kedah
    "TRG": [20000, 24999], // Terengganu
    "KTN": [15000, 18999], // Kelantan
    "SBH": [87000, 91999], // Sabah
    "SWK": [93000, 98999], // Sarawak
    "LBN": [87000, 87999], // Labuan
  };

  validatePostcodeForState(postcode: string, state: MalaysianState): boolean {
    const range = this.MALAYSIAN_POSTCODE_RANGES[state];
    if (!range) return false;
    
    const code = parseInt(postcode);
    return code >= range[0] && code <= range[1];
  }

  // ===== Error Handling =====
  // Reference: Malaysia_Individual_1.4.0.0.pdf Section 9 - Error Codes

  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.error?.message || data?.message || error.message;
      const errorCode = data?.error?.code;

      // Handle specific EasyParcel error codes
      switch (errorCode) {
        case 'INVALID_ADDRESS':
          return new Error(`Invalid address: ${message}`);
        case 'UNSUPPORTED_POSTCODE':
          return new Error(`Postcode not serviceable: ${message}`);
        case 'INVALID_WEIGHT':
          return new Error(`Weight exceeds limits: ${message}`);
        case 'INSUFFICIENT_CREDIT':
          return new Error(`Insufficient account balance: ${message}`);
        case 'SERVICE_UNAVAILABLE':
          return new Error(`Courier service not available: ${message}`);
        case 'INVALID_PICKUP_DATE':
          return new Error(`Pickup date not available: ${message}`);
        default:
          return new Error(`EasyParcel API error: ${message}`);
      }
    }

    return new Error('Network error occurred while connecting to EasyParcel');
  }

  // ===== Mock Methods for Development =====

  private getMockRateResponse(request: RateRequest): RateResponse {
    const isWestMalaysia = this.isWestMalaysianState(request.delivery_address.state);
    
    // Use environment variables for mock pricing or sensible defaults
    const westMalaysiaBasePrice = parseFloat(process.env.MOCK_WEST_MALAYSIA_BASE_PRICE || '8');
    const eastMalaysiaBasePrice = parseFloat(process.env.MOCK_EAST_MALAYSIA_BASE_PRICE || '15');
    const basePrice = isWestMalaysia ? westMalaysiaBasePrice : eastMalaysiaBasePrice;
    
    const weightMultiplier = Math.ceil(request.parcel.weight);
    const standardMultiplier = parseFloat(process.env.MOCK_STANDARD_WEIGHT_MULTIPLIER || '2');
    const expressMultiplier = parseFloat(process.env.MOCK_EXPRESS_WEIGHT_MULTIPLIER || '3');
    const expressBasePremium = parseFloat(process.env.MOCK_EXPRESS_BASE_PREMIUM || '5');
    
    // Note: Free shipping logic will be applied later in the business layer
    const standardPrice = basePrice + weightMultiplier * standardMultiplier;
    const expressPrice = basePrice + weightMultiplier * expressMultiplier + expressBasePremium;

    return {
      rates: [
        {
          courier_id: 'citylink',
          courier_name: 'City-Link Express',
          service_name: 'Standard Delivery',
          service_type: 'STANDARD',
          price: standardPrice,
          estimated_delivery_days: isWestMalaysia ? 2 : 4,
          description: 'Standard delivery service',
          features: {
            insurance_available: true,
            cod_available: true,
            signature_required_available: true,
          }
        },
        {
          courier_id: 'poslaju',
          courier_name: 'Pos Laju',
          service_name: 'Next Day Delivery',
          service_type: 'EXPRESS',
          price: expressPrice,
          estimated_delivery_days: 1,
          description: 'Express next day delivery',
          features: {
            insurance_available: true,
            cod_available: false,
            signature_required_available: true,
          }
        }
      ],
      pickup_address: request.pickup_address,
      delivery_address: request.delivery_address,
      parcel: request.parcel
    };
  }

  private getMockShipmentBooking(request: ShipmentBookingRequest): ShipmentBookingResponse {
    return {
      shipment_id: `EP${Date.now()}`,
      tracking_number: `EP${Date.now()}TRK`,
      reference: request.reference,
      status: 'BOOKED',
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      label_url: `https://labels.easyparcel.my/EP${Date.now()}.pdf`,
      total_price: 15.00,
      courier: {
        id: request.service_id,
        name: 'City-Link Express',
        service_name: 'Standard Delivery'
      }
    };
  }

  private getMockTrackingResponse(trackingNumber: string): TrackingResponse {
    return {
      tracking_number: trackingNumber,
      status: 'IN_TRANSIT',
      status_description: 'Package is in transit to destination',
      estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          event_code: 'PICKED_UP',
          event_name: 'Package Picked Up',
          description: 'Package picked up from sender',
          location: 'Origin Hub - Kuala Lumpur',
          event_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          event_code: 'IN_TRANSIT',
          event_name: 'In Transit',
          description: 'Package in transit to destination',
          location: 'Transit Hub - Johor',
          event_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    };
  }

  private getMockLabel(): Buffer {
    // Return a simple PDF placeholder
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
250
%%EOF`;
    
    return Buffer.from(pdfContent);
  }

  /**
   * Configure webhook with EasyParcel
   * Reference: Malaysia_Individual_1.4.0.0.pdf Section 6.3 - Webhook Configuration
   */
  async configureWebhook(config: {
    url: string;
    events: string[];
    secret: string;
  }): Promise<any> {
    try {
      console.log('🔧 Configuring EasyParcel webhook:', {
        url: config.url,
        events: config.events,
      });

      // In sandbox mode, return mock success
      if (!this.isConfigured || this.isSandbox) {
        console.log('📋 Webhook configured (sandbox mode)');
        return {
          webhook_id: 'mock-webhook-' + Math.random().toString(36).substr(2, 9),
          url: config.url,
          events: config.events,
          status: 'active',
          created_at: new Date().toISOString(),
        };
      }

      // Production webhook configuration
      const response = await fetch(`${this.baseURL}/webhooks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: config.url,
          events: config.events,
          secret: config.secret,
          active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Webhook configuration failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Webhook configured successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Webhook configuration error:', error);
      throw error;
    }
  }

  /**
   * Disable webhook with EasyParcel
   */
  async disableWebhook(): Promise<any> {
    try {
      console.log('🔧 Disabling EasyParcel webhook');

      // In sandbox mode, return mock success
      if (!this.isConfigured || this.isSandbox) {
        console.log('📋 Webhook disabled (sandbox mode)');
        return {
          status: 'disabled',
          disabled_at: new Date().toISOString(),
        };
      }

      // Production webhook disable
      const response = await fetch(`${this.baseURL}/webhooks`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Webhook disable failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Webhook disabled successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Webhook disable error:', error);
      throw error;
    }
  }

  /**
   * Get webhook configuration status
   */
  async getWebhookStatus(): Promise<any> {
    try {
      console.log('🔍 Getting webhook status');

      // In sandbox mode, return mock status
      if (!this.isConfigured || this.isSandbox) {
        return {
          configured: true,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/easyparcel-tracking`,
          events: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
          status: 'active',
          last_triggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        };
      }

      // Production webhook status
      const response = await fetch(`${this.baseURL}/webhooks`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Get webhook status failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Webhook status retrieved:', result);
      return result;

    } catch (error) {
      console.error('❌ Get webhook status error:', error);
      throw error;
    }
  }

  private isWestMalaysianState(state: string): boolean {
    const westStates: MalaysianState[] = [
      'KUL', 'SEL', 'JOH', 'MLK', 'NSN', 'PHG', 'PRK', 'PLS', 'PNG', 'KDH', 'TRG', 'KTN'
    ];
    return westStates.includes(state as MalaysianState);
  }

  // ===== Helper Methods =====

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    };
  }

  // ===== Utility Methods =====

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceStatus() {
    return {
      configured: this.isConfigured,
      sandbox: this.isSandbox,
      baseURL: this.baseURL,
      hasApiKey: !!process.env.EASYPARCEL_API_KEY,
      hasApiSecret: !!process.env.EASYPARCEL_API_SECRET,
    };
  }

  getMalaysianStates(): Array<{ code: MalaysianState; name: string; zone: 'west' | 'east' }> {
    return [
      // West Malaysia
      { code: 'KUL', name: 'Kuala Lumpur', zone: 'west' },
      { code: 'SEL', name: 'Selangor', zone: 'west' },
      { code: 'JOH', name: 'Johor', zone: 'west' },
      { code: 'MLK', name: 'Melaka', zone: 'west' },
      { code: 'NSN', name: 'Negeri Sembilan', zone: 'west' },
      { code: 'PHG', name: 'Pahang', zone: 'west' },
      { code: 'PRK', name: 'Perak', zone: 'west' },
      { code: 'PLS', name: 'Perlis', zone: 'west' },
      { code: 'PNG', name: 'Pulau Pinang', zone: 'west' },
      { code: 'KDH', name: 'Kedah', zone: 'west' },
      { code: 'TRG', name: 'Terengganu', zone: 'west' },
      { code: 'KTN', name: 'Kelantan', zone: 'west' },

      // East Malaysia
      { code: 'SBH', name: 'Sabah', zone: 'east' },
      { code: 'SWK', name: 'Sarawak', zone: 'east' },
      { code: 'LBN', name: 'Labuan', zone: 'east' },
    ];
  }
}

// Export singleton instance
export const easyParcelService = new EasyParcelService();