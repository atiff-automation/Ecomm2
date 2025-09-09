/**
 * Business Profile Service for Receipt Generation
 * Centralized service to fetch business profile data for receipts
 */

import { prisma } from '@/lib/db/prisma';

export interface BusinessProfileData {
  name: string;
  tradingName?: string;
  registrationNumber: string;
  taxRegistrationNumber?: string;
  businessType: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    full: string; // formatted full address
  };
  contact: {
    primaryPhone: string;
    secondaryPhone?: string;
    primaryEmail: string;
    supportEmail?: string;
    website?: string;
  };
  banking?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  logo?: {
    url: string;
    width: number;
    height: number;
  }; // logo data if available
}

export class BusinessProfileService {
  private static instance: BusinessProfileService;
  private cachedProfile: BusinessProfileData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  public static getInstance(): BusinessProfileService {
    if (!BusinessProfileService.instance) {
      BusinessProfileService.instance = new BusinessProfileService();
    }
    return BusinessProfileService.instance;
  }

  /**
   * Get business profile for receipt generation
   */
  async getBusinessProfile(): Promise<BusinessProfileData> {
    try {
      // Return cached profile if still fresh
      if (this.cachedProfile && (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
        return this.cachedProfile;
      }

      // Fetch from database
      const profile = await prisma.businessProfile.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (!profile) {
        return this.getFallbackProfile();
      }

      const businessProfile: BusinessProfileData = {
        name: profile.legalName || profile.tradingName || 'JRM E-commerce Sdn Bhd',
        tradingName: profile.tradingName || undefined,
        registrationNumber: profile.registrationNumber || 'Not Registered',
        taxRegistrationNumber: profile.taxRegistrationNumber || undefined,
        businessType: profile.businessType || 'SDN_BHD',
        logo: profile.logoUrl ? {
          url: profile.logoUrl,
          width: profile.logoWidth || 120,
          height: profile.logoHeight || 40
        } : undefined,
        address: {
          line1: profile.registeredAddress?.addressLine1 || 'Address Line 1',
          line2: profile.registeredAddress?.addressLine2,
          city: profile.registeredAddress?.city || 'Kuala Lumpur',
          state: profile.registeredAddress?.state || 'KUL',
          postalCode: profile.registeredAddress?.postalCode || '50000',
          country: profile.registeredAddress?.country || 'Malaysia',
          full: this.formatAddress({
            addressLine1: profile.registeredAddress?.addressLine1 || 'Address Line 1',
            addressLine2: profile.registeredAddress?.addressLine2,
            city: profile.registeredAddress?.city || 'Kuala Lumpur',
            state: profile.registeredAddress?.state || 'KUL',
            postalCode: profile.registeredAddress?.postalCode || '50000',
            country: profile.registeredAddress?.country || 'Malaysia'
          })
        },
        contact: {
          primaryPhone: profile.primaryPhone || '+60 3-1234 5678',
          secondaryPhone: profile.secondaryPhone || undefined,
          primaryEmail: profile.primaryEmail || 'info@jrmecommerce.com',
          supportEmail: profile.supportEmail || undefined,
          website: profile.website || undefined
        },
        banking: profile.banking ? {
          bankName: profile.banking.bankName,
          accountNumber: profile.banking.bankAccountNumber,
          accountHolder: profile.banking.bankAccountHolder
        } : undefined
      };

      // Cache the result
      this.cachedProfile = businessProfile;
      this.lastFetchTime = Date.now();

      return businessProfile;
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return this.getFallbackProfile();
    }
  }

  /**
   * Get fallback profile when database is unavailable or empty
   */
  private getFallbackProfile(): BusinessProfileData {
    return {
      name: process.env.COMPANY_NAME || 'JRM E-commerce Sdn Bhd',
      registrationNumber: process.env.COMPANY_REGISTRATION || 'Not Registered',
      taxRegistrationNumber: process.env.COMPANY_SST_NO,
      businessType: 'SDN_BHD',
      address: {
        line1: process.env.COMPANY_ADDRESS || 'Address Line 1',
        city: 'Kuala Lumpur',
        state: 'KUL',
        postalCode: '50000',
        country: 'Malaysia',
        full: process.env.COMPANY_ADDRESS || 'Kuala Lumpur, Malaysia'
      },
      contact: {
        primaryPhone: process.env.COMPANY_PHONE || '+60 3-1234 5678',
        primaryEmail: process.env.COMPANY_EMAIL || 'info@jrmecommerce.com'
      }
    };
  }

  /**
   * Format address into a single string
   */
  private formatAddress(address: any): string {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.cachedProfile = null;
    this.lastFetchTime = 0;
  }

  /**
   * Get company info in legacy format for existing code compatibility
   */
  async getLegacyCompanyInfo() {
    const profile = await this.getBusinessProfile();
    
    return {
      name: profile.name,
      address: profile.address.full,
      phone: profile.contact.primaryPhone,
      email: profile.contact.primaryEmail,
      registrationNo: profile.registrationNumber,
      sstNo: profile.taxRegistrationNumber || 'Not Registered',
      logo: profile.logo // Include logo data
    };
  }
}

// Export singleton instance
export const businessProfileService = BusinessProfileService.getInstance();