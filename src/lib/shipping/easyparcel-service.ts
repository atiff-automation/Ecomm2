/**
 * EasyParcel Service for Malaysian Shipping Integration
 * Handles shipping rate calculation, shipment creation, and tracking
 */

import axios, { AxiosInstance } from 'axios';

export interface ShippingAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface ShippingItem {
  name: string;
  weight: number; // in kg
  quantity: number;
  value: number; // for insurance
}

export interface ShippingRateRequest {
  pickupAddress: ShippingAddress;
  deliveryAddress: ShippingAddress;
  items: ShippingItem[];
  totalWeight: number;
  totalValue: number;
  courier?: string;
}

export interface ShippingRate {
  courierId: string;
  courierName: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

export interface ShipmentCreateRequest extends ShippingRateRequest {
  courierId: string;
  orderNumber: string;
  specialInstructions?: string;
  insuranceRequired?: boolean;
}

export interface Shipment {
  trackingNumber: string;
  courierTrackingUrl: string;
  estimatedDeliveryDate?: string;
  shipmentId: string;
  status: 'created' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  events: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export class EasyParcelService {
  private apiClient!: AxiosInstance;
  private isConfigured: boolean = false;
  private isSandbox: boolean = true;

  constructor() {
    const apiKey = process.env.EASYPARCEL_API_KEY;
    const apiSecret = process.env.EASYPARCEL_API_SECRET;
    this.isSandbox = process.env.EASYPARCEL_SANDBOX === 'true';

    if (!apiKey || !apiSecret) {
      console.warn('EasyParcel credentials not configured. Using mock mode.');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;

    const baseURL = this.isSandbox
      ? 'https://connect.easyparcel.my/api/v2'
      : 'https://connect.easyparcel.my/api/v2';

    this.apiClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
    });

    // Request interceptor for logging
    this.apiClient.interceptors.request.use(
      config => {
        if (this.isSandbox) {
          console.log('EasyParcel API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
        }
        return config;
      },
      error => {
        console.error('EasyParcel API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => {
        if (this.isSandbox) {
          console.log('EasyParcel API Response:', {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      error => {
        console.error('EasyParcel API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Get shipping rates for delivery
   */
  async getShippingRates(
    request: ShippingRateRequest
  ): Promise<ShippingRate[]> {
    try {
      if (!this.isConfigured) {
        return this.getMockShippingRates(request);
      }

      const payload = {
        pickup: this.formatAddress(request.pickupAddress),
        delivery: this.formatAddress(request.deliveryAddress),
        parcel: {
          weight: request.totalWeight,
          value: request.totalValue,
          content: request.items.map(item => item.name).join(', '),
        },
        courier_id: request.courier || null,
      };

      const response = await this.apiClient.post('/rates', payload);

      if (!response.data || !response.data.rates) {
        throw new Error('Invalid response format from EasyParcel API');
      }

      return response.data.rates.map((rate: any) => ({
        courierId: rate.courier_id,
        courierName: rate.courier_name,
        serviceName: rate.service_name,
        price: parseFloat(rate.price),
        estimatedDays: parseInt(rate.estimated_days) || 1,
        description: rate.description,
      }));
    } catch (error) {
      console.error('Error getting shipping rates:', error);

      // Return mock rates in case of API failure
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockShippingRates(request);
      }

      throw new Error(
        'Unable to retrieve shipping rates. Please try again later.'
      );
    }
  }

  /**
   * Create a shipment for pickup and delivery
   */
  async createShipment(request: ShipmentCreateRequest): Promise<Shipment> {
    try {
      if (!this.isConfigured) {
        return this.getMockShipment(request);
      }

      const payload = {
        pickup: this.formatAddress(request.pickupAddress),
        delivery: this.formatAddress(request.deliveryAddress),
        parcel: {
          weight: request.totalWeight,
          value: request.totalValue,
          content: request.items.map(item => item.name).join(', '),
          quantity: request.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        courier_id: request.courierId,
        reference: request.orderNumber,
        special_instruction: request.specialInstructions || '',
        insurance: request.insuranceRequired || false,
      };

      const response = await this.apiClient.post('/shipments', payload);

      if (!response.data || !response.data.shipment) {
        throw new Error('Invalid response format from EasyParcel API');
      }

      const shipment = response.data.shipment;
      return {
        trackingNumber: shipment.tracking_number,
        courierTrackingUrl: shipment.tracking_url,
        estimatedDeliveryDate: shipment.estimated_delivery,
        shipmentId: shipment.id,
        status: 'created',
      };
    } catch (error) {
      console.error('Error creating shipment:', error);

      // Return mock shipment in development
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockShipment(request);
      }

      throw new Error('Unable to create shipment. Please try again later.');
    }
  }

  /**
   * Get tracking information for a shipment
   */
  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    try {
      if (!this.isConfigured) {
        return this.getMockTrackingInfo(trackingNumber);
      }

      const response = await this.apiClient.get(`/tracking/${trackingNumber}`);

      if (!response.data || !response.data.tracking) {
        throw new Error('Tracking information not found');
      }

      const tracking = response.data.tracking;
      return {
        trackingNumber: tracking.tracking_number,
        status: tracking.status,
        statusDescription: tracking.status_description,
        events: tracking.events || [],
        estimatedDelivery: tracking.estimated_delivery,
        deliveredAt: tracking.delivered_at,
      };
    } catch (error) {
      console.error('Error getting tracking info:', error);

      // Return mock tracking in development
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        return this.getMockTrackingInfo(trackingNumber);
      }

      throw new Error('Unable to retrieve tracking information.');
    }
  }

  /**
   * Calculate shipping cost based on weight and destination
   */
  async calculateShippingCost(
    weight: number,
    fromState: string,
    toState: string,
    value: number = 100
  ): Promise<number> {
    const isWestMalaysia = this.isWestMalaysiaState(toState);
    const baseRate = isWestMalaysia ? 8 : 15; // RM
    const weightRate = Math.ceil(weight) * (isWestMalaysia ? 2 : 4); // RM per kg

    return baseRate + weightRate;
  }

  /**
   * Get available Malaysian states
   */
  getMalaysianStates(): Array<{
    code: string;
    name: string;
    zone: 'west' | 'east';
  }> {
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

  /**
   * Validate Malaysian postal code
   */
  validatePostalCode(postalCode: string, state: string): boolean {
    const cleanCode = postalCode.replace(/\s+/g, '');

    if (!/^\d{5}$/.test(cleanCode)) {
      return false;
    }

    // Basic postal code ranges for Malaysian states
    const postalRanges: Record<string, [number, number]> = {
      KUL: [50000, 60000],
      SEL: [40000, 48999],
      JOH: [79000, 86999],
      MLK: [75000, 78999],
      NSN: [70000, 73999],
      PHG: [25000, 39999],
      PRK: [30000, 36999],
      PLS: [1000, 2999],
      PNG: [10000, 14999],
      KDH: [5000, 9999],
      TRG: [20000, 24999],
      KTN: [15000, 18999],
      SBH: [87000, 91999],
      SWK: [93000, 98999],
      LBN: [87000, 87999],
    };

    const code = parseInt(cleanCode);
    const range = postalRanges[state];

    return range ? code >= range[0] && code <= range[1] : true;
  }

  /**
   * Check if service is configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      sandbox: this.isSandbox,
      hasApiKey: !!process.env.EASYPARCEL_API_KEY,
      hasApiSecret: !!process.env.EASYPARCEL_API_SECRET,
    };
  }

  // Private helper methods

  private formatAddress(address: ShippingAddress) {
    return {
      name: address.name,
      phone: address.phone,
      email: address.email || '',
      address_line_1: address.addressLine1,
      address_line_2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postcode: address.postalCode,
      country: address.country || 'MY',
    };
  }

  private isWestMalaysiaState(state: string): boolean {
    const westStates = [
      'KUL',
      'SEL',
      'JOH',
      'MLK',
      'NSN',
      'PHG',
      'PRK',
      'PLS',
      'PNG',
      'KDH',
      'TRG',
      'KTN',
    ];
    return westStates.includes(state.toUpperCase());
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Invalid request: ${message}`);
        case 401:
          return new Error('Invalid API credentials');
        case 403:
          return new Error('API access forbidden');
        case 404:
          return new Error('Resource not found');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('EasyParcel service unavailable');
        default:
          return new Error(`API error: ${message}`);
      }
    }

    return new Error('Network error occurred');
  }

  // Mock methods for development/testing

  private getMockShippingRates(request: ShippingRateRequest): ShippingRate[] {
    const isWestMalaysia = this.isWestMalaysiaState(
      request.deliveryAddress.state
    );
    const basePrice = isWestMalaysia ? 8 : 15;
    const weightMultiplier = Math.ceil(request.totalWeight);

    return [
      {
        courierId: 'citylink',
        courierName: 'City-Link Express',
        serviceName: 'Standard Delivery',
        price: basePrice + weightMultiplier * 2,
        estimatedDays: isWestMalaysia ? 2 : 4,
        description: 'Standard delivery service',
      },
      {
        courierId: 'poslaju',
        courierName: 'Pos Laju',
        serviceName: 'Next Day Delivery',
        price: basePrice + weightMultiplier * 3 + 5,
        estimatedDays: 1,
        description: 'Express next day delivery',
      },
      {
        courierId: 'gdex',
        courierName: 'GDex',
        serviceName: 'Economy Delivery',
        price: basePrice + weightMultiplier * 1.5,
        estimatedDays: isWestMalaysia ? 3 : 5,
        description: 'Economy delivery service',
      },
    ];
  }

  private getMockShipment(request: ShipmentCreateRequest): Shipment {
    const trackingNumber = `EP${Date.now()}`;

    return {
      trackingNumber,
      courierTrackingUrl: `https://track.easyparcel.my/${trackingNumber}`,
      estimatedDeliveryDate: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
      shipmentId: `shipment_${Date.now()}`,
      status: 'created',
    };
  }

  private getMockTrackingInfo(trackingNumber: string): TrackingInfo {
    return {
      trackingNumber,
      status: 'in_transit',
      statusDescription: 'Package is in transit',
      events: [
        {
          timestamp: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: 'picked_up',
          location: 'Origin Hub',
          description: 'Package picked up from sender',
        },
        {
          timestamp: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: 'in_transit',
          location: 'Transit Hub',
          description: 'Package in transit to destination',
        },
      ],
      estimatedDelivery: new Date(
        Date.now() + 1 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  }
}

// Export singleton instance
export const easyParcelService = new EasyParcelService();
