/**
 * Server-only Malaysian Postcode Service
 * This file contains the server-side postcode logic with database and Redis access
 */

import { prisma } from '@/lib/db/prisma';
import type { MalaysianState } from './easyparcel-service';

// Server-only Redis import
let Redis: any;
if (typeof window === 'undefined') {
  try {
    Redis = require('ioredis');
  } catch (error) {
    console.warn('Redis not available');
  }
}

export interface LocationData {
  state: MalaysianState;
  stateCode: string;
  stateName: string;
  city: string;
  area?: string;
  zone: 'west' | 'east';
}

export interface ValidationResult {
  valid: boolean;
  formatted?: string;
  location?: LocationData;
  error?: string;
}

/**
 * Server-only Malaysian Postcode Service
 */
export class ServerPostcodeService {
  private static instance: ServerPostcodeService;
  private redis?: any;
  private isRedisAvailable = false;
  private fallbackCache = new Map<string, { data: LocationData; expires: number }>();

  // State mappings for backward compatibility
  private readonly stateCodeMappings: Record<string, MalaysianState> = {
    'JHR': 'JOH',
    'KDH': 'KDH', 
    'KTN': 'KTN',
    'KUL': 'KUL',
    'LBN': 'LBN',
    'MLK': 'MLK',
    'NSN': 'NSN',
    'PHG': 'PHG',
    'PJY': 'PJY',
    'PLS': 'PLS',
    'PNG': 'PNG',
    'PRK': 'PRK',
    'SBH': 'SBH',
    'SGR': 'SEL',
    'SRW': 'SWK',
    'TRG': 'TRG'
  };

  private constructor() {
    this.initRedis();
  }

  private initRedis() {
    if (Redis) {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 2000,
        });

        this.redis.on('error', () => {
          this.isRedisAvailable = false;
        });

        this.redis.on('connect', () => {
          this.isRedisAvailable = true;
        });
      } catch (error) {
        this.isRedisAvailable = false;
      }
    }
  }

  public static getInstance(): ServerPostcodeService {
    if (!this.instance) {
      this.instance = new ServerPostcodeService();
    }
    return this.instance;
  }

  async validatePostcode(postcode: string): Promise<ValidationResult> {
    const cleaned = postcode.replace(/\s/g, '');

    if (!/^\d{5}$/.test(cleaned)) {
      return {
        valid: false,
        error: 'Postcode must be 5 digits',
      };
    }

    try {
      const location = await this.getLocationByPostcode(cleaned);

      if (!location) {
        return {
          valid: false,
          formatted: cleaned,
          error: 'Invalid Malaysian postcode',
        };
      }

      return {
        valid: true,
        formatted: cleaned,
        location,
      };
    } catch (error) {
      console.error('Error validating postcode:', error);
      return {
        valid: false,
        formatted: cleaned,
        error: 'Service temporarily unavailable',
      };
    }
  }

  async getLocationByPostcode(postcode: string): Promise<LocationData | null> {
    try {
      const cleaned = postcode.replace(/\s/g, '');
      if (!/^\d{5}$/.test(cleaned)) {
        return null;
      }

      // Check cache first
      const cacheKey = `postcode:${cleaned}`;
      if (this.isRedisAvailable && this.redis) {
        try {
          const cached = await this.redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached) as LocationData;
          }
        } catch (error) {
          // Fall through to fallback cache
        }
      }

      // Check fallback cache
      const fallbackCached = this.fallbackCache.get(cleaned);
      if (fallbackCached && fallbackCached.expires > Date.now()) {
        return fallbackCached.data;
      }

      // Query database
      const postcodeData = await prisma.malaysianPostcode.findFirst({
        where: { postcode: cleaned },
        include: { state: true }
      });

      if (!postcodeData) {
        return null;
      }

      const legacyStateCode = this.stateCodeMappings[postcodeData.stateCode] || postcodeData.stateCode;

      const locationData: LocationData = {
        state: legacyStateCode as MalaysianState,
        stateCode: legacyStateCode,
        stateName: postcodeData.state.name,
        city: postcodeData.district,
        zone: this.getZone(postcodeData.stateCode),
      };

      // Cache the result
      const expires = Date.now() + 3600000; // 1 hour
      this.fallbackCache.set(cleaned, { data: locationData, expires });

      if (this.isRedisAvailable && this.redis) {
        try {
          await this.redis.setex(cacheKey, 3600, JSON.stringify(locationData));
        } catch (error) {
          // Redis failed, but we have fallback cache
        }
      }

      return locationData;
    } catch (error) {
      console.error('Error fetching postcode location:', error);
      return null;
    }
  }

  async getAllStates(): Promise<Array<{
    code: string;
    name: string;
    zone: 'west' | 'east';
    legacyCode: MalaysianState;
  }>> {
    try {
      const states = await prisma.malaysianState.findMany({
        orderBy: { name: 'asc' }
      });

      return states.map(state => ({
        code: state.id,
        name: state.name,
        zone: this.getZone(state.id),
        legacyCode: (this.stateCodeMappings[state.id] || state.id) as MalaysianState
      }));
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  private getZone(stateCode: string): 'west' | 'east' {
    const eastMalaysiaStates = ['SBH', 'SRW', 'LBN'];
    return eastMalaysiaStates.includes(stateCode) ? 'east' : 'west';
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
    if (this.redis) {
      await this.redis.quit();
    }
  }
}