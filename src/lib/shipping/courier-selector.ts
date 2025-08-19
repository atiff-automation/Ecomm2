/**
 * Smart Courier Selection Algorithm
 * Automatically selects the best courier option based on business rules
 * Reference: Malaysia_Individual_1.4.0.0.pdf Section 4 - Service Selection
 */

import { businessShippingConfig, CourierPreference } from '@/lib/config/business-shipping-config';
import type { EasyParcelRate, MalaysianState } from '@/lib/shipping/easyparcel-service';

export interface CourierSelectionCriteria {
  destinationState: MalaysianState;
  destinationPostcode: string;
  parcelWeight: number;
  parcelValue: number;
  serviceType?: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  requiresInsurance?: boolean;
  requiresCOD?: boolean;
  codAmount?: number;
}

export interface CourierSelectionResult {
  selectedRate: EasyParcelRate;
  reason: string;
  alternatives: EasyParcelRate[];
  savings?: number;
  estimatedDelivery?: string;
}

export class CourierSelector {
  private static instance: CourierSelector;

  public static getInstance(): CourierSelector {
    if (!this.instance) {
      this.instance = new CourierSelector();
    }
    return this.instance;
  }

  /**
   * Select the best courier option based on business rules and criteria
   */
  async selectCourier(
    availableRates: EasyParcelRate[],
    criteria: CourierSelectionCriteria
  ): Promise<CourierSelectionResult> {
    const profile = await businessShippingConfig.getBusinessProfile();
    
    if (!profile) {
      throw new Error('Business profile not configured');
    }

    // Step 1: Filter rates by business preferences
    let filteredRates = await businessShippingConfig.filterRatesForBusiness(availableRates);
    
    if (filteredRates.length === 0) {
      throw new Error('No suitable courier options available');
    }

    // Step 2: Apply smart selection algorithm
    const scoredRates = await this.scoreRates(filteredRates, criteria, profile.courierPreferences);
    
    // Step 3: Select the highest scoring rate
    const selectedRate = scoredRates[0];
    const alternatives = scoredRates.slice(1, 4); // Top 3 alternatives
    
    // Step 4: Calculate savings compared to most expensive option
    const mostExpensive = filteredRates.reduce((max, rate) => 
      (rate.price || 0) > (max.price || 0) ? rate : max
    );
    const savings = (mostExpensive.price || 0) - (selectedRate.rate.price || 0);

    return {
      selectedRate: selectedRate.rate,
      reason: selectedRate.reason,
      alternatives: alternatives.map(alt => alt.rate),
      savings: savings > 0 ? savings : undefined,
      estimatedDelivery: selectedRate.rate.estimated_delivery
    };
  }

  /**
   * Score and rank courier rates based on multiple criteria
   */
  private async scoreRates(
    rates: EasyParcelRate[],
    criteria: CourierSelectionCriteria,
    preferences: any
  ): Promise<Array<{ rate: EasyParcelRate; score: number; reason: string }>> {
    const courierPrefs = await businessShippingConfig.getCourierPreferences();
    
    const scoredRates = rates.map(rate => {
      let score = 0;
      let reasons: string[] = [];

      // 1. Courier Priority Score (40% weight)
      const courierPref = courierPrefs.find(p => 
        p.courierId === (rate.courier_id || rate.courierId)
      );
      if (courierPref && courierPref.enabled) {
        const priorityScore = Math.max(0, (10 - courierPref.priority) * 4);
        score += priorityScore;
        reasons.push(`Priority courier (${priorityScore} pts)`);
      }

      // 2. Price Score (30% weight) - Lower price = higher score
      const maxPrice = Math.max(...rates.map(r => r.price || 0));
      const minPrice = Math.min(...rates.map(r => r.price || 0));
      const priceRange = maxPrice - minPrice;
      if (priceRange > 0) {
        const priceScore = ((maxPrice - (rate.price || 0)) / priceRange) * 30;
        score += priceScore;
        if (rate.price === minPrice) {
          reasons.push(`Cheapest option (${Math.round(priceScore)} pts)`);
        } else {
          reasons.push(`Price competitive (${Math.round(priceScore)} pts)`);
        }
      }

      // 3. Service Type Match (15% weight)
      const requestedService = criteria.serviceType || preferences.defaultServiceType;
      if (rate.service_type?.toLowerCase().includes(requestedService.toLowerCase())) {
        score += 15;
        reasons.push(`Matches ${requestedService} service (15 pts)`);
      }

      // 4. Coverage Area Score (10% weight)
      if (courierPref?.coverageAreas?.includes(criteria.destinationState)) {
        score += 10;
        reasons.push(`Optimal coverage for ${criteria.destinationState} (10 pts)`);
      }

      // 5. Weight Capacity Score (5% weight)
      const maxWeight = courierPref?.maxWeight || 30;
      if (criteria.parcelWeight <= maxWeight) {
        const weightScore = Math.min(5, (maxWeight - criteria.parcelWeight) / maxWeight * 5);
        score += weightScore;
        if (weightScore > 0) {
          reasons.push(`Weight capacity good (${Math.round(weightScore)} pts)`);
        }
      }

      // 6. Special Services Bonus
      if (criteria.requiresInsurance && rate.insurance_available) {
        score += 3;
        reasons.push('Insurance available (+3 pts)');
      }
      
      if (criteria.requiresCOD && rate.cod_available) {
        score += 3;
        reasons.push('COD available (+3 pts)');
      }

      // 7. Estimated Delivery Bonus (faster = better)
      if (rate.estimated_delivery) {
        const deliveryDays = this.parseDeliveryDays(rate.estimated_delivery);
        if (deliveryDays <= 1) {
          score += 5;
          reasons.push('Next day delivery (+5 pts)');
        } else if (deliveryDays <= 2) {
          score += 3;
          reasons.push('Fast delivery (+3 pts)');
        }
      }

      return {
        rate,
        score: Math.round(score * 10) / 10,
        reason: reasons.length > 0 ? reasons.join(', ') : 'Basic scoring'
      };
    });

    // Sort by score (highest first)
    return scoredRates.sort((a, b) => b.score - a.score);
  }

  /**
   * Parse delivery time string to extract number of days
   */
  private parseDeliveryDays(deliveryStr: string): number {
    const match = deliveryStr.match(/(\d+)\s*(?:day|hari)/i);
    return match ? parseInt(match[1]) : 3; // Default to 3 days if can't parse
  }

  /**
   * Get automatic courier selection for checkout
   * This method is called during checkout to get the selected shipping option
   */
  async getAutomaticSelection(
    availableRates: EasyParcelRate[],
    criteria: CourierSelectionCriteria
  ): Promise<{
    rate: EasyParcelRate;
    displayInfo: {
      courierName: string;
      serviceName: string;
      price: number;
      estimatedDelivery: string;
      deliveryNote: string;
    };
  }> {
    const selection = await this.selectCourier(availableRates, criteria);
    
    return {
      rate: selection.selectedRate,
      displayInfo: {
        courierName: selection.selectedRate.courier_name || 'Courier',
        serviceName: selection.selectedRate.service_name || 'Standard Delivery',
        price: selection.selectedRate.price || 0,
        estimatedDelivery: selection.selectedRate.estimated_delivery || '2-3 working days',
        deliveryNote: selection.savings 
          ? `Best value option (saves RM${selection.savings.toFixed(2)})`
          : 'Recommended shipping option'
      }
    };
  }

  /**
   * Validate if courier selection meets business policies
   */
  async validateSelection(
    rate: EasyParcelRate,
    criteria: CourierSelectionCriteria
  ): Promise<{ valid: boolean; errors: string[] }> {
    const profile = await businessShippingConfig.getBusinessProfile();
    const errors: string[] = [];

    if (!profile) {
      errors.push('Business profile not configured');
      return { valid: false, errors };
    }

    // Weight validation
    if (criteria.parcelWeight > profile.shippingPolicies.maxWeight) {
      errors.push(`Parcel weight (${criteria.parcelWeight}kg) exceeds maximum (${profile.shippingPolicies.maxWeight}kg)`);
    }

    // COD validation
    if (criteria.requiresCOD && criteria.codAmount) {
      if (!profile.serviceSettings.codEnabled) {
        errors.push('COD service is not enabled');
      } else if (criteria.codAmount > profile.serviceSettings.maxCodAmount) {
        errors.push(`COD amount (RM${criteria.codAmount}) exceeds maximum (RM${profile.serviceSettings.maxCodAmount})`);
      }
    }

    // Insurance validation
    if (criteria.requiresInsurance && criteria.parcelValue > profile.serviceSettings.maxInsuranceValue) {
      errors.push(`Insurance value (RM${criteria.parcelValue}) exceeds maximum (RM${profile.serviceSettings.maxInsuranceValue})`);
    }

    // Blocked courier validation
    const courierBlocked = profile.courierPreferences.blockedCouriers.includes(
      rate.courier_id || rate.courierId || ''
    );
    if (courierBlocked) {
      errors.push('Selected courier is blocked by business policy');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get shipping options summary for admin dashboard
   */
  async getShippingAnalytics(
    availableRates: EasyParcelRate[],
    criteria: CourierSelectionCriteria
  ): Promise<{
    totalOptions: number;
    cheapestPrice: number;
    mostExpensivePrice: number;
    averagePrice: number;
    recommendedCourier: string;
    potentialSavings: number;
  }> {
    if (availableRates.length === 0) {
      throw new Error('No rates available for analysis');
    }

    const prices = availableRates.map(rate => rate.price || 0);
    const selection = await this.selectCourier(availableRates, criteria);

    return {
      totalOptions: availableRates.length,
      cheapestPrice: Math.min(...prices),
      mostExpensivePrice: Math.max(...prices),
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      recommendedCourier: selection.selectedRate.courier_name || 'Unknown',
      potentialSavings: selection.savings || 0
    };
  }
}

// Export singleton instance
export const courierSelector = CourierSelector.getInstance();