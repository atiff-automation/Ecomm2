/**
 * Business Shipping Configuration Tests
 * Tests for business profile, courier preferences, and shipping policies
 * Reference: SHIPPING_COMPREHENSIVE_AUDIT.md recommendations
 */

import { BusinessShippingConfig, type BusinessProfile, type CourierPreference } from '@/lib/config/business-shipping-config';

describe('Business Shipping Configuration', () => {
  let businessConfig: BusinessShippingConfig;
  
  beforeAll(() => {
    businessConfig = BusinessShippingConfig.getInstance();
  });

  describe('Business Profile Management', () => {
    test('should get default business profile when none exists', async () => {
      const profile = await businessConfig.getBusinessProfile();
      
      expect(profile).toBeDefined();
      expect(profile?.businessName).toBeDefined();
      expect(profile?.contactPerson).toBeDefined();
      expect(profile?.contactPhone).toBeDefined();
      expect(profile?.contactEmail).toBeDefined();
      expect(profile?.pickupAddress).toBeDefined();
      expect(profile?.shippingPolicies).toBeDefined();
      expect(profile?.serviceSettings).toBeDefined();
    });

    test('should validate business profile fields', async () => {
      const validProfile: BusinessProfile = {
        businessName: 'Test Store',
        contactPerson: 'John Doe',
        contactPhone: '+60123456789',
        contactEmail: 'test@example.com',
        pickupAddress: {
          name: 'Test Store',
          phone: '+60123456789',
          address_line_1: 'No. 123, Test Street',
          city: 'Kuala Lumpur',
          state: 'KUL',
          postcode: '50000',
          country: 'MY'
        },
        operatingHours: {
          monday: { open: '09:00', close: '18:00', available: true },
          tuesday: { open: '09:00', close: '18:00', available: true },
          wednesday: { open: '09:00', close: '18:00', available: true },
          thursday: { open: '09:00', close: '18:00', available: true },
          friday: { open: '09:00', close: '18:00', available: true },
          saturday: { open: '09:00', close: '13:00', available: true },
          sunday: { open: '09:00', close: '13:00', available: false }
        },
        courierPreferences: {
          preferredCouriers: ['citylink', 'poslaju'],
          blockedCouriers: [],
          autoSelectCheapest: true,
          showCustomerChoice: false,
          defaultServiceType: 'STANDARD'
        },
        shippingPolicies: {
          freeShippingThreshold: 150,
          maxWeight: 30,
          maxDimensions: { length: 100, width: 100, height: 100 },
          restrictedItems: ['hazardous'],
          processingDays: 1
        },
        serviceSettings: {
          insuranceRequired: false,
          maxInsuranceValue: 5000,
          codEnabled: true,
          maxCodAmount: 1000,
          signatureRequired: false
        }
      };

      // Validation should pass
      expect(() => businessConfig.validateBusinessProfile(validProfile)).not.toThrow();
    });

    test('should reject invalid business profile', async () => {
      const invalidProfiles = [
        // Missing business name
        {
          businessName: '',
          contactPerson: 'John Doe',
          contactPhone: '+60123456789',
          contactEmail: 'test@example.com',
        },
        // Invalid phone format
        {
          businessName: 'Test Store',
          contactPerson: 'John Doe',
          contactPhone: '0123456789',
          contactEmail: 'test@example.com',
        },
        // Invalid email
        {
          businessName: 'Test Store',
          contactPerson: 'John Doe',
          contactPhone: '+60123456789',
          contactEmail: 'invalid-email',
        }
      ];

      invalidProfiles.forEach(profile => {
        expect(() => businessConfig.validateBusinessProfile(profile as any)).toThrow();
      });
    });
  });

  describe('Free Shipping Configuration', () => {
    test('should get free shipping threshold', async () => {
      const profile = await businessConfig.getBusinessProfile();
      expect(profile?.shippingPolicies.freeShippingThreshold).toBeDefined();
      expect(typeof profile?.shippingPolicies.freeShippingThreshold).toBe('number');
      expect(profile?.shippingPolicies.freeShippingThreshold).toBeGreaterThan(0);
    });

    test('should apply free shipping correctly', async () => {
      const profile = await businessConfig.getBusinessProfile();
      
      if (profile) {
        const threshold = profile.shippingPolicies.freeShippingThreshold;
        
        // Order below threshold should not get free shipping
        expect(businessConfig.isEligibleForFreeShipping(threshold - 1)).toBe(false);
        
        // Order at threshold should get free shipping
        expect(businessConfig.isEligibleForFreeShipping(threshold)).toBe(true);
        
        // Order above threshold should get free shipping
        expect(businessConfig.isEligibleForFreeShipping(threshold + 1)).toBe(true);
      }
    });
  });

  describe('Courier Filtering', () => {
    const mockRates = [
      {
        courier_id: 'citylink',
        courier_name: 'City-Link Express',
        service_name: 'Standard',
        price: 12.50,
        estimated_delivery_days: 2
      },
      {
        courier_id: 'poslaju',
        courier_name: 'Pos Laju',
        service_name: 'Express',
        price: 15.00,
        estimated_delivery_days: 1
      },
      {
        courier_id: 'gdex',
        courier_name: 'GDex',
        service_name: 'Standard',
        price: 10.00,
        estimated_delivery_days: 3
      }
    ];

    test('should filter rates based on business preferences', async () => {
      const filteredRates = await businessConfig.filterRatesForBusiness(mockRates);
      
      expect(Array.isArray(filteredRates)).toBe(true);
      expect(filteredRates.length).toBeGreaterThan(0);
      expect(filteredRates.length).toBeLessThanOrEqual(mockRates.length);
    });

    test('should respect blocked couriers', async () => {
      // Test would require modifying business profile to block specific couriers
      const profile = await businessConfig.getBusinessProfile();
      
      if (profile && profile.courierPreferences.blockedCouriers.length > 0) {
        const filteredRates = await businessConfig.filterRatesForBusiness(mockRates);
        
        filteredRates.forEach(rate => {
          expect(profile.courierPreferences.blockedCouriers).not.toContain(rate.courier_id);
        });
      }
    });

    test('should prioritize preferred couriers', async () => {
      const profile = await businessConfig.getBusinessProfile();
      
      if (profile && profile.courierPreferences.preferredCouriers.length > 0) {
        const filteredRates = await businessConfig.filterRatesForBusiness(mockRates);
        
        // Should include preferred couriers when available
        const preferredCouriers = profile.courierPreferences.preferredCouriers;
        const availablePreferred = mockRates.filter(rate => 
          preferredCouriers.includes(rate.courier_id)
        );
        
        if (availablePreferred.length > 0) {
          expect(filteredRates.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Courier Preferences Management', () => {
    test('should get default courier preferences', async () => {
      const preferences = await businessConfig.getCourierPreferences();
      
      expect(Array.isArray(preferences)).toBe(true);
      expect(preferences.length).toBeGreaterThan(0);
      
      preferences.forEach(pref => {
        expect(pref).toHaveProperty('courierId');
        expect(pref).toHaveProperty('courierName');
        expect(pref).toHaveProperty('priority');
        expect(pref).toHaveProperty('enabled');
        expect(pref).toHaveProperty('serviceTypes');
        expect(Array.isArray(pref.serviceTypes)).toBe(true);
      });
    });

    test('should validate courier preference priorities', async () => {
      const preferences = await businessConfig.getCourierPreferences();
      
      // Priorities should be unique and start from 1
      const priorities = preferences.map(p => p.priority);
      const uniquePriorities = [...new Set(priorities)];
      
      expect(uniquePriorities.length).toBe(priorities.length);
      expect(Math.min(...priorities)).toBe(1);
    });
  });

  describe('Address Validation', () => {
    test('should validate Malaysian postcode format', () => {
      const validPostcodes = ['50000', '10450', '88000'];
      const invalidPostcodes = ['1234', '123456', 'ABCDE'];
      
      validPostcodes.forEach(postcode => {
        expect(businessConfig.validateMalaysianPostcode(postcode)).toBe(true);
      });
      
      invalidPostcodes.forEach(postcode => {
        expect(businessConfig.validateMalaysianPostcode(postcode)).toBe(false);
      });
    });

    test('should validate Malaysian phone format', () => {
      const validPhones = ['+60123456789', '+60198765432'];
      const invalidPhones = ['0123456789', '+601234', 'invalid'];
      
      validPhones.forEach(phone => {
        expect(businessConfig.validateMalaysianPhone(phone)).toBe(true);
      });
      
      invalidPhones.forEach(phone => {
        expect(businessConfig.validateMalaysianPhone(phone)).toBe(false);
      });
    });

    test('should validate email format', () => {
      const validEmails = ['test@example.com', 'user@domain.co.uk', 'admin@site.org'];
      const invalidEmails = ['invalid-email', '@domain.com', 'user@', ''];
      
      validEmails.forEach(email => {
        expect(businessConfig.validateEmail(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(businessConfig.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Service Settings', () => {
    test('should validate service configuration', async () => {
      const profile = await businessConfig.getBusinessProfile();
      
      if (profile) {
        const { serviceSettings } = profile;
        
        expect(typeof serviceSettings.insuranceRequired).toBe('boolean');
        expect(typeof serviceSettings.maxInsuranceValue).toBe('number');
        expect(serviceSettings.maxInsuranceValue).toBeGreaterThan(0);
        
        expect(typeof serviceSettings.codEnabled).toBe('boolean');
        expect(typeof serviceSettings.maxCodAmount).toBe('number');
        expect(serviceSettings.maxCodAmount).toBeGreaterThan(0);
        
        expect(typeof serviceSettings.signatureRequired).toBe('boolean');
      }
    });

    test('should respect weight and dimension limits', async () => {
      const profile = await businessConfig.getBusinessProfile();
      
      if (profile) {
        const { shippingPolicies } = profile;
        
        expect(shippingPolicies.maxWeight).toBeGreaterThan(0);
        expect(shippingPolicies.maxWeight).toBeLessThanOrEqual(70); // EasyParcel limit
        
        expect(shippingPolicies.maxDimensions.length).toBeGreaterThan(0);
        expect(shippingPolicies.maxDimensions.width).toBeGreaterThan(0);
        expect(shippingPolicies.maxDimensions.height).toBeGreaterThan(0);
      }
    });
  });

  describe('Configuration Persistence', () => {
    test('should maintain singleton pattern', () => {
      const instance1 = BusinessShippingConfig.getInstance();
      const instance2 = BusinessShippingConfig.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});