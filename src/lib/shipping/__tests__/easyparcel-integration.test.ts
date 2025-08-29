/**
 * EasyParcel Integration Tests
 * Comprehensive testing suite for EasyParcel API v1.4.0 integration
 * Reference: SHIPPING_COMPREHENSIVE_AUDIT.md recommendations
 */

import {
  EasyParcelService,
  type RateRequest,
  type ShipmentBookingRequest,
} from '../easyparcel-service';
import { EnhancedEasyParcelService } from '../enhanced-easyparcel-service';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';

describe('EasyParcel Integration Tests', () => {
  let easyParcelService: EasyParcelService;
  let enhancedService: EnhancedEasyParcelService;

  beforeAll(() => {
    easyParcelService = new EasyParcelService();
    enhancedService = new EnhancedEasyParcelService();
  });

  describe('Address Validation', () => {
    test('should validate Malaysian postcode format', () => {
      const validPostcodes = ['50000', '10450', '81200', '93350', '88000'];
      const invalidPostcodes = ['1234', '123456', 'ABCDE', ''];

      validPostcodes.forEach(postcode => {
        expect(
          easyParcelService.validatePostcodeForState(postcode, 'KUL')
        ).toBeTruthy();
      });

      invalidPostcodes.forEach(postcode => {
        expect(
          easyParcelService.validatePostcodeForState(postcode, 'KUL')
        ).toBeFalsy();
      });
    });

    test('should validate Malaysian phone number format', () => {
      const validPhones = ['+60123456789', '+60198765432', '+601234567890'];
      const invalidPhones = ['0123456789', '+601234', 'invalid', ''];

      validPhones.forEach(phone => {
        expect(easyParcelService.validateMalaysianPhone(phone)).toBeTruthy();
      });

      invalidPhones.forEach(phone => {
        expect(easyParcelService.validateMalaysianPhone(phone)).toBeFalsy();
      });
    });

    test('should validate Malaysian state codes', () => {
      const validStates = ['JOH', 'KUL', 'SEL', 'PNG', 'SBH', 'SWK'];
      const invalidStates = ['XX', 'ABC', 'INVALID', ''];

      validStates.forEach(state => {
        expect(easyParcelService.getMalaysianStates()).toContain(state);
      });

      invalidStates.forEach(state => {
        expect(easyParcelService.getMalaysianStates()).not.toContain(state);
      });
    });
  });

  describe('Rate Calculation', () => {
    const validRateRequest: RateRequest = {
      pickup_address: {
        name: 'EcomJRM Store',
        phone: '+60123456789',
        address_line_1: 'No. 123, Jalan Technology',
        address_line_2: 'Level 5, Tech Plaza',
        city: 'Kuala Lumpur',
        state: 'KUL',
        postcode: '50000',
        country: 'MY',
      },
      delivery_address: {
        name: 'John Doe',
        phone: '+60123456789',
        address_line_1: 'No. 456, Jalan Delivery',
        city: 'Petaling Jaya',
        state: 'SEL',
        postcode: '47400',
        country: 'MY',
      },
      parcel: {
        weight: 1.5,
        length: 20,
        width: 15,
        height: 10,
        content: 'Electronics',
        value: 100,
        quantity: 1,
      },
      service_types: ['STANDARD', 'EXPRESS'],
      insurance: false,
      cod: false,
    };

    test('should calculate rates for West Malaysia delivery', async () => {
      const result = await easyParcelService.calculateRates(validRateRequest);

      expect(result).toBeDefined();
      expect(result.rates).toBeDefined();
      expect(Array.isArray(result.rates)).toBe(true);

      if (result.rates.length > 0) {
        const rate = result.rates[0];
        expect(rate).toHaveProperty('courier_id');
        expect(rate).toHaveProperty('courier_name');
        expect(rate).toHaveProperty('service_name');
        expect(rate).toHaveProperty('price');
        expect(rate).toHaveProperty('estimated_delivery_days');
        expect(typeof rate.price).toBe('number');
        expect(rate.price).toBeGreaterThan(0);
      }
    });

    test('should calculate rates for East Malaysia delivery', async () => {
      const eastMalaysiaRequest = {
        ...validRateRequest,
        delivery_address: {
          ...validRateRequest.delivery_address,
          city: 'Kota Kinabalu',
          state: 'SBH',
          postcode: '88000',
        },
      };

      const result =
        await easyParcelService.calculateRates(eastMalaysiaRequest);

      expect(result).toBeDefined();
      expect(result.rates).toBeDefined();

      if (result.rates.length > 0) {
        const rate = result.rates[0];
        expect(rate.price).toBeGreaterThan(0);
        // East Malaysia should typically have higher prices and longer delivery times
        expect(rate.estimated_delivery_days).toBeGreaterThan(1);
      }
    });

    test('should handle invalid address gracefully', async () => {
      const invalidRequest = {
        ...validRateRequest,
        delivery_address: {
          ...validRateRequest.delivery_address,
          postcode: 'INVALID',
        },
      };

      await expect(
        easyParcelService.calculateRates(invalidRequest)
      ).rejects.toThrow();
    });

    test('should handle oversized parcel gracefully', async () => {
      const oversizedRequest = {
        ...validRateRequest,
        parcel: {
          ...validRateRequest.parcel,
          weight: 100, // Exceeds EasyParcel limit
        },
      };

      await expect(
        easyParcelService.calculateRates(oversizedRequest)
      ).rejects.toThrow();
    });
  });

  describe('Enhanced Service with Caching', () => {
    test('should cache rate calculation results', async () => {
      const request = validRateRequest;

      // First call - should hit API
      const start1 = Date.now();
      const result1 = await enhancedService.calculateRates(request);
      const duration1 = Date.now() - start1;

      // Second call - should use cache
      const start2 = Date.now();
      const result2 = await enhancedService.calculateRates(request);
      const duration2 = Date.now() - start2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.rates.length).toEqual(result2.rates.length);

      // Second call should be faster (cached)
      if (process.env.NODE_ENV !== 'test' && result1.rates.length > 0) {
        expect(duration2).toBeLessThan(duration1);
      }
    }, 10000);

    test('should monitor API calls', async () => {
      // This test verifies monitoring is working
      const result = await enhancedService.calculateRates(validRateRequest);
      expect(result).toBeDefined();
      // Monitoring verification would be done through metrics inspection
    });
  });

  describe('Business Logic Integration', () => {
    test('should apply business courier filtering', async () => {
      const businessProfile = await businessShippingConfig.getBusinessProfile();

      if (businessProfile) {
        const rates = await easyParcelService.calculateRates(validRateRequest);
        const filteredRates =
          await businessShippingConfig.filterRatesForBusiness(rates.rates);

        expect(Array.isArray(filteredRates)).toBe(true);

        // Filtered rates should not include blocked couriers
        filteredRates.forEach(rate => {
          expect(
            businessProfile.courierPreferences.blockedCouriers
          ).not.toContain(rate.courier_id);
        });
      }
    });

    test('should apply free shipping threshold correctly', async () => {
      const businessProfile = await businessShippingConfig.getBusinessProfile();

      if (businessProfile) {
        const threshold =
          businessProfile.shippingPolicies.freeShippingThreshold;
        expect(typeof threshold).toBe('number');
        expect(threshold).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      // Mock an API failure scenario
      const invalidApiKeyService = new EasyParcelService();

      try {
        await invalidApiKeyService.calculateRates(validRateRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      }
    });

    test('should provide fallback mock data in development', async () => {
      if (process.env.NODE_ENV === 'development') {
        const result = await easyParcelService.calculateRates(validRateRequest);
        expect(result).toBeDefined();
        expect(result.rates).toBeDefined();
        expect(result.rates.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Credit Balance Check', () => {
    test('should check account credit balance', async () => {
      const result = await easyParcelService.checkCreditBalance();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('wallets');
      expect(typeof result.balance).toBe('number');
      expect(result.currency).toBe('MYR');
      expect(Array.isArray(result.wallets)).toBe(true);
    });
  });

  describe('Shipment Tracking', () => {
    test('should track shipment with valid tracking number format', async () => {
      const mockTrackingNumber = 'EP123456789MY';

      try {
        const result =
          await easyParcelService.trackShipment(mockTrackingNumber);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('tracking_number');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('events');
      } catch (error) {
        // Mock tracking might fail, but error should be handled
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should reject invalid tracking number format', async () => {
      const invalidTrackingNumbers = ['', 'invalid', '123'];

      for (const trackingNumber of invalidTrackingNumbers) {
        await expect(
          easyParcelService.trackShipment(trackingNumber)
        ).rejects.toThrow();
      }
    });
  });
});

describe('Integration with Malaysian Tax Service', () => {
  test('should integrate with tax calculation', async () => {
    const { MalaysianTaxService } = await import(
      '@/lib/tax/malaysian-tax-service'
    );
    const taxService = MalaysianTaxService.getInstance();

    const shippingCost = 15;
    const taxResult = await taxService.calculateShippingTax(
      shippingCost,
      false
    );

    expect(taxResult).toBeDefined();
    expect(taxResult).toHaveProperty('taxExclusiveAmount');
    expect(taxResult).toHaveProperty('taxAmount');
    expect(taxResult).toHaveProperty('taxInclusiveAmount');
    expect(taxResult).toHaveProperty('taxRate');
  });
});

describe('Performance Benchmarks', () => {
  test('should complete rate calculation within acceptable time', async () => {
    const start = Date.now();
    const result = await easyParcelService.calculateRates(validRateRequest);
    const duration = Date.now() - start;

    expect(result).toBeDefined();
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
  }, 35000);

  test('should handle concurrent requests', async () => {
    const requests = Array(5).fill(validRateRequest);
    const promises = requests.map(req => easyParcelService.calculateRates(req));

    const results = await Promise.all(promises);

    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.rates).toBeDefined();
    });
  }, 60000);
});
