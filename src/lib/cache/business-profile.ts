import { prisma } from '@/lib/prisma';

/**
 * Business Profile Service (Simplified - No Redis)
 * Direct database access for business profile
 * Following @CLAUDE.md principles - centralized, efficient, systematic
 */

interface BusinessProfile {
  id: string;
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  taxRegistrationNumber?: string;
  businessType: string;
  registeredAddress: any;
  operationalAddress?: any;
  shippingAddress?: any;
  primaryPhone: string;
  secondaryPhone?: string;
  primaryEmail: string;
  supportEmail?: string;
  website?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  businessLicense?: string;
  industryCode?: string;
  establishedDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BusinessProfileCache {
  /**
   * Get business profile directly from database
   * @returns Business profile or null
   */
  static async get(): Promise<BusinessProfile | null> {
    try {
      const profile = await prisma.businessProfile.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      return profile;
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  /**
   * Set business profile (no-op for compatibility)
   * @param profile Business profile
   */
  static async set(profile: BusinessProfile, ttl?: number): Promise<void> {
    // No-op: Direct database access, no caching needed
    return;
  }

  /**
   * Invalidate business profile cache (no-op for compatibility)
   */
  static async invalidate(): Promise<void> {
    // No-op: No cache to invalidate
    return;
  }

  /**
   * Get business profile with lock (simplified to direct access)
   * @returns Business profile
   */
  static async getWithLock(): Promise<BusinessProfile | null> {
    return await this.get();
  }

  /**
   * Get cache statistics (returns defaults for compatibility)
   */
  static async getCacheStats(): Promise<{
    isConnected: boolean;
    cacheHit: boolean;
    ttl: number;
    memoryUsage?: string;
  }> {
    return {
      isConnected: false,
      cacheHit: false,
      ttl: 0
    };
  }

  /**
   * Warm up the cache (no-op for compatibility)
   */
  static async warmup(): Promise<void> {
    // No-op: No cache to warm up
    return;
  }

  /**
   * Close connection (no-op for compatibility)
   */
  static async close(): Promise<void> {
    // No-op: No connection to close
    return;
  }
}
