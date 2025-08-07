/**
 * Shipping Calculator Utility
 * Integrates with EasyParcel and handles shipping cost calculations
 */

import { easyParcelService } from './easyparcel-service';

export interface ShippingCalculationItem {
  productId: string;
  name: string;
  weight: number; // in kg
  quantity: number;
  value: number; // for insurance purposes
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface ShippingCalculationResult {
  rates: Array<{
    courierId: string;
    courierName: string;
    serviceName: string;
    price: number;
    originalPrice: number;
    estimatedDays: number;
    description?: string;
    freeShippingApplied: boolean;
  }>;
  summary: {
    totalWeight: number;
    totalValue: number;
    itemCount: number;
    freeShippingThreshold: number;
    freeShippingEligible: boolean;
    cheapestRate?: number;
    fastestService?: string;
  };
  businessAddress: {
    city: string;
    state: string;
  };
  deliveryZone: 'west' | 'east' | 'unknown';
}

export class ShippingCalculator {
  private freeShippingThreshold: number;

  constructor() {
    this.freeShippingThreshold = parseFloat(
      process.env.FREE_SHIPPING_THRESHOLD || '150'
    );
  }

  /**
   * Calculate shipping rates for order items and delivery address
   */
  async calculateShipping(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress,
    orderValue: number
  ): Promise<ShippingCalculationResult> {
    try {
      // Calculate totals
      const totalWeight = items.reduce(
        (sum, item) => sum + item.weight * item.quantity,
        0
      );
      const totalValue = items.reduce(
        (sum, item) => sum + item.value * item.quantity,
        0
      );
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      // Check if eligible for free shipping
      const freeShippingEligible = orderValue >= this.freeShippingThreshold;

      // Get business pickup address
      const pickupAddress = {
        name: process.env.BUSINESS_NAME || 'JRM E-commerce',
        phone: process.env.BUSINESS_PHONE || '+60123456789',
        email: process.env.BUSINESS_EMAIL || 'noreply@jrmecommerce.com',
        addressLine1:
          process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Example',
        addressLine2: process.env.BUSINESS_ADDRESS_LINE2 || '',
        city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
        state: process.env.BUSINESS_STATE || 'KUL',
        postalCode: process.env.BUSINESS_POSTAL_CODE || '50000',
        country: 'MY',
      };

      // Prepare EasyParcel shipping address format
      const easyParcelDeliveryAddress = {
        name: `${deliveryAddress.firstName} ${deliveryAddress.lastName}`,
        phone: '+60123456789', // Default phone - should be passed from order
        email: '', // Optional
        addressLine1: deliveryAddress.addressLine1,
        addressLine2: deliveryAddress.addressLine2 || '',
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        postalCode: deliveryAddress.postalCode,
        country: deliveryAddress.country || 'MY',
      };

      // Prepare items for EasyParcel
      const shippingItems = items.map(item => ({
        name: item.name,
        weight: item.weight,
        quantity: item.quantity,
        value: item.value,
      }));

      // Get shipping rates from EasyParcel
      const shippingRates = await easyParcelService.getShippingRates({
        pickupAddress,
        deliveryAddress: easyParcelDeliveryAddress,
        items: shippingItems,
        totalWeight,
        totalValue,
      });

      // Process rates and apply free shipping
      const processedRates = shippingRates.map(rate => ({
        ...rate,
        originalPrice: rate.price,
        price: freeShippingEligible ? 0 : rate.price,
        freeShippingApplied: freeShippingEligible,
      }));

      // Determine delivery zone
      const deliveryZone = this.getDeliveryZone(deliveryAddress.state);

      // Calculate summary statistics
      const cheapestRate =
        processedRates.length > 0
          ? Math.min(...processedRates.map(r => r.price))
          : undefined;

      const fastestService =
        processedRates.length > 0
          ? processedRates.reduce((fastest, current) =>
              current.estimatedDays < fastest.estimatedDays ? current : fastest
            ).serviceName
          : undefined;

      return {
        rates: processedRates,
        summary: {
          totalWeight,
          totalValue,
          itemCount,
          freeShippingThreshold: this.freeShippingThreshold,
          freeShippingEligible,
          ...(cheapestRate !== undefined && { cheapestRate }),
          ...(fastestService && { fastestService }),
        },
        businessAddress: {
          city: pickupAddress.city,
          state: pickupAddress.state,
        },
        deliveryZone,
      };
    } catch (error) {
      console.error('Shipping calculation error:', error);

      // Return fallback rates
      return this.getFallbackShippingRates(items, deliveryAddress, orderValue);
    }
  }

  /**
   * Get the cheapest shipping rate for order processing
   */
  async getCheapestShippingRate(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress,
    orderValue: number
  ): Promise<number> {
    try {
      const result = await this.calculateShipping(
        items,
        deliveryAddress,
        orderValue
      );
      return result.summary.cheapestRate || 0;
    } catch (error) {
      console.error('Error getting cheapest shipping rate:', error);
      return this.getFallbackShippingCost(deliveryAddress.state, orderValue);
    }
  }

  /**
   * Get fallback shipping cost based on simple rules
   */
  getFallbackShippingCost(state: string, orderValue: number): number {
    // If eligible for free shipping, return 0
    if (orderValue >= this.freeShippingThreshold) {
      return 0;
    }

    // Simple zone-based pricing
    const deliveryZone = this.getDeliveryZone(state);
    const baseRate = deliveryZone === 'west' ? 8 : 15;

    return baseRate;
  }

  /**
   * Validate Malaysian postal code for shipping
   */
  validateShippingAddress(address: ShippingAddress): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!address.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!address.lastName?.trim()) {
      errors.push('Last name is required');
    }
    if (!address.addressLine1?.trim()) {
      errors.push('Address line 1 is required');
    }
    if (!address.city?.trim()) {
      errors.push('City is required');
    }
    if (!address.state?.trim()) {
      errors.push('State is required');
    }
    if (!address.postalCode?.trim()) {
      errors.push('Postal code is required');
    }

    // Validate postal code format
    if (
      address.postalCode &&
      !/^\d{5}$/.test(address.postalCode.replace(/\s+/g, ''))
    ) {
      errors.push('Invalid postal code format (must be 5 digits)');
    }

    // Validate postal code for state if both are provided
    if (address.postalCode && address.state) {
      const isValidPostalCode = easyParcelService.validatePostalCode(
        address.postalCode,
        address.state
      );
      if (!isValidPostalCode) {
        errors.push('Postal code does not match the selected state');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available Malaysian states for shipping
   */
  getAvailableStates() {
    return easyParcelService.getMalaysianStates();
  }

  /**
   * Get free shipping threshold
   */
  getFreeShippingThreshold(): number {
    return this.freeShippingThreshold;
  }

  /**
   * Check if order qualifies for free shipping
   */
  isEligibleForFreeShipping(orderValue: number): boolean {
    return orderValue >= this.freeShippingThreshold;
  }

  // Private helper methods

  private getDeliveryZone(state: string): 'west' | 'east' | 'unknown' {
    const states = easyParcelService.getMalaysianStates();
    const stateInfo = states.find(s => s.code === state.toUpperCase());
    return stateInfo?.zone || 'unknown';
  }

  private getFallbackShippingRates(
    items: ShippingCalculationItem[],
    deliveryAddress: ShippingAddress,
    orderValue: number
  ): ShippingCalculationResult {
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + item.value * item.quantity,
      0
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const freeShippingEligible = orderValue >= this.freeShippingThreshold;
    const deliveryZone = this.getDeliveryZone(deliveryAddress.state);

    const baseRate = deliveryZone === 'west' ? 8 : 15;
    const weightMultiplier = Math.ceil(totalWeight);

    const fallbackRates = [
      {
        courierId: 'fallback_standard',
        courierName: 'Standard Delivery',
        serviceName: 'Economy Service',
        price: freeShippingEligible ? 0 : baseRate + weightMultiplier * 2,
        originalPrice: baseRate + weightMultiplier * 2,
        estimatedDays: deliveryZone === 'west' ? 3 : 5,
        description: 'Standard delivery service',
        freeShippingApplied: freeShippingEligible,
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
      },
      businessAddress: {
        city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
        state: process.env.BUSINESS_STATE || 'KUL',
      },
      deliveryZone,
    };
  }
}

// Export singleton instance
export const shippingCalculator = new ShippingCalculator();
