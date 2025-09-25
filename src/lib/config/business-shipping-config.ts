/**
 * Business Shipping Configuration
 * Manages business profile, pickup addresses, and courier preferences
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 2 - Account Setup
 */

import { prisma } from '@/lib/db/prisma';
import type {
  AddressStructure,
  MalaysianState,
} from '@/lib/shipping/easyparcel-service';

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
        where: { key: 'business_shipping_profile' },
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
          updatedAt: new Date(),
        },
        create: {
          key: 'business_shipping_profile',
          value: JSON.stringify(profile),
          type: 'JSON',
        },
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
        where: { key: 'courier_preferences' },
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
  async updateCourierPreferences(
    preferences: CourierPreference[]
  ): Promise<void> {
    try {
      await prisma.systemConfig.upsert({
        where: { key: 'courier_preferences' },
        update: {
          value: JSON.stringify(preferences),
          updatedAt: new Date(),
        },
        create: {
          key: 'courier_preferences',
          value: JSON.stringify(preferences),
          type: 'JSON',
        },
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
    const courierPrefs = await this.getCourierPreferences();

    console.log('🎯 Filtering rates with preferences:', {
      totalRates: rates.length,
      totalCourierPrefs: courierPrefs.length,
      enabledCourierPrefs: courierPrefs.filter(p => p.enabled).length,
      courierPrefIds: courierPrefs.filter(p => p.enabled).map(p => p.courierId),
    });

    if (!profile || courierPrefs.length === 0) {
      return rates;
    }

    // Get enabled courier preferences only
    const enabledCourierPrefs = courierPrefs.filter(pref => pref.enabled);

    if (enabledCourierPrefs.length === 0) {
      console.log(
        '⚠️ No enabled courier preferences found, returning all rates'
      );
      return rates;
    }

    // Filter rates to only include couriers from enabled preferences
    const filteredRates = rates.filter(rate => {
      const rateCourierId = rate.courier_id || rate.courierId;
      const isEnabled = enabledCourierPrefs.some(
        pref => pref.courierId === rateCourierId
      );

      if (!isEnabled) {
        console.log(
          `🚫 Filtering out courier: ${rate.courier_name} (${rateCourierId})`
        );
      } else {
        console.log(
          `✅ Including courier: ${rate.courier_name} (${rateCourierId})`
        );
      }

      return isEnabled;
    });

    // Sort by preference priority (1 = highest priority)
    filteredRates.sort((a, b) => {
      const aPref = enabledCourierPrefs.find(
        p => p.courierId === (a.courier_id || a.courierId)
      );
      const bPref = enabledCourierPrefs.find(
        p => p.courierId === (b.courier_id || b.courierId)
      );

      const aPriority = aPref?.priority || 999;
      const bPriority = bPref?.priority || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower number = higher priority
      }

      // If same priority, sort by price (cheapest first)
      return (a.price || 0) - (b.price || 0);
    });

    console.log('🏆 Final filtered and sorted rates:', {
      count: filteredRates.length,
      topCouriers: filteredRates
        .slice(0, 3)
        .map(
          r =>
            `${r.courier_name} (Priority: ${
              enabledCourierPrefs.find(
                p => p.courierId === (r.courier_id || r.courierId)
              )?.priority || 'N/A'
            })`
        ),
    });

    // If business wants to auto-select cheapest and not show customer choice
    if (
      profile.courierPreferences.autoSelectCheapest &&
      !profile.courierPreferences.showCustomerChoice
    ) {
      // Return only the highest priority option (or cheapest if same priority)
      const bestOption = filteredRates[0];
      if (bestOption) {
        console.log(
          '🎯 Auto-selecting single option:',
          bestOption.courier_name
        );
        return [bestOption];
      }
    }

    return filteredRates;
  }

  /**
   * Get pickup address for EasyParcel rate calculations
   * Now reads from Business Profile shipping address with explicit validation
   */
  async getPickupAddress(): Promise<AddressStructure> {
    const businessProfile = await this.getBusinessProfileFromDatabase();

    // Explicit validation - no silent fallbacks
    if (!businessProfile) {
      throw new Error('BUSINESS_PROFILE_REQUIRED: Please configure your business profile in Admin Settings → Business Profile');
    }

    if (!businessProfile.shippingAddress) {
      throw new Error('SHIPPING_ADDRESS_REQUIRED: Please configure shipping address in Admin Settings → Business Profile');
    }

    // Validate shipping address completeness for EasyParcel compatibility
    this.validateShippingAddressForEasyParcel(businessProfile.shippingAddress, businessProfile);

    // Map Business Profile shipping address to EasyParcel AddressStructure format
    return this.mapShippingAddressToEasyParcel(businessProfile.shippingAddress, businessProfile);
  }

  /**
   * Get business profile directly from database (not the old shipping config)
   */
  private async getBusinessProfileFromDatabase() {
    try {
      const profile = await prisma.businessProfile.findFirst();
      return profile;
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }
  }

  /**
   * Validate shipping address for EasyParcel compatibility
   */
  private validateShippingAddressForEasyParcel(shippingAddress: any, businessProfile: any): void {
    // Validate required fields
    if (!shippingAddress.addressLine1?.trim()) {
      throw new Error('SHIPPING_ADDRESS_LINE1_REQUIRED: Address Line 1 is required in Business Profile → Shipping Address');
    }

    if (!shippingAddress.city?.trim()) {
      throw new Error('SHIPPING_CITY_REQUIRED: City is required in Business Profile → Shipping Address');
    }

    if (!shippingAddress.state?.trim()) {
      throw new Error('SHIPPING_STATE_REQUIRED: State is required in Business Profile → Shipping Address');
    }

    if (!shippingAddress.postalCode?.trim()) {
      throw new Error('SHIPPING_POSTCODE_REQUIRED: Postal Code is required in Business Profile → Shipping Address');
    }

    // Validate business contact info for pickup
    if (!businessProfile.primaryPhone?.trim()) {
      throw new Error('BUSINESS_PHONE_REQUIRED: Primary Phone is required in Business Profile for EasyParcel pickup contact');
    }

    if (!businessProfile.legalName?.trim()) {
      throw new Error('BUSINESS_NAME_REQUIRED: Legal Name is required in Business Profile for EasyParcel pickup');
    }

    // Validate EasyParcel format compatibility
    if (!this.validateMalaysianPostcode(shippingAddress.postalCode)) {
      throw new Error('INVALID_POSTCODE_FORMAT: Postal Code must be 5 digits (e.g., 50000) in Business Profile → Shipping Address');
    }

    if (!this.validateMalaysianPhone(businessProfile.primaryPhone)) {
      throw new Error('INVALID_PHONE_FORMAT: Primary Phone must be Malaysian format (+60XXXXXXXXX) in Business Profile');
    }

    // Validate address line length (EasyParcel limits)
    if (shippingAddress.addressLine1.length > 100) {
      throw new Error('ADDRESS_LINE1_TOO_LONG: Address Line 1 must be max 100 characters for EasyParcel compatibility');
    }

    if (shippingAddress.addressLine2 && shippingAddress.addressLine2.length > 100) {
      throw new Error('ADDRESS_LINE2_TOO_LONG: Address Line 2 must be max 100 characters for EasyParcel compatibility');
    }

    if (shippingAddress.city.length > 50) {
      throw new Error('CITY_TOO_LONG: City must be max 50 characters for EasyParcel compatibility');
    }
  }

  /**
   * Map Business Profile shipping address to EasyParcel AddressStructure format
   */
  private mapShippingAddressToEasyParcel(shippingAddress: any, businessProfile: any): AddressStructure {
    return {
      name: businessProfile.legalName,
      company: businessProfile.tradingName || undefined,
      phone: businessProfile.primaryPhone,
      email: businessProfile.primaryEmail || undefined,
      address_line_1: shippingAddress.addressLine1,
      address_line_2: shippingAddress.addressLine2 || undefined,
      city: shippingAddress.city,
      state: shippingAddress.state as MalaysianState,
      postcode: shippingAddress.postalCode,
      country: 'MY',
    };
  }

  /**
   * Check if business profile is properly configured for EasyParcel
   */
  async isBusinessConfigured(): Promise<boolean> {
    try {
      await this.getPickupAddress();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get configuration status with detailed error information
   */
  async getConfigurationStatus(): Promise<{
    configured: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      await this.getPickupAddress();
      return { configured: true, errors: [], warnings: [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return { configured: false, errors, warnings };
    }
  }

  /**
   * Validate business profile
   */
  private validateBusinessProfile(profile: BusinessProfile): void {
    if (!profile.businessName || profile.businessName.length > 100) {
      throw new Error(
        'Business name is required and must be max 100 characters'
      );
    }

    if (!profile.contactPerson || profile.contactPerson.length > 100) {
      throw new Error(
        'Contact person is required and must be max 100 characters'
      );
    }

    if (
      !profile.contactPhone ||
      !this.validateMalaysianPhone(profile.contactPhone)
    ) {
      throw new Error(
        'Valid Malaysian phone number is required (+60XXXXXXXXX)'
      );
    }

    if (!profile.contactEmail || !this.validateEmail(profile.contactEmail)) {
      throw new Error('Valid email address is required');
    }

    // Validate pickup address
    if (
      !profile.pickupAddress.name ||
      profile.pickupAddress.name.length > 100
    ) {
      throw new Error(
        'Pickup address name is required and must be max 100 characters'
      );
    }

    if (
      !profile.pickupAddress.address_line_1 ||
      profile.pickupAddress.address_line_1.length > 100
    ) {
      throw new Error(
        'Pickup address line 1 is required and must be max 100 characters'
      );
    }

    if (!profile.pickupAddress.city || profile.pickupAddress.city.length > 50) {
      throw new Error('Pickup city is required and must be max 50 characters');
    }

    if (
      !profile.pickupAddress.postcode ||
      !this.validateMalaysianPostcode(profile.pickupAddress.postcode)
    ) {
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
        name: process.env.BUSINESS_NAME || 'EcomJRM Store',
        phone: process.env.BUSINESS_PHONE || '+60123456789',
        address_line_1:
          process.env.BUSINESS_ADDRESS_LINE1 || 'No. 123, Jalan Technology',
        address_line_2:
          process.env.BUSINESS_ADDRESS_LINE2 || 'Level 5, Tech Plaza',
        city: process.env.BUSINESS_CITY || 'Kuala Lumpur',
        state: (process.env.BUSINESS_STATE as MalaysianState) || 'KUL',
        postcode: process.env.BUSINESS_POSTAL_CODE || '50000',
        country: 'MY',
      },

      operatingHours: {
        monday: { open: '09:00', close: '18:00', available: true },
        tuesday: { open: '09:00', close: '18:00', available: true },
        wednesday: { open: '09:00', close: '18:00', available: true },
        thursday: { open: '09:00', close: '18:00', available: true },
        friday: { open: '09:00', close: '18:00', available: true },
        saturday: { open: '09:00', close: '13:00', available: true },
        sunday: { open: '09:00', close: '13:00', available: false },
      },

      courierPreferences: {
        preferredCouriers: ['citylink', 'poslaju', 'gdex'], // Admin's preferred couriers in priority order
        blockedCouriers: [], // Block specific couriers if needed
        autoSelectCheapest: true, // Admin controls courier selection automatically
        showCustomerChoice: false, // Hide courier choice from customers
        defaultServiceType: 'STANDARD',
      },

      shippingPolicies: {
        freeShippingThreshold: parseFloat(
          process.env.FREE_SHIPPING_THRESHOLD || '150'
        ), // RM150 free shipping
        maxWeight: 30, // 30kg max per parcel
        maxDimensions: {
          length: 100, // 100cm
          width: 100, // 100cm
          height: 100, // 100cm
        },
        restrictedItems: ['hazardous', 'liquids', 'fragile_items'],
        processingDays: 1, // 1 day processing time
      },

      serviceSettings: {
        insuranceRequired: false, // Optional insurance
        maxInsuranceValue: 5000, // RM5000 max insurance
        codEnabled: true, // Allow COD
        maxCodAmount: 1000, // RM1000 max COD
        signatureRequired: false, // Optional signature
      },
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
        notes: 'Reliable for West Malaysia',
      },
      {
        courierId: 'poslaju',
        courierName: 'Pos Laju',
        priority: 2,
        enabled: true,
        serviceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
        maxWeight: 20,
        notes: 'Good nationwide coverage',
      },
      {
        courierId: 'gdex',
        courierName: 'GDex',
        priority: 3,
        enabled: true,
        serviceTypes: ['STANDARD'],
        maxWeight: 25,
        notes: 'Cost-effective option',
      },
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
