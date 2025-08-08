/**
 * Promotional Pricing Utilities - Malaysian E-commerce Platform
 * Handles promotional pricing calculations and membership qualification overrides
 */

export interface PromotionData {
  isPromotional: boolean;
  promotionalPrice?: number | null;
  promotionStartDate?: Date | string | null;
  promotionEndDate?: Date | string | null;
  isQualifyingForMembership: boolean;
}

export interface PromotionStatus {
  isActive: boolean;
  isScheduled: boolean;
  isExpired: boolean;
  daysUntilStart?: number;
  daysUntilEnd?: number;
  effectivePrice: number;
  qualifiesForMembership: boolean;
  overridesQualification: boolean;
}

/**
 * Check if a promotion is currently active based on dates
 */
export function isPromotionActive(
  promotionStartDate?: Date | string | null,
  promotionEndDate?: Date | string | null
): boolean {
  if (!promotionStartDate || !promotionEndDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(promotionStartDate);
  const endDate = new Date(promotionEndDate);

  return now >= startDate && now <= endDate;
}

/**
 * Calculate the promotion status for a product
 */
export function calculatePromotionStatus(
  product: PromotionData & {
    regularPrice: number;
    memberPrice: number;
  }
): PromotionStatus {
  const now = new Date();
  const hasPromotionToggle = product.isPromotional;
  const hasPromotionalPrice = product.promotionalPrice !== null && product.promotionalPrice !== undefined;
  const hasValidDates = product.promotionStartDate && product.promotionEndDate;

  // Check if promotion is active
  const isActive = hasPromotionToggle && 
                   hasPromotionalPrice && 
                   hasValidDates && 
                   isPromotionActive(product.promotionStartDate, product.promotionEndDate);

  // Check if promotion is scheduled for future
  const isScheduled = hasPromotionToggle && 
                      hasPromotionalPrice && 
                      hasValidDates && 
                      new Date(product.promotionStartDate!) > now;

  // Check if promotion is expired
  const isExpired = hasPromotionToggle && 
                    hasValidDates && 
                    new Date(product.promotionEndDate!) < now;

  // Calculate days until start/end
  let daysUntilStart: number | undefined;
  let daysUntilEnd: number | undefined;

  if (product.promotionStartDate) {
    const startDate = new Date(product.promotionStartDate);
    const diffStart = startDate.getTime() - now.getTime();
    if (diffStart > 0) {
      daysUntilStart = Math.ceil(diffStart / (1000 * 60 * 60 * 24));
    }
  }

  if (product.promotionEndDate) {
    const endDate = new Date(product.promotionEndDate);
    const diffEnd = endDate.getTime() - now.getTime();
    if (diffEnd > 0) {
      daysUntilEnd = Math.ceil(diffEnd / (1000 * 60 * 60 * 24));
    }
  }

  // Calculate effective price
  let effectivePrice: number;
  if (isActive && product.promotionalPrice) {
    effectivePrice = product.promotionalPrice;
  } else {
    effectivePrice = product.regularPrice; // Default to regular price
  }

  // Calculate membership qualification
  // Rule: Active promotion overrides membership qualification
  const overridesQualification = isActive;
  const qualifiesForMembership = overridesQualification 
    ? false 
    : product.isQualifyingForMembership;

  return {
    isActive,
    isScheduled,
    isExpired,
    daysUntilStart,
    daysUntilEnd,
    effectivePrice,
    qualifiesForMembership,
    overridesQualification
  };
}

/**
 * Get the best price for a user (considering member status and promotions)
 */
export function getBestPrice(
  product: PromotionData & {
    regularPrice: number;
    memberPrice: number;
  },
  isMember: boolean = false
): {
  price: number;
  originalPrice: number;
  savings: number;
  priceType: 'regular' | 'member' | 'promotional';
} {
  const promotionStatus = calculatePromotionStatus(product);

  if (promotionStatus.isActive && product.promotionalPrice) {
    // Promotional price takes priority
    return {
      price: product.promotionalPrice,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - product.promotionalPrice,
      priceType: 'promotional'
    };
  } else if (isMember && product.memberPrice < product.regularPrice) {
    // Member price (if not overridden by promotion)
    return {
      price: product.memberPrice,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - product.memberPrice,
      priceType: 'member'
    };
  } else {
    // Regular price
    return {
      price: product.regularPrice,
      originalPrice: product.regularPrice,
      savings: 0,
      priceType: 'regular'
    };
  }
}

/**
 * Format promotion display text for UI
 */
export function getPromotionDisplayText(status: PromotionStatus): string | null {
  if (status.isActive) {
    if (status.daysUntilEnd !== undefined) {
      if (status.daysUntilEnd === 0) {
        return "Ends today!";
      } else if (status.daysUntilEnd === 1) {
        return "Ends tomorrow!";
      } else if (status.daysUntilEnd <= 7) {
        return `Ends in ${status.daysUntilEnd} days`;
      } else {
        return "Limited time offer";
      }
    }
    return "Special price";
  } else if (status.isScheduled && status.daysUntilStart !== undefined) {
    if (status.daysUntilStart === 1) {
      return "Sale starts tomorrow";
    } else if (status.daysUntilStart <= 7) {
      return `Sale starts in ${status.daysUntilStart} days`;
    } else {
      return "Coming soon";
    }
  } else if (status.isExpired) {
    return "Sale ended";
  }
  
  return null;
}

/**
 * Utility to check if a product qualifies for membership (with promotional override)
 */
export function productQualifiesForMembership(product: PromotionData): boolean {
  const promotionStatus = calculatePromotionStatus({
    ...product,
    regularPrice: 0, // Not needed for qualification check
    memberPrice: 0   // Not needed for qualification check
  });
  
  return promotionStatus.qualifiesForMembership;
}