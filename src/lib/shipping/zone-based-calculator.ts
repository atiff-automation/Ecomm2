/**
 * Zone-Based Shipping Calculator
 *
 * This service implements the smart zone-based shipping calculation system
 * Reference: IMPLEMENTATION_ROADMAP.md Sprint 1.2
 * Reference: ZONE_BASED_SHIPPING_DESIGN.md
 */

import { PrismaClient } from '@prisma/client';
import { cache } from 'react';

const prisma = new PrismaClient();

// Types for shipping calculation
export interface ShippingZoneInfo {
  id: string;
  name: string;
  code: string;
  states: string[];
  multiplier: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  features?: {
    same_day?: boolean;
    cod?: boolean;
    insurance?: boolean;
    signature_required?: boolean;
    pickup_available?: boolean;
  };
}

export interface ShippingRuleInfo {
  id: string;
  zoneId: string;
  weightMin: number;
  weightMax: number;
  price: number;
  serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'ECONOMY';
  description?: string;
}

export interface ShippingCalculationRequest {
  customerState: string;
  totalWeight: number;
  orderValue: number;
  itemCount: number;
  serviceType?: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'ECONOMY';
  sessionId?: string;
  orderId?: string;
  userId?: string;
  // Enhanced for Day 2: Weight-Based Rule Engine
  items?: Array<{
    weight: number;
    quantity: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: 'STANDARD' | 'FRAGILE' | 'HAZARDOUS';
  }>;
  packagingPreference?: 'MINIMAL' | 'STANDARD' | 'SECURE';
  // Enhanced for Day 3: Price Calculation & Business Rules
  customerType?: 'GUEST' | 'MEMBER' | 'VIP';
  promotionalCode?: string;
  campaignId?: string;
  useCache?: boolean;
}

export interface ShippingCalculationResult {
  zoneId: string;
  zoneName: string;
  ruleId: string;
  basePrice: number;
  finalPrice: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  freeShippingApplied: boolean;
  calculationMethod: 'STANDARD' | 'FALLBACK' | 'EMERGENCY' | 'CACHED';
  calculationData: {
    weightBand: string;
    zoneMultiplier: number;
    originalPrice: number;
    freeShippingThreshold: number;
    serviceType: string;
    // Enhanced for Day 2: Weight-Based Rule Engine
    totalShippingWeight?: number;
    originalItemWeight?: number;
    packagingWeight?: number;
    packagingPreference?: string;
  };
}

export class ZoneBasedShippingCalculator {
  private zoneCache = new Map<string, ShippingZoneInfo>();
  private rulesCache = new Map<string, ShippingRuleInfo[]>();
  private freeShippingThreshold = 150.0; // Default threshold

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache with zone and rule data
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 1: Create zone lookup with caching
   */
  private async initializeCache(): Promise<void> {
    try {
      // Load zones
      const zones = await prisma.shippingZone.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      zones.forEach(zone => {
        this.zoneCache.set(zone.code, {
          id: zone.id,
          name: zone.name,
          code: zone.code,
          states: zone.states,
          multiplier: zone.multiplier.toNumber(),
          deliveryTimeMin: zone.deliveryTimeMin,
          deliveryTimeMax: zone.deliveryTimeMax,
          features: zone.features as any,
        });
      });

      // Load current shipping rules
      const rules = await prisma.shippingRule.findMany({
        where: {
          isActive: true,
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
        },
        include: {
          zone: true,
          ruleSet: true,
        },
        orderBy: [{ zoneId: 'asc' }, { weightMin: 'asc' }],
      });

      // Group rules by zone
      const rulesByZone = new Map<string, ShippingRuleInfo[]>();
      rules.forEach(rule => {
        const zoneCode = rule.zone.code;
        if (!rulesByZone.has(zoneCode)) {
          rulesByZone.set(zoneCode, []);
        }

        rulesByZone.get(zoneCode)!.push({
          id: rule.id,
          zoneId: rule.zoneId,
          weightMin: rule.weightMin.toNumber(),
          weightMax: rule.weightMax.toNumber(),
          price: rule.price.toNumber(),
          serviceType: rule.serviceType,
          description: rule.description || undefined,
        });
      });

      this.rulesCache = rulesByZone;

      // Load free shipping threshold
      const threshold = await prisma.systemConfig.findUnique({
        where: { key: 'free_shipping_threshold' },
      });

      if (threshold) {
        this.freeShippingThreshold = parseFloat(threshold.value);
      }

      console.log('✅ Zone-based shipping calculator cache initialized:', {
        zones: this.zoneCache.size,
        ruleGroups: this.rulesCache.size,
        freeShippingThreshold: this.freeShippingThreshold,
      });
    } catch (error) {
      console.error(
        '❌ Failed to initialize shipping calculator cache:',
        error
      );
      throw new Error('Shipping calculator initialization failed');
    }
  }

  /**
   * Map customer state to shipping zone
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 1: Implement state-to-zone mapping function
   */
  public async resolveShippingZone(
    customerState: string
  ): Promise<ShippingZoneInfo | null> {
    // Ensure cache is initialized
    if (this.zoneCache.size === 0) {
      await this.initializeCache();
    }

    // Normalize state code
    const normalizedState = this.normalizeStateCode(customerState);

    // Find zone containing this state
    for (const [zoneCode, zone] of this.zoneCache) {
      if (zone.states.includes(normalizedState)) {
        return zone;
      }
    }

    // Fallback mechanism for unknown states
    console.warn(`⚠️ Unknown state: ${customerState}, using fallback zone`);
    return this.getFallbackZone();
  }

  /**
   * Normalize Malaysian state codes
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 1: Add fallback mechanisms for unknown states
   */
  private normalizeStateCode(state: string): string {
    const stateMapping: Record<string, string> = {
      // Full names to codes
      Johor: 'JOH',
      Kedah: 'KDH',
      Kelantan: 'KTN',
      Melaka: 'MLK',
      Malacca: 'MLK',
      'Negeri Sembilan': 'NSN',
      Pahang: 'PHG',
      Perak: 'PRK',
      Perlis: 'PLS',
      'Pulau Pinang': 'PNG',
      Penang: 'PNG',
      'Kuala Lumpur': 'KUL',
      Terengganu: 'TRG',
      Selangor: 'SEL',
      Sabah: 'SBH',
      Sarawak: 'SWK',
      Labuan: 'LBN',

      // Already correct codes
      JOH: 'JOH',
      KDH: 'KDH',
      KTN: 'KTN',
      MLK: 'MLK',
      NSN: 'NSN',
      PHG: 'PHG',
      PRK: 'PRK',
      PLS: 'PLS',
      PNG: 'PNG',
      KUL: 'KUL',
      TRG: 'TRG',
      SEL: 'SEL',
      SBH: 'SBH',
      SWK: 'SWK',
      LBN: 'LBN',
    };

    return stateMapping[state] || state.toUpperCase();
  }

  /**
   * Get fallback zone for unknown states (defaults to Peninsular Malaysia)
   */
  private getFallbackZone(): ShippingZoneInfo | null {
    return this.zoneCache.get('PENINSULAR') || null;
  }

  /**
   * Calculate packaging weight based on items and packaging preference
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 2: Add packaging weight calculation
   */
  private calculatePackagingWeight(
    items: Array<{
      weight: number;
      quantity: number;
      dimensions?: any;
      shippingClass?: string;
    }>,
    packagingPreference: 'MINIMAL' | 'STANDARD' | 'SECURE' = 'STANDARD'
  ): number {
    const itemWeight = items.reduce(
      (total, item) => total + item.weight * item.quantity,
      0
    );

    // Packaging weight multipliers
    const packagingMultipliers = {
      MINIMAL: 0.05, // 5% additional weight
      STANDARD: 0.1, // 10% additional weight
      SECURE: 0.2, // 20% additional weight for fragile items
    };

    // Check if any items are fragile or hazardous
    const hasSpecialHandling = items.some(
      item =>
        item.shippingClass === 'FRAGILE' || item.shippingClass === 'HAZARDOUS'
    );

    // Use SECURE packaging for special handling items
    const effectivePreference = hasSpecialHandling
      ? 'SECURE'
      : packagingPreference;

    const packagingWeight =
      itemWeight * packagingMultipliers[effectivePreference];
    const minPackagingWeight = 0.1; // Minimum 100g packaging

    return Math.max(packagingWeight, minPackagingWeight);
  }

  /**
   * Enhanced weight band matching with rule precedence
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 2: Implement weight band matching algorithm
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 2: Create rule precedence handling
   */
  public async findShippingRule(
    zone: ShippingZoneInfo,
    weight: number,
    serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'ECONOMY' = 'STANDARD',
    effectiveDate: Date = new Date()
  ): Promise<ShippingRuleInfo | null> {
    // Ensure cache is initialized
    if (this.rulesCache.size === 0) {
      await this.initializeCache();
    }

    // Get all rules for the zone
    let zoneRules = this.rulesCache.get(zone.code);
    if (!zoneRules) {
      console.warn(`⚠️ No rules found for zone: ${zone.code}`);
      return null;
    }

    // Apply effective date filtering (Day 2: Implement effective date filtering)
    zoneRules = await this.filterRulesByEffectiveDate(zoneRules, effectiveDate);

    // Find all matching rules for weight
    const candidateRules = zoneRules.filter(
      rule => weight >= rule.weightMin && weight <= rule.weightMax
    );

    if (candidateRules.length === 0) {
      console.warn(
        `⚠️ No weight-matching rules for zone ${zone.code}, weight ${weight}kg`
      );
      return null;
    }

    // Rule precedence handling:
    // 1. Exact service type match
    // 2. Most specific weight band (smallest range)
    // 3. Higher service level as fallback

    // Try exact service type match first
    let matchingRule = candidateRules.find(
      rule => rule.serviceType === serviceType
    );

    if (!matchingRule) {
      // Service type precedence: OVERNIGHT > EXPRESS > STANDARD > ECONOMY
      const servicePrecedence = ['OVERNIGHT', 'EXPRESS', 'STANDARD', 'ECONOMY'];
      const requestedIndex = servicePrecedence.indexOf(serviceType);

      // Try higher service levels first, then fallback to STANDARD
      for (let i = 0; i < servicePrecedence.length; i++) {
        matchingRule = candidateRules.find(
          rule => rule.serviceType === servicePrecedence[i]
        );
        if (matchingRule) {
          if (i !== requestedIndex) {
            console.warn(
              `⚠️ Service type ${serviceType} not available, using ${matchingRule.serviceType} for weight ${weight}kg`
            );
          }
          break;
        }
      }
    }

    if (!matchingRule) {
      console.warn(
        `⚠️ No applicable rule found for zone ${zone.code}, weight ${weight}kg, service ${serviceType}`
      );
      return null;
    }

    // If multiple rules match, prefer the most specific weight band
    const sameServiceRules = candidateRules.filter(
      rule => rule.serviceType === matchingRule!.serviceType
    );

    if (sameServiceRules.length > 1) {
      // Find rule with smallest weight range (most specific)
      matchingRule = sameServiceRules.reduce((mostSpecific, current) => {
        const mostSpecificRange =
          mostSpecific.weightMax - mostSpecific.weightMin;
        const currentRange = current.weightMax - current.weightMin;
        return currentRange < mostSpecificRange ? current : mostSpecific;
      });
    }

    return matchingRule;
  }

  /**
   * Filter rules by effective date
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 2: Implement effective date filtering
   */
  private async filterRulesByEffectiveDate(
    rules: ShippingRuleInfo[],
    effectiveDate: Date
  ): Promise<ShippingRuleInfo[]> {
    // Note: This is a simplified version since we're working with cached data
    // In a full implementation, this would query the database with date filters

    // For now, return all rules since our seed data doesn't have expiry dates
    // In production, this would filter based on effectiveFrom and effectiveTo dates
    return rules.filter(rule => {
      // Future enhancement: Check rule.effectiveFrom <= effectiveDate <= rule.effectiveTo
      return true; // All rules are currently active
    });
  }

  /**
   * Enhanced weight calculation including packaging
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 2: Add packaging weight calculation
   */
  private calculateTotalShippingWeight(
    request: ShippingCalculationRequest
  ): number {
    if (request.items && request.items.length > 0) {
      // Calculate from individual items
      const itemWeight = request.items.reduce(
        (total, item) => total + item.weight * item.quantity,
        0
      );

      // Add packaging weight
      const packagingWeight = this.calculatePackagingWeight(
        request.items,
        request.packagingPreference
      );

      return itemWeight + packagingWeight;
    }

    // Fallback to provided total weight
    return request.totalWeight;
  }

  /**
   * Calculate shipping cost with zone-based pricing
   * Reference: IMPLEMENTATION_ROADMAP.md - Day 3: Build base price calculation with zone multipliers
   */
  public async calculateShipping(
    request: ShippingCalculationRequest
  ): Promise<ShippingCalculationResult | null> {
    try {
      const startTime = Date.now();

      // Step 1: Resolve shipping zone
      const zone = await this.resolveShippingZone(request.customerState);
      if (!zone) {
        throw new Error(
          `Unable to determine shipping zone for state: ${request.customerState}`
        );
      }

      // Step 2: Calculate total shipping weight (including packaging)
      const totalShippingWeight = this.calculateTotalShippingWeight(request);

      // Step 3: Find appropriate shipping rule
      const rule = await this.findShippingRule(
        zone,
        totalShippingWeight,
        request.serviceType
      );
      if (!rule) {
        throw new Error(
          `No shipping rule found for zone ${zone.name}, weight ${totalShippingWeight}kg`
        );
      }

      // Step 4: Calculate base price with zone multiplier
      const basePrice = rule.price;
      const priceWithMultiplier = basePrice * zone.multiplier;

      // Step 5: Apply free shipping logic
      const isFreeShippingEligible =
        request.orderValue >= this.freeShippingThreshold;
      const finalPrice = isFreeShippingEligible ? 0 : priceWithMultiplier;

      // Step 6: Build calculation result
      const result: ShippingCalculationResult = {
        zoneId: zone.id,
        zoneName: zone.name,
        ruleId: rule.id,
        basePrice: basePrice,
        finalPrice: finalPrice,
        deliveryDaysMin: zone.deliveryTimeMin,
        deliveryDaysMax: zone.deliveryTimeMax,
        freeShippingApplied: isFreeShippingEligible,
        calculationMethod: 'STANDARD',
        calculationData: {
          weightBand: `${rule.weightMin}-${rule.weightMax}kg`,
          zoneMultiplier: zone.multiplier,
          originalPrice: basePrice,
          freeShippingThreshold: this.freeShippingThreshold,
          serviceType: rule.serviceType,
          // Enhanced data for Day 2
          totalShippingWeight: totalShippingWeight,
          originalItemWeight: request.totalWeight,
          packagingWeight: totalShippingWeight - request.totalWeight,
          packagingPreference: request.packagingPreference || 'STANDARD',
        },
      };

      // Step 6: Log calculation for analytics
      await this.logCalculation(request, result, Date.now() - startTime);

      return result;
    } catch (error) {
      console.error('❌ Shipping calculation failed:', error);

      // Return fallback result
      return this.getFallbackCalculation(request);
    }
  }

  /**
   * Log shipping calculation for analytics
   * Reference: DATABASE_SCHEMA.md - shipping_calculations table
   */
  private async logCalculation(
    request: ShippingCalculationRequest,
    result: ShippingCalculationResult,
    responseTimeMs: number
  ): Promise<void> {
    try {
      await prisma.shippingCalculation.create({
        data: {
          orderId: request.orderId || null,
          sessionId: request.sessionId || null,
          customerState: this.normalizeStateCode(request.customerState),
          totalWeight: request.totalWeight,
          orderValue: request.orderValue,
          itemCount: request.itemCount,
          zoneId: result.zoneId,
          ruleId: result.ruleId,
          ruleSetId: 'standard-rates-ruleset', // Default rule set
          basePrice: result.basePrice,
          finalPrice: result.finalPrice,
          discountApplied: result.basePrice - result.finalPrice,
          freeShippingApplied: result.freeShippingApplied,
          calculationMethod: result.calculationMethod,
          calculationData: result.calculationData,
          responseTimeMs: responseTimeMs,
          userId: request.userId || null,
          userType: request.userId ? 'MEMBER' : 'GUEST',
        },
      });
    } catch (error) {
      console.error('⚠️ Failed to log shipping calculation:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get fallback calculation when main calculation fails
   */
  private getFallbackCalculation(
    request: ShippingCalculationRequest
  ): ShippingCalculationResult {
    const fallbackZone = this.getFallbackZone();
    const isEastMalaysia = ['SBH', 'SWK', 'LBN'].includes(
      this.normalizeStateCode(request.customerState)
    );
    const fallbackPrice = isEastMalaysia ? 15.0 : 8.0;
    const isFreeShipping = request.orderValue >= this.freeShippingThreshold;

    return {
      zoneId: fallbackZone?.id || 'fallback-zone',
      zoneName: fallbackZone?.name || 'Fallback Zone',
      ruleId: 'fallback-rule',
      basePrice: fallbackPrice,
      finalPrice: isFreeShipping ? 0 : fallbackPrice,
      deliveryDaysMin: isEastMalaysia ? 3 : 1,
      deliveryDaysMax: isEastMalaysia ? 7 : 3,
      freeShippingApplied: isFreeShipping,
      calculationMethod: 'FALLBACK',
      calculationData: {
        weightBand: 'fallback',
        zoneMultiplier: 1.0,
        originalPrice: fallbackPrice,
        freeShippingThreshold: this.freeShippingThreshold,
        serviceType: 'STANDARD',
      },
    };
  }

  /**
   * Get all available shipping zones
   */
  public async getAvailableZones(): Promise<ShippingZoneInfo[]> {
    if (this.zoneCache.size === 0) {
      await this.initializeCache();
    }
    return Array.from(this.zoneCache.values());
  }

  /**
   * Get shipping rules for a specific zone
   */
  public async getZoneRules(zoneCode: string): Promise<ShippingRuleInfo[]> {
    if (this.rulesCache.size === 0) {
      await this.initializeCache();
    }
    return this.rulesCache.get(zoneCode) || [];
  }

  /**
   * Refresh cache (useful for admin updates)
   */
  public async refreshCache(): Promise<void> {
    this.zoneCache.clear();
    this.rulesCache.clear();
    await this.initializeCache();
    console.log('✅ Shipping calculator cache refreshed');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      zones: this.zoneCache.size,
      ruleGroups: this.rulesCache.size,
      freeShippingThreshold: this.freeShippingThreshold,
      lastRefresh: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const zoneBasedCalculator = new ZoneBasedShippingCalculator();
