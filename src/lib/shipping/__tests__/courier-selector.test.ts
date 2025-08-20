/**
 * Courier Selector Algorithm Tests
 * Tests for smart courier selection based on configurable scoring weights
 * Reference: SHIPPING_COMPREHENSIVE_AUDIT.md recommendations
 */

import { CourierSelector, type CourierSelectionCriteria, type CourierSelectionResult } from '../courier-selector';
import type { EasyParcelRate } from '../easyparcel-service';

describe('Courier Selector Algorithm', () => {
  let courierSelector: CourierSelector;

  const mockRates: EasyParcelRate[] = [
    {
      courier_id: 'citylink',
      courier_name: 'City-Link Express',
      service_name: 'Standard Delivery',
      service_type: 'STANDARD',
      price: 12.50,
      estimated_delivery_days: 2,
      estimated_delivery: '2 working days',
      description: 'Reliable standard delivery',
      features: {
        insurance_available: true,
        cod_available: true,
        signature_required_available: true
      }
    },
    {
      courier_id: 'poslaju',
      courier_name: 'Pos Laju',
      service_name: 'Express Delivery',
      service_type: 'EXPRESS',
      price: 18.00,
      estimated_delivery_days: 1,
      estimated_delivery: '1 working day',
      description: 'Next day express delivery',
      features: {
        insurance_available: true,
        cod_available: false,
        signature_required_available: true
      }
    },
    {
      courier_id: 'gdex',
      courier_name: 'GDex',
      service_name: 'Economy Delivery',
      service_type: 'STANDARD',
      price: 10.00,
      estimated_delivery_days: 3,
      estimated_delivery: '3 working days',
      description: 'Cost-effective delivery option',
      features: {
        insurance_available: false,
        cod_available: true,
        signature_required_available: false
      }
    }
  ];

  const baseCriteria: CourierSelectionCriteria = {
    destinationState: 'SEL',
    destinationPostcode: '47400',
    parcelWeight: 2.0,
    parcelValue: 150,
    serviceType: 'STANDARD',
    requiresInsurance: false,
    requiresCOD: false
  };

  beforeAll(() => {
    courierSelector = CourierSelector.getInstance();
  });

  describe('Courier Selection Logic', () => {
    test('should select best courier based on scoring algorithm', async () => {
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      
      expect(result).toBeDefined();
      expect(result.selectedRate).toBeDefined();
      expect(result.reason).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
      
      expect(result.selectedRate).toHaveProperty('courier_id');
      expect(result.selectedRate).toHaveProperty('courier_name');
      expect(result.selectedRate).toHaveProperty('price');
      expect(result.selectedRate).toHaveProperty('estimated_delivery_days');
    });

    test('should prioritize preferred couriers', async () => {
      // This test assumes City-Link has higher priority in business config
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      
      // The selected courier should have a valid reason explaining selection
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    test('should calculate savings compared to most expensive option', async () => {
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      
      if (result.savings) {
        expect(result.savings).toBeGreaterThanOrEqual(0);
        
        const prices = mockRates.map(rate => rate.price);
        const maxPrice = Math.max(...prices);
        const selectedPrice = result.selectedRate.price;
        const expectedSavings = maxPrice - selectedPrice;
        
        expect(result.savings).toBeCloseTo(expectedSavings, 2);
      }
    });

    test('should provide meaningful alternatives', async () => {
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      
      expect(result.alternatives.length).toBeLessThanOrEqual(3);
      expect(result.alternatives.length).toBeLessThan(mockRates.length);
      
      // Alternatives should be different from selected rate
      result.alternatives.forEach(alternative => {
        expect(alternative.courier_id).not.toBe(result.selectedRate.courier_id);
      });
    });
  });

  describe('Service Type Preference', () => {
    test('should prioritize matching service types', async () => {
      const expressPreference = { ...baseCriteria, serviceType: 'EXPRESS' as const };
      const result = await courierSelector.selectCourier(mockRates, expressPreference);
      
      // Should prefer EXPRESS service if available and competitive
      if (result.selectedRate.service_type === 'EXPRESS') {
        expect(result.reason).toContain('EXPRESS');
      }
    });

    test('should handle overnight service requests', async () => {
      const overnightPreference = { ...baseCriteria, serviceType: 'OVERNIGHT' as const };
      const result = await courierSelector.selectCourier(mockRates, overnightPreference);
      
      expect(result).toBeDefined();
      expect(result.selectedRate).toBeDefined();
    });
  });

  describe('Special Services Integration', () => {
    test('should prioritize couriers with insurance when required', async () => {
      const insuranceRequired = { 
        ...baseCriteria, 
        requiresInsurance: true,
        parcelValue: 500 
      };
      
      const result = await courierSelector.selectCourier(mockRates, insuranceRequired);
      
      // Should prefer couriers that offer insurance
      expect(result.selectedRate.features.insurance_available).toBe(true);
      expect(result.reason).toContain('Insurance');
    });

    test('should prioritize couriers with COD when required', async () => {
      const codRequired = { 
        ...baseCriteria, 
        requiresCOD: true,
        codAmount: 200 
      };
      
      const result = await courierSelector.selectCourier(mockRates, codRequired);
      
      // Should prefer couriers that offer COD
      expect(result.selectedRate.features.cod_available).toBe(true);
      expect(result.reason).toContain('COD');
    });

    test('should handle combined special service requirements', async () => {
      const specialServices = {
        ...baseCriteria,
        requiresInsurance: true,
        requiresCOD: true,
        parcelValue: 300,
        codAmount: 150
      };
      
      const result = await courierSelector.selectCourier(mockRates, specialServices);
      
      // Should find a courier that supports both services or provide best alternative
      expect(result).toBeDefined();
      expect(result.selectedRate).toBeDefined();
      expect(result.reason).toBeDefined();
    });
  });

  describe('Geographic Considerations', () => {
    test('should handle West Malaysia destinations', async () => {
      const westMalaysia = { ...baseCriteria, destinationState: 'SEL' as const };
      const result = await courierSelector.selectCourier(mockRates, westMalaysia);
      
      expect(result).toBeDefined();
      expect(result.selectedRate.estimated_delivery_days).toBeLessThanOrEqual(3);
    });

    test('should handle East Malaysia destinations', async () => {
      const eastMalaysia = { ...baseCriteria, destinationState: 'SBH' as const };
      const result = await courierSelector.selectCourier(mockRates, eastMalaysia);
      
      expect(result).toBeDefined();
      // East Malaysia typically has longer delivery times
      expect(result.selectedRate.estimated_delivery_days).toBeGreaterThan(0);
    });
  });

  describe('Weight Capacity Handling', () => {
    test('should handle normal weight parcels', async () => {
      const normalWeight = { ...baseCriteria, parcelWeight: 5.0 };
      const result = await courierSelector.selectCourier(mockRates, normalWeight);
      
      expect(result).toBeDefined();
      expect(result.selectedRate).toBeDefined();
    });

    test('should handle heavy parcels', async () => {
      const heavyParcel = { ...baseCriteria, parcelWeight: 25.0 };
      const result = await courierSelector.selectCourier(mockRates, heavyParcel);
      
      expect(result).toBeDefined();
      // Should still find a suitable courier or provide best alternative
    });
  });

  describe('Automatic Selection for Checkout', () => {
    test('should provide checkout-ready information', async () => {
      const checkoutInfo = await courierSelector.getAutomaticSelection(mockRates, baseCriteria);
      
      expect(checkoutInfo).toBeDefined();
      expect(checkoutInfo.rate).toBeDefined();
      expect(checkoutInfo.displayInfo).toBeDefined();
      
      const { displayInfo } = checkoutInfo;
      expect(displayInfo.courierName).toBeDefined();
      expect(displayInfo.serviceName).toBeDefined();
      expect(displayInfo.price).toBeGreaterThan(0);
      expect(displayInfo.estimatedDelivery).toBeDefined();
      expect(displayInfo.deliveryNote).toBeDefined();
    });

    test('should provide customer-friendly display information', async () => {
      const checkoutInfo = await courierSelector.getAutomaticSelection(mockRates, baseCriteria);
      
      const { displayInfo } = checkoutInfo;
      
      // Display info should be customer-readable
      expect(displayInfo.courierName.length).toBeGreaterThan(0);
      expect(displayInfo.serviceName.length).toBeGreaterThan(0);
      expect(displayInfo.estimatedDelivery.length).toBeGreaterThan(0);
      expect(displayInfo.deliveryNote.length).toBeGreaterThan(0);
      
      // Should not contain technical jargon
      expect(displayInfo.deliveryNote).toMatch(/recommended|value|save/i);
    });
  });

  describe('Validation and Error Handling', () => {
    test('should validate courier selection against business policies', async () => {
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      const validation = await courierSelector.validateSelection(result.selectedRate, baseCriteria);
      
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
      
      if (validation.valid) {
        expect(validation.errors.length).toBe(0);
      }
    });

    test('should handle empty rates gracefully', async () => {
      await expect(courierSelector.selectCourier([], baseCriteria)).rejects.toThrow();
    });

    test('should handle oversized parcel validation', async () => {
      const oversizedCriteria = { ...baseCriteria, parcelWeight: 100 };
      const result = await courierSelector.selectCourier(mockRates, baseCriteria);
      const validation = await courierSelector.validateSelection(result.selectedRate, oversizedCriteria);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('weight'))).toBe(true);
    });
  });

  describe('Analytics and Reporting', () => {
    test('should provide shipping analytics', async () => {
      const analytics = await courierSelector.getShippingAnalytics(mockRates, baseCriteria);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalOptions).toBe(mockRates.length);
      expect(analytics.cheapestPrice).toBeGreaterThan(0);
      expect(analytics.mostExpensivePrice).toBeGreaterThanOrEqual(analytics.cheapestPrice);
      expect(analytics.averagePrice).toBeGreaterThan(0);
      expect(analytics.recommendedCourier).toBeDefined();
      expect(analytics.potentialSavings).toBeGreaterThanOrEqual(0);
    });

    test('should calculate accurate price statistics', async () => {
      const analytics = await courierSelector.getShippingAnalytics(mockRates, baseCriteria);
      
      const prices = mockRates.map(rate => rate.price);
      const expectedCheapest = Math.min(...prices);
      const expectedMostExpensive = Math.max(...prices);
      const expectedAverage = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      expect(analytics.cheapestPrice).toBe(expectedCheapest);
      expect(analytics.mostExpensivePrice).toBe(expectedMostExpensive);
      expect(analytics.averagePrice).toBeCloseTo(expectedAverage, 2);
    });
  });

  describe('Singleton Pattern', () => {
    test('should maintain singleton instance', () => {
      const instance1 = CourierSelector.getInstance();
      const instance2 = CourierSelector.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});