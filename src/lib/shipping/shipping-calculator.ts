/**
 * Enhanced Shipping Calculator v2
 * Updated to use EasyParcel API v1.4.0 service
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 3
 */

import { easyParcelService, type AddressStructure, type ParcelDetails, type RateRequest, type MalaysianState } from './easyparcel-service';

export interface ShippingCalculationItem {
  productId: string;
  name: string;
  weight: number; // in kg
  quantity: number;
  value: number; // for insurance purposes
  // Enhanced product properties for EasyParcel v1.4.0
  dimensions?: {
    length: number; // in cm
    width: number;  // in cm
    height: number; // in cm
  };
  shippingClass?: 'STANDARD' | 'FRAGILE' | 'HAZARDOUS';
  customsDescription?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string; // Must be Malaysian format: +60XXXXXXXXX
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: MalaysianState; // Use proper Malaysian state codes
  postalCode: string; // 5-digit Malaysian postcode
  country?: string; // Defaults to "MY"
}

export interface EnhancedShippingRate {
  // Core rate information
  courierId: string;
  courierName: string;
  serviceName: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  
  // Pricing
  originalPrice: number;
  price: number; // After free shipping applied
  freeShippingApplied: boolean;
  
  // Delivery information
  estimatedDays: number;
  description?: string;
  
  // Service features (from EasyParcel v1.4.0)
  features: {
    insuranceAvailable: boolean;
    codAvailable: boolean;
    signatureRequiredAvailable: boolean;
  };
  
  // Additional options with pricing
  insurancePrice?: number;
  codPrice?: number;
  signaturePrice?: number;
}

export interface ShippingCalculationResult {
  rates: EnhancedShippingRate[];
  summary: {
    totalWeight: number;
    totalValue: number;
    itemCount: number;
    freeShippingThreshold: number;
    freeShippingEligible: boolean;
    cheapestRate?: number;
    fastestService?: string;
    recommendedCourier?: string; // Best value recommendation
  };
  businessAddress: {
    name: string;
    city: string;
    state: string;
    zone: 'west' | 'east';
  };
  deliveryAddress: {
    city: string;
    state: string;
    zone: 'west' | 'east';
    serviceableByAllCouriers: boolean;
  };
  validationResults: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

export class ShippingCalculator {
  private freeShippingThreshold: number;
  private defaultInsuranceRate: number = 0.02; // 2% of parcel value
  private maxInsuranceAmount: number = 5000; // RM 5000 max insurance

  constructor() {
    this.freeShippingThreshold = parseFloat(
      process.env.FREE_SHIPPING_THRESHOLD || '150'
    );
  }

  /**
   * Enhanced shipping calculation with real-time EasyParcel rates
   * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Section 3
   */
  async calculateShipping(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress,
    orderValue: number,
    options?: {
      serviceTypes?: ('STANDARD' | 'EXPRESS' | 'OVERNIGHT')[];
      includeInsurance?: boolean;
      includeCOD?: boolean;
      codAmount?: number;
    }
  ): Promise<ShippingCalculationResult> {
    try {
      // Validate inputs
      const validation = this.validateShippingInputs(items, deliveryAddress);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate totals
      const { totalWeight, totalValue, itemCount } = this.calculateTotals(items);
      
      // Check free shipping eligibility
      const freeShippingEligible = orderValue >= this.freeShippingThreshold;

      // Get business pickup address
      const pickupAddress = this.getBusinessPickupAddress();

      // Prepare EasyParcel request
      const rateRequest = this.prepareRateRequest(
        pickupAddress,
        deliveryAddress,
        items,
        totalWeight,
        totalValue,
        options
      );

      // Get rates from EasyParcel API v1.4.0
      const rateResponse = await easyParcelService.calculateRates(rateRequest);

      // Process and enhance rates
      const enhancedRates = this.processRates(
        rateResponse.rates,
        freeShippingEligible,
        totalValue,
        options
      );

      // Determine delivery zones
      const businessZone = this.getDeliveryZone(pickupAddress.state as MalaysianState);
      const deliveryZone = this.getDeliveryZone(deliveryAddress.state);

      // Calculate summary statistics
      const summary = this.calculateSummary(
        enhancedRates,
        totalWeight,
        totalValue,
        itemCount,
        freeShippingEligible
      );

      return {
        rates: enhancedRates,
        summary,
        businessAddress: {
          name: pickupAddress.name,
          city: pickupAddress.city,
          state: pickupAddress.state,
          zone: businessZone,
        },
        deliveryAddress: {
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zone: deliveryZone,
          serviceableByAllCouriers: enhancedRates.length > 0,
        },
        validationResults: validation,
      };
    } catch (error) {
      console.error('Enhanced shipping calculation error:', error);
      
      // Return fallback rates for development
      if (process.env.NODE_ENV === 'development') {
        return this.getFallbackShippingRates(items, deliveryAddress, orderValue);
      }
      
      throw error;
    }
  }

  /**
   * Get recommended shipping option based on value and urgency
   */
  getRecommendedShippingOption(
    rates: EnhancedShippingRate[],
    orderValue: number,
    urgency: 'economy' | 'standard' | 'express' = 'standard'
  ): EnhancedShippingRate | null {
    if (rates.length === 0) return null;

    switch (urgency) {
      case 'economy':
        // Cheapest option
        return rates.reduce((cheapest, current) => 
          current.price < cheapest.price ? current : cheapest
        );
      
      case 'express':
        // Fastest option
        return rates.reduce((fastest, current) => 
          current.estimatedDays < fastest.estimatedDays ? current : fastest
        );
      
      case 'standard':
      default:
        // Best value: balance of price and speed
        return rates.reduce((best, current) => {
          const currentScore = this.calculateValueScore(current);
          const bestScore = this.calculateValueScore(best);
          return currentScore > bestScore ? current : best;
        });
    }
  }

  /**
   * Validate shipping requirements for EasyParcel API
   */
  validateShippingInputs(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress
  ): { isValid: boolean; warnings: string[]; errors: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate items
    if (!items || items.length === 0) {
      errors.push('At least one item is required for shipping calculation');
    }

    items.forEach((item, index) => {
      if (!item.weight || item.weight <= 0) {
        errors.push(`Item ${index + 1}: Weight must be greater than 0`);
      }
      if (item.weight > 70) {
        errors.push(`Item ${index + 1}: Weight exceeds EasyParcel limit of 70kg`);
      }
      if (!item.name || item.name.length > 100) {
        errors.push(`Item ${index + 1}: Name is required and must be max 100 characters`);
      }
      if (item.shippingClass === 'HAZARDOUS') {
        warnings.push(`Item ${index + 1}: Hazardous items may have shipping restrictions`);
      }
    });

    // Validate delivery address using EasyParcel validation
    try {
      this.validateEasyParcelAddress(deliveryAddress);
    } catch (error) {
      errors.push(`Delivery address: ${error.message}`);
    }

    // Malaysian specific validations
    if (!easyParcelService.validatePostcodeForState(deliveryAddress.postalCode, deliveryAddress.state)) {
      warnings.push('Postcode may not match the selected state');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Get available service types for a destination
   */
  async getAvailableServiceTypes(deliveryState: MalaysianState): Promise<string[]> {
    const isWestMalaysia = this.isWestMalaysianState(deliveryState);
    
    // Base services available everywhere
    const availableServices = ['STANDARD'];
    
    // Express services typically available for West Malaysia
    if (isWestMalaysia) {
      availableServices.push('EXPRESS');
      
      // Major cities may have overnight service
      const overnightStates: MalaysianState[] = ['KUL', 'SEL', 'PNG', 'JOH'];
      if (overnightStates.includes(deliveryState)) {
        availableServices.push('OVERNIGHT');
      }
    }

    return availableServices;
  }

  // ===== Private Helper Methods =====

  private calculateTotals(items: ShippingCalculationItem[]) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { totalWeight, totalValue, itemCount };
  }

  private getBusinessPickupAddress(): AddressStructure {
    return {
      name: process.env.BUSINESS_NAME || 'JRM E-commerce',
      phone: process.env.BUSINESS_PHONE || '+60123456789',
      email: process.env.BUSINESS_EMAIL || 'noreply@jrmecommerce.com',
      address_line_1: process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Example',
      address_line_2: process.env.BUSINESS_ADDRESS_LINE2 || '',
      city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
      state: (process.env.BUSINESS_STATE || 'KUL') as MalaysianState,
      postcode: process.env.BUSINESS_POSTAL_CODE || '50000',
      country: 'MY',
    };
  }

  private prepareRateRequest(
    pickupAddress: AddressStructure,
    deliveryAddress: ShippingAddress,
    items: ShippingCalculationItem[],
    totalWeight: number,
    totalValue: number,
    options?: any
  ): RateRequest {
    // Convert to EasyParcel address format
    const easyParcelDeliveryAddress: AddressStructure = {
      name: `${deliveryAddress.firstName} ${deliveryAddress.lastName}`,
      company: deliveryAddress.company,
      phone: deliveryAddress.phone,
      email: deliveryAddress.email,
      address_line_1: deliveryAddress.addressLine1,
      address_line_2: deliveryAddress.addressLine2,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      postcode: deliveryAddress.postalCode,
      country: deliveryAddress.country || 'MY',
    };

    // Prepare parcel details
    const parcelDetails: ParcelDetails = {
      weight: totalWeight,
      content: items.map(item => item.name).join(', ').substring(0, 100),
      value: totalValue,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };

    // Add dimensions if available (use largest item dimensions)
    const itemWithDimensions = items.find(item => item.dimensions);
    if (itemWithDimensions?.dimensions) {
      parcelDetails.length = itemWithDimensions.dimensions.length;
      parcelDetails.width = itemWithDimensions.dimensions.width;
      parcelDetails.height = itemWithDimensions.dimensions.height;
    }

    return {
      pickup_address: pickupAddress,
      delivery_address: easyParcelDeliveryAddress,
      parcel: parcelDetails,
      service_types: options?.serviceTypes,
      insurance: options?.includeInsurance,
      cod: options?.includeCOD,
    };
  }

  private processRates(
    rates: any[],
    freeShippingEligible: boolean,
    totalValue: number,
    options?: any
  ): EnhancedShippingRate[] {
    return rates.map(rate => {
      const finalPrice = freeShippingEligible ? 0 : rate.price;
      
      // Calculate additional service pricing
      const insurancePrice = options?.includeInsurance ? 
        Math.min(totalValue * this.defaultInsuranceRate, this.maxInsuranceAmount) : 0;
      
      const codPrice = options?.includeCOD ? 3 : 0; // RM3 COD fee
      const signaturePrice = 2; // RM2 signature required fee

      return {
        courierId: rate.courier_id,
        courierName: rate.courier_name,
        serviceName: rate.service_name,
        serviceType: rate.service_type,
        originalPrice: rate.price,
        price: finalPrice,
        freeShippingApplied: freeShippingEligible,
        estimatedDays: rate.estimated_delivery_days,
        description: rate.description,
        features: {
          insuranceAvailable: rate.features.insurance_available,
          codAvailable: rate.features.cod_available,
          signatureRequiredAvailable: rate.features.signature_required_available,
        },
        insurancePrice: rate.features.insurance_available ? insurancePrice : undefined,
        codPrice: rate.features.cod_available ? codPrice : undefined,
        signaturePrice: rate.features.signature_required_available ? signaturePrice : undefined,
      };
    });
  }

  private calculateSummary(
    rates: EnhancedShippingRate[],
    totalWeight: number,
    totalValue: number,
    itemCount: number,
    freeShippingEligible: boolean
  ) {
    const cheapestRate = rates.length > 0 ? 
      Math.min(...rates.map(r => r.price)) : undefined;
    
    const fastestService = rates.length > 0 ? 
      rates.reduce((fastest, current) => 
        current.estimatedDays < fastest.estimatedDays ? current : fastest
      ).serviceName : undefined;

    const recommendedCourier = rates.length > 0 ? 
      rates.reduce((best, current) => {
        const currentScore = this.calculateValueScore(current);
        const bestScore = this.calculateValueScore(best);
        return currentScore > bestScore ? current : best;
      }).courierName : undefined;

    return {
      totalWeight,
      totalValue,
      itemCount,
      freeShippingThreshold: this.freeShippingThreshold,
      freeShippingEligible,
      cheapestRate,
      fastestService,
      recommendedCourier,
    };
  }

  private calculateValueScore(rate: EnhancedShippingRate): number {
    // Simple scoring: lower price and faster delivery = higher score
    const priceScore = 100 - (rate.price / 50) * 100; // Normalize price
    const speedScore = Math.max(100 - (rate.estimatedDays * 20), 0); // Faster = higher score
    return (priceScore + speedScore) / 2;
  }

  private validateEasyParcelAddress(address: ShippingAddress): void {
    if (!address.firstName || !address.lastName) {
      throw new Error('First name and last name are required');
    }
    
    if (!address.phone || !this.validateMalaysianPhone(address.phone)) {
      throw new Error('Valid Malaysian phone number (+60XXXXXXXXX) is required');
    }
    
    if (!address.addressLine1 || address.addressLine1.length > 100) {
      throw new Error('Address line 1 is required and must be max 100 characters');
    }
    
    if (!address.city || address.city.length > 50) {
      throw new Error('City is required and must be max 50 characters');
    }
    
    if (!address.state) {
      throw new Error('State is required');
    }
    
    if (!address.postalCode || !/^\d{5}$/.test(address.postalCode)) {
      throw new Error('Valid 5-digit postal code is required');
    }
  }

  private validateMalaysianPhone(phone: string): boolean {
    const phoneRegex = /^\+60[0-9]{8,10}$/;
    return phoneRegex.test(phone);
  }

  private getDeliveryZone(state: MalaysianState): 'west' | 'east' {
    const eastStates: MalaysianState[] = ['SBH', 'SWK', 'LBN'];
    return eastStates.includes(state) ? 'east' : 'west';
  }

  private isWestMalaysianState(state: MalaysianState): boolean {
    return this.getDeliveryZone(state) === 'west';
  }

  private getFallbackShippingRates(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress,
    orderValue: number
  ): ShippingCalculationResult {
    const { totalWeight, totalValue, itemCount } = this.calculateTotals(items);
    const freeShippingEligible = orderValue >= this.freeShippingThreshold;
    const deliveryZone = this.getDeliveryZone(deliveryAddress.state);
    
    const baseRate = deliveryZone === 'west' ? 8 : 15;
    const weightMultiplier = Math.ceil(totalWeight);

    const fallbackRates: EnhancedShippingRate[] = [
      {
        courierId: 'fallback_standard',
        courierName: 'Standard Delivery',
        serviceName: 'Economy Service',
        serviceType: 'STANDARD',
        price: freeShippingEligible ? 0 : baseRate + weightMultiplier * 2,
        originalPrice: baseRate + weightMultiplier * 2,
        estimatedDays: deliveryZone === 'west' ? 3 : 5,
        description: 'Standard delivery service',
        freeShippingApplied: freeShippingEligible,
        features: {
          insuranceAvailable: true,
          codAvailable: true,
          signatureRequiredAvailable: true,
        },
      },
    ];

    return {
      rates: fallbackRates,
      summary: {
        totalWeight,
        totalValue,
        itemCount,
        freeShippingThreshold: this.freeShippingThreshold,
        freeShippingEligible,
        cheapestRate: fallbackRates[0].price,
        fastestService: fallbackRates[0].serviceName,
        recommendedCourier: fallbackRates[0].courierName,
      },
      businessAddress: {
        name: 'JRM E-commerce',
        city: 'Kuala Lumpur',
        state: 'KUL',
        zone: 'west',
      },
      deliveryAddress: {
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zone: deliveryZone,
        serviceableByAllCouriers: true,
      },
      validationResults: {
        isValid: true,
        warnings: ['Using fallback rates - EasyParcel service unavailable'],
        errors: [],
      },
    };
  }

  // ===== Utility Methods =====

  getFreeShippingThreshold(): number {
    return this.freeShippingThreshold;
  }

  isEligibleForFreeShipping(orderValue: number): boolean {
    return orderValue >= this.freeShippingThreshold;
  }

  getMalaysianStates() {
    return easyParcelService.getMalaysianStates();
  }

  getServiceStatus() {
    return easyParcelService.getServiceStatus();
  }
}

// Export singleton instance
export const shippingCalculator = new ShippingCalculator();