import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';

/**
 * Business Profile Caching Service
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
  private static redis: Redis | null = null;
  private static readonly CACHE_KEY = 'business:profile:active';
  private static readonly TTL = 3600; // 1 hour in seconds
  private static readonly LOCK_KEY = 'business:profile:lock';
  private static readonly LOCK_TTL = 30; // 30 seconds

  /**
   * Initialize Redis connection
   */
  private static getRedis(): Redis | null {
    try {
      if (!this.redis && process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        this.redis.on('error', (error) => {
          console.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
          console.log('Redis connected for business profile cache');
        });
      }
      return this.redis;
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  /**
   * Get business profile from cache or database
   * @returns Business profile or null
   */
  static async get(): Promise<BusinessProfile | null> {
    const redis = this.getRedis();

    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get(this.CACHE_KEY);
        if (cached) {
          const profile = JSON.parse(cached);
          // Convert date strings back to Date objects
          if (profile.establishedDate) {
            profile.establishedDate = new Date(profile.establishedDate);
          }
          if (profile.createdAt) {
            profile.createdAt = new Date(profile.createdAt);
          }
          if (profile.updatedAt) {
            profile.updatedAt = new Date(profile.updatedAt);
          }
          return profile;
        }
      } catch (error) {
        console.error('Cache get error:', error);
        // Fall through to database
      }
    }

    // Get from database and cache it
    try {
      const profile = await prisma.businessProfile.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (profile) {
        await this.set(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  /**
   * Set business profile in cache
   * @param profile Business profile to cache
   */
  static async set(profile: BusinessProfile): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      await redis.setex(
        this.CACHE_KEY,
        this.TTL,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate business profile cache
   */
  static async invalidate(): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      await redis.del(this.CACHE_KEY);
      console.log('Business profile cache invalidated');
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Get business profile with cache-aside pattern and locking
   * @returns Business profile with high consistency
   */
  static async getWithLock(): Promise<BusinessProfile | null> {
    const redis = this.getRedis();
    if (!redis) {
      return await this.getDirect();
    }

    // Try to acquire lock
    const lockAcquired = await this.acquireLock();
    if (!lockAcquired) {
      // If can't acquire lock, try cache first then database
      return await this.get();
    }

    try {
      // Double-check cache after acquiring lock
      const cached = await redis.get(this.CACHE_KEY);
      if (cached) {
        const profile = JSON.parse(cached);
        return this.deserializeDates(profile);
      }

      // Not in cache, get from database
      const profile = await this.getDirect();
      if (profile) {
        await this.set(profile);
      }

      return profile;
    } finally {
      await this.releaseLock();
    }
  }

  /**
   * Get business profile directly from database
   */
  private static async getDirect(): Promise<BusinessProfile | null> {
    try {
      return await prisma.businessProfile.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Direct database query error:', error);
      return null;
    }
  }

  /**
   * Acquire distributed lock for cache operations
   */
  private static async acquireLock(): Promise<boolean> {
    const redis = this.getRedis();
    if (!redis) return false;

    try {
      const result = await redis.set(
        this.LOCK_KEY,
        '1',
        'EX',
        this.LOCK_TTL,
        'NX'
      );
      return result === 'OK';
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  private static async releaseLock(): Promise<void> {
    const redis = this.getRedis();
    if (!redis) return;

    try {
      await redis.del(this.LOCK_KEY);
    } catch (error) {
      console.error('Lock release error:', error);
    }
  }

  /**
   * Deserialize date fields from JSON
   */
  private static deserializeDates(profile: any): BusinessProfile {
    if (profile.establishedDate) {
      profile.establishedDate = new Date(profile.establishedDate);
    }
    if (profile.createdAt) {
      profile.createdAt = new Date(profile.createdAt);
    }
    if (profile.updatedAt) {
      profile.updatedAt = new Date(profile.updatedAt);
    }
    return profile;
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    isConnected: boolean;
    cacheHit: boolean;
    ttl: number;
    memoryUsage?: string;
  }> {
    const redis = this.getRedis();
    if (!redis) {
      return { isConnected: false, cacheHit: false, ttl: 0 };
    }

    try {
      const exists = await redis.exists(this.CACHE_KEY);
      const ttl = await redis.ttl(this.CACHE_KEY);
      
      return {
        isConnected: true,
        cacheHit: exists === 1,
        ttl: ttl,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { isConnected: false, cacheHit: false, ttl: 0 };
    }
  }

  /**
   * Warm up the cache by preloading business profile
   */
  static async warmup(): Promise<void> {
    console.log('Warming up business profile cache...');
    await this.get();
  }

  /**
   * Close Redis connection (for cleanup)
   */
  static async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}