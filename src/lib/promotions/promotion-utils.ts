/**
 * Promotional Pricing Utilities - Malaysian E-commerce Platform
 * Handles promotional pricing calculations and membership qualification overrides
 */

import {
  EarlyAccessProduct,
  canUserAccessProduct,
  canUserAccessPromotionalPrice,
  calculateEarlyAccessStatus,
  getEarlyAccessDisplayText,
  getEarlyAccessPrice,
} from '@/lib/member/early-access-utils';

export interface PromotionData {
  isPromotional: boolean;
  promotionalPrice?: number | null;
  promotionStartDate?: Date | string | null;
  promotionEndDate?: Date | string | null;
  isQualifyingForMembership: boolean;
  memberOnlyUntil?: Date | string | null;
  earlyAccessStart?: Date | string | null;
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
  const hasPromotionalPrice =
    product.promotionalPrice !== null && product.promotionalPrice !== undefined;
  const hasValidDates = product.promotionStartDate && product.promotionEndDate;

  // Check if promotion is active
  const isActive =
    hasPromotionToggle &&
    hasPromotionalPrice &&
    hasValidDates &&
    isPromotionActive(product.promotionStartDate, product.promotionEndDate);

  // Check if promotion is scheduled for future
  const isScheduled =
    hasPromotionToggle &&
    hasPromotionalPrice &&
    hasValidDates &&
    new Date(product.promotionStartDate!) > now;

  // Check if promotion is expired
  const isExpired =
    hasPromotionToggle &&
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
    isActive: Boolean(isActive),
    isScheduled: Boolean(isScheduled),
    isExpired: Boolean(isExpired),
    daysUntilStart,
    daysUntilEnd,
    effectivePrice,
    qualifiesForMembership: Boolean(qualifiesForMembership),
    overridesQualification: Boolean(overridesQualification),
  };
}

/**
 * Get the best price for a user (considering member status, promotions, and early access)
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
  priceType: 'regular' | 'member' | 'promotional' | 'early-access';
  hasEarlyAccess?: boolean;
  earlyAccessText?: string | null;
} {
  // Check if user can access the product at all
  if (!canUserAccessProduct(product as EarlyAccessProduct, isMember)) {
    // Return regular price but user won't be able to purchase
    return {
      price: product.regularPrice,
      originalPrice: product.regularPrice,
      savings: 0,
      priceType: 'regular',
    };
  }

  // Use early access pricing if available
  const earlyAccessPrice = getEarlyAccessPrice(
    product as EarlyAccessProduct & {
      regularPrice: number;
      memberPrice: number;
    },
    isMember
  );

  if (earlyAccessPrice.hasEarlyAccess) {
    const earlyAccessStatus = calculateEarlyAccessStatus(
      product as EarlyAccessProduct
    );
    const earlyAccessText = getEarlyAccessDisplayText(earlyAccessStatus);

    return {
      price: earlyAccessPrice.price,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - earlyAccessPrice.price,
      priceType: earlyAccessPrice.priceType as
        | 'regular'
        | 'member'
        | 'promotional'
        | 'early-access',
      hasEarlyAccess: true,
      earlyAccessText,
    };
  }

  // Fall back to existing promotional pricing logic
  const promotionStatus = calculatePromotionStatus(product);

  // For members: compare promotional price vs member price and select the lowest
  if (
    isMember &&
    promotionStatus.isActive &&
    product.promotionalPrice &&
    product.memberPrice
  ) {
    const promotionalPrice = Number(product.promotionalPrice);
    const memberPrice = Number(product.memberPrice);
    const lowestPrice = Math.min(promotionalPrice, memberPrice);
    const priceType = lowestPrice === promotionalPrice ? 'promotional' : 'member';


    return {
      price: lowestPrice,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - lowestPrice,
      priceType: priceType as 'promotional' | 'member',
    };
  } else if (promotionStatus.isActive && product.promotionalPrice) {
    // Non-members get promotional price if active
    return {
      price: product.promotionalPrice,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - product.promotionalPrice,
      priceType: 'promotional',
    };
  } else if (isMember && product.memberPrice < product.regularPrice) {
    // Members get member price when no active promotion
    return {
      price: product.memberPrice,
      originalPrice: product.regularPrice,
      savings: product.regularPrice - product.memberPrice,
      priceType: 'member',
    };
  } else {
    // Regular price for non-members or when no discounts apply
    return {
      price: product.regularPrice,
      originalPrice: product.regularPrice,
      savings: 0,
      priceType: 'regular',
    };
  }
}

/**
 * Format promotion display text for UI
 */
export function getPromotionDisplayText(
  status: PromotionStatus
): string | null {
  if (status.isActive) {
    // Use simple "Promo" text as requested by user instead of time-based text
    return 'Promo';
  } else if (status.isScheduled && status.daysUntilStart !== undefined) {
    if (status.daysUntilStart === 1) {
      return 'Sale starts tomorrow';
    } else if (status.daysUntilStart <= 7) {
      return `Sale starts in ${status.daysUntilStart} days`;
    } else {
      return 'Coming soon';
    }
  } else if (status.isExpired) {
    return 'Sale ended';
  }

  return null;
}

/**
 * Utility to check if a product qualifies for membership (with promotional override)
 */
export function productQualifiesForMembership(
  product: PromotionData,
  enablePromotionalExclusion: boolean = true
): boolean {
  // If promotional exclusion is disabled, promotional products can qualify
  if (!enablePromotionalExclusion) {
    return product.isQualifyingForMembership;
  }

  // If promotional exclusion is enabled, check promotion status
  const promotionStatus = calculatePromotionStatus({
    ...product,
    regularPrice: 0, // Not needed for qualification check
    memberPrice: 0, // Not needed for qualification check
  });

  return promotionStatus.qualifiesForMembership;
}
