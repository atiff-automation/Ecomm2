/**
 * Business Shipping Configuration
 * Manages business profile, pickup addresses, and courier preferences
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 2 - Account Setup
 */

import { prisma } from '@/lib/db/prisma';
import type { AddressStructure, MalaysianState } from '@/lib/shipping/easyparcel-service';

export interface BusinessProfile {
  // Business Information (PDF Section 2.1)
  businessName: string;
  businessRegistration?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  
  // Pickup Address (PDF Section 3.1 - Address Requirements)
  pickupAddress: AddressStructure;
  
  // Business Preferences
  operatingHours: {
    monday: { open: string; close: string; available: boolean };
    tuesday: { open: string; close: string; available: boolean };
    wednesday: { open: string; close: string; available: boolean };
    thursday: { open: string; close: string; available: boolean };
    friday: { open: string; close: string; available: boolean };
    saturday: { open: string; close: string; available: boolean };
    sunday: { open: string; close: string; available: boolean };
  };
  
  // Courier Preferences (PDF Section 4.2 - Service Selection)
  courierPreferences: {
    preferredCouriers: string[]; // List of preferred courier IDs
    blockedCouriers: string[]; // List of blocked courier IDs
    autoSelectCheapest: boolean; // Auto-select cheapest option
    showCustomerChoice: boolean; // Allow customer to choose courier
    defaultServiceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  };
  
  // Shipping Policies
  shippingPolicies: {
    freeShippingThreshold: number; // RM amount for free shipping
    maxWeight: number; // Maximum weight per parcel (kg)
    maxDimensions: {
      length: number; // cm
      width: number; // cm  
      height: number; // cm
    };
    restrictedItems: string[]; // List of restricted items
    processingDays: number; // Days before pickup/shipping
  };
  
  // Insurance & COD Settings
  serviceSettings: {
    insuranceRequired: boolean;
    maxInsuranceValue: number;
    codEnabled: boolean;
    maxCodAmount: number;
    signatureRequired: boolean;
  };
}

export interface CourierPreference {
  courierId: string;
  courierName: string;
  priority: number; // 1 = highest priority
  enabled: boolean;
  serviceTypes: ('STANDARD' | 'EXPRESS' | 'OVERNIGHT')[];
  maxWeight?: number;
  coverageAreas?: MalaysianState[];
  notes?: string;
}

export class BusinessShippingConfig {
  private static instance: BusinessShippingConfig;

  public static getInstance(): BusinessShippingConfig {
    if (!this.instance) {
      this.instance = new BusinessShippingConfig();
    }
    return this.instance;
  }

  /**
   * Get current business profile
   */
  async getBusinessProfile(): Promise<BusinessProfile | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'business_shipping_profile' }
      });

      if (!config) {
        return this.getDefaultBusinessProfile();
      }

      return JSON.parse(config.value);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return this.getDefaultBusinessProfile();
    }
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(profile: BusinessProfile): Promise<void> {
    try {
      // Validate the profile
      this.validateBusinessProfile(profile);

      await prisma.systemConfig.upsert({
        where: { key: 'business_shipping_profile' },
        update: {
          value: JSON.stringify(profile),
          updatedAt: new Date()
        },
        create: {
          key: 'business_shipping_profile',
          value: JSON.stringify(profile),
          type: 'JSON'
        }
      });

      console.log('✅ Business profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating business profile:', error);
      throw error;
    }
  }

  /**
   * Get courier preferences for filtering rates
   */
  async getCourierPreferences(): Promise<CourierPreference[]> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'courier_preferences' }
      });

      if (!config) {
        return this.getDefaultCourierPreferences();
      }

      return JSON.parse(config.value);
    } catch (error) {
      console.error('Error fetching courier preferences:', error);
      return this.getDefaultCourierPreferences();
    }
  }

  /**
   * Update courier preferences
   */
  async updateCourierPreferences(preferences: CourierPreference[]): Promise<void> {
    try {
      await prisma.systemConfig.upsert({
        where: { key: 'courier_preferences' },
        update: {
          value: JSON.stringify(preferences),
          updatedAt: new Date()
        },
        create: {
          key: 'courier_preferences',
          value: JSON.stringify(preferences),
          type: 'JSON'
        }
      });

      console.log('✅ Courier preferences updated successfully');
    } catch (error) {
      console.error('❌ Error updating courier preferences:', error);
      throw error;
    }
  }

  /**
   * Filter shipping rates based on business preferences
   */
  async filterRatesForBusiness(rates: any[]): Promise<any[]> {
    const profile = await this.getBusinessProfile();
    if (!profile) return rates;

    const preferences = profile.courierPreferences;
    
    let filteredRates = rates;

    // Filter by blocked couriers
    if (preferences.blockedCouriers.length > 0) {
      filteredRates = filteredRates.filter(rate => 
        !preferences.blockedCouriers.includes(rate.courier_id || rate.courierId)
      );
    }

    // Filter by preferred couriers (if specified)
    if (preferences.preferredCouriers.length > 0) {
      filteredRates = filteredRates.filter(rate => 
        preferences.preferredCouriers.includes(rate.courier_id || rate.courierId)
      );
    }

    // Sort by preference priority
    const courierPrefs = await this.getCourierPreferences();
    filteredRates.sort((a, b) => {
      const aPref = courierPrefs.find(p => p.courierId === (a.courier_id || a.courierId));
      const bPref = courierPrefs.find(p => p.courierId === (b.courier_id || b.courierId));
      
      const aPriority = aPref?.priority || 999;
      const bPriority = bPref?.priority || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by price
      return (a.price || 0) - (b.price || 0);
    });

    // If business wants to auto-select cheapest and not show customer choice
    if (preferences.autoSelectCheapest && !preferences.showCustomerChoice) {
      // Return only the cheapest option
      const cheapest = filteredRates.reduce((min, rate) => 
        (rate.price || 0) < (min.price || 0) ? rate : min
      );
      return [cheapest];
    }

    return filteredRates;
  }

  /**
   * Get pickup address for rate calculations
   */
  async getPickupAddress(): Promise<AddressStructure> {
    const profile = await this.getBusinessProfile();
    
    if (profile?.pickupAddress) {
      return profile.pickupAddress;
    }

    // Return default pickup address if not configured
    return {
      name: 'EcomJRM Store',
      phone: '+60123456789',
      address_line_1: 'No. 123, Jalan Raja Laut',
      city: 'Kuala Lumpur',
      state: 'KUL' as MalaysianState,
      postcode: '50000',
      country: 'MY'
    };
  }

  /**
   * Check if business profile is properly configured
   */
  async isBusinessConfigured(): Promise<boolean> {
    const profile = await this.getBusinessProfile();
    
    return !!(
      profile &&
      profile.businessName &&
      profile.contactPerson &&
      profile.contactPhone &&
      profile.pickupAddress.name &&
      profile.pickupAddress.address_line_1 &&
      profile.pickupAddress.city &&
      profile.pickupAddress.state &&
      profile.pickupAddress.postcode
    );
  }

  /**
   * Validate business profile
   */
  private validateBusinessProfile(profile: BusinessProfile): void {
    if (!profile.businessName || profile.businessName.length > 100) {
      throw new Error('Business name is required and must be max 100 characters');
    }

    if (!profile.contactPerson || profile.contactPerson.length > 100) {
      throw new Error('Contact person is required and must be max 100 characters');
    }

    if (!profile.contactPhone || !this.validateMalaysianPhone(profile.contactPhone)) {
      throw new Error('Valid Malaysian phone number is required (+60XXXXXXXXX)');
    }

    if (!profile.contactEmail || !this.validateEmail(profile.contactEmail)) {
      throw new Error('Valid email address is required');
    }

    // Validate pickup address
    if (!profile.pickupAddress.name || profile.pickupAddress.name.length > 100) {
      throw new Error('Pickup address name is required and must be max 100 characters');
    }

    if (!profile.pickupAddress.address_line_1 || profile.pickupAddress.address_line_1.length > 100) {
      throw new Error('Pickup address line 1 is required and must be max 100 characters');
    }

    if (!profile.pickupAddress.city || profile.pickupAddress.city.length > 50) {
      throw new Error('Pickup city is required and must be max 50 characters');
    }

    if (!profile.pickupAddress.postcode || !this.validateMalaysianPostcode(profile.pickupAddress.postcode)) {
      throw new Error('Valid 5-digit Malaysian postcode is required');
    }
  }

  /**
   * Get default business profile for initial setup
   */
  private getDefaultBusinessProfile(): BusinessProfile {
    return {
      businessName: 'EcomJRM Store',
      contactPerson: 'Store Manager',
      contactPhone: '+60123456789',
      contactEmail: 'store@ecomjrm.com',
      
      pickupAddress: {
        name: 'EcomJRM Store',
        phone: '+60123456789',
        address_line_1: 'No. 123, Jalan Raja Laut',
        address_line_2: 'Level 2, Block A',
        city: 'Kuala Lumpur',
        state: 'KUL' as MalaysianState,
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
        preferredCouriers: [], // Empty means all couriers allowed
        blockedCouriers: [], // Block specific couriers if needed
        autoSelectCheapest: false, // Let customers choose
        showCustomerChoice: true, // Show all available options
        defaultServiceType: 'STANDARD'
      },
      
      shippingPolicies: {
        freeShippingThreshold: 150, // RM150 free shipping
        maxWeight: 30, // 30kg max per parcel
        maxDimensions: {
          length: 100, // 100cm
          width: 100,  // 100cm
          height: 100  // 100cm
        },
        restrictedItems: ['hazardous', 'liquids', 'fragile_items'],
        processingDays: 1 // 1 day processing time
      },
      
      serviceSettings: {
        insuranceRequired: false, // Optional insurance
        maxInsuranceValue: 5000, // RM5000 max insurance
        codEnabled: true, // Allow COD
        maxCodAmount: 1000, // RM1000 max COD
        signatureRequired: false // Optional signature
      }
    };
  }

  /**
   * Get default courier preferences
   */
  private getDefaultCourierPreferences(): CourierPreference[] {
    return [
      {
        courierId: 'citylink',
        courierName: 'City-Link Express',
        priority: 1,
        enabled: true,
        serviceTypes: ['STANDARD', 'EXPRESS'],
        maxWeight: 30,
        notes: 'Reliable for West Malaysia'
      },
      {
        courierId: 'poslaju',
        courierName: 'Pos Laju',
        priority: 2,
        enabled: true,
        serviceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
        maxWeight: 20,
        notes: 'Good nationwide coverage'
      },
      {
        courierId: 'gdex',
        courierName: 'GDex',
        priority: 3,
        enabled: true,
        serviceTypes: ['STANDARD'],
        maxWeight: 25,
        notes: 'Cost-effective option'
      }
    ];
  }

  /**
   * Validation helpers
   */
  private validateMalaysianPhone(phone: string): boolean {
    const phoneRegex = /^\+60[0-9]{8,10}$/;
    return phoneRegex.test(phone);
  }

  private validateMalaysianPostcode(postcode: string): boolean {
    const postcodeRegex = /^\d{5}$/;
    return postcodeRegex.test(postcode);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const businessShippingConfig = BusinessShippingConfig.getInstance();