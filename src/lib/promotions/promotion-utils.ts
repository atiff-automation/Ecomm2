/**
 * Promotional Pricing Utilities - Malaysian E-commerce Platform
 * Handles promotional pricing calculations and membership qualification overrides
 *
 * Date Handling (Fixed):
 * - End dates are set to 23:59:59.999 (end of day) by CustomDateRangePicker
 * - Countdown uses calendar days, not time-based Math.ceil()
 * - "Ends today" now correctly shows on the final day of promotion
 * - Day counts are accurate to user expectations
 *
 * Example: Promotion ends Oct 5, 2025 at 23:59:59
 * - Oct 3 at any time → "Ends in 2 days" (Oct 4, 5)
 * - Oct 4 at any time → "Ends tomorrow"
 * - Oct 5 at any time → "Ends today"
 * - Oct 6 onwards → Promotion expired
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
 * Calculate the number of complete calendar days between two dates
 * Returns 0 if dates are on the same day, 1 if one day apart, etc.
 *
 * Example:
 * - Oct 3, 10:00 AM → Oct 5, 11:59 PM = 2 days (Oct 4, Oct 5)
 * - Oct 3, 10:00 AM → Oct 3, 11:00 PM = 0 days (same day)
 *
 * Note: Uses floor() not ceil() to count complete calendar days
 */
function getCalendarDaysDifference(fromDate: Date, toDate: Date): number {
  // Normalize both dates to midnight to compare calendar days, not time
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);

  const diffTime = to.getTime() - from.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if two dates are on the same calendar day
 * Ignores time component - only compares year, month, and day
 *
 * Example:
 * - Oct 5, 1:00 AM vs Oct 5, 11:00 PM = true (same day)
 * - Oct 5, 11:59 PM vs Oct 6, 12:00 AM = false (different days)
 */
function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
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

  // Calculate days until start/end using calendar days
  let daysUntilStart: number | undefined;
  let daysUntilEnd: number | undefined;

  if (product.promotionStartDate) {
    const startDate = new Date(product.promotionStartDate);
    if (startDate > now) {
      // Promotion hasn't started yet
      if (isSameCalendarDay(now, startDate)) {
        daysUntilStart = 0; // Starts today (later in the day)
      } else {
        daysUntilStart = getCalendarDaysDifference(now, startDate);
      }
    }
  }

  if (product.promotionEndDate) {
    const endDate = new Date(product.promotionEndDate);
    if (endDate >= now) {
      // Promotion is still active or ends today
      if (isSameCalendarDay(now, endDate)) {
        daysUntilEnd = 0; // Ends today
      } else {
        daysUntilEnd = getCalendarDaysDifference(now, endDate);
      }
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
    const priceType =
      lowestPrice === promotionalPrice ? 'promotional' : 'member';

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
 * Now uses calendar-day based calculations for accurate countdowns
 */
export function getPromotionDisplayText(
  status: PromotionStatus
): string | null {
  if (status.isActive) {
    // Show promotional end date information
    if (status.daysUntilEnd !== undefined) {
      if (status.daysUntilEnd === 0) {
        return 'Ends today';
      } else if (status.daysUntilEnd === 1) {
        return 'Ends tomorrow';
      } else if (status.daysUntilEnd <= 7) {
        return `Ends in ${status.daysUntilEnd} days`;
      } else {
        return 'Promo';
      }
    }
    return 'Promo';
  } else if (status.isScheduled && status.daysUntilStart !== undefined) {
    if (status.daysUntilStart === 0) {
      return 'Sale starts today';
    } else if (status.daysUntilStart === 1) {
      return 'Sale starts tomorrow';
    } else if (status.daysUntilStart <= 7) {
      return `Sale starts in ${status.daysUntilStart} days`;
    } else {
      return 'Coming soon';
    }
  }
  // No label for expired promotions - they will be auto-cleaned

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

/**
 * Check if a product has expired promotion data that needs cleanup
 * Returns true if promotional data should be deleted
 */
export function shouldCleanupPromotion(
  promotionStartDate?: Date | string | null,
  promotionEndDate?: Date | string | null,
  isPromotional?: boolean
): boolean {
  // Only cleanup if product is marked as promotional
  if (!isPromotional) {
    return false;
  }

  // Must have an end date to determine expiry
  if (!promotionEndDate) {
    return false;
  }

  const now = new Date();
  const endDate = new Date(promotionEndDate);

  // Cleanup if promotion has expired (past 23:59:59 of end date)
  return now > endDate;
}

/**
 * Get the data update object to clean promotional fields
 * Returns object ready for Prisma update operation
 */
export function getPromotionCleanupData() {
  return {
    isPromotional: false,
    promotionalPrice: null,
    promotionStartDate: null,
    promotionEndDate: null,
  };
}
