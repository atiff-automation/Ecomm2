/**
 * Centralized Pricing Types - Malaysian E-commerce Platform
 * Single source of truth for all pricing-related types and interfaces
 */

export type PriceType = 'regular' | 'promotional' | 'member' | 'early-access';

export interface PricingBadge {
  type: 'promotional' | 'member' | 'early-access' | 'featured' | 'members-only' | 'coming-soon' | 'out-of-stock' | 'qualifying';
  text: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  className?: string;
}

export interface PricingDisplayClasses {
  priceColor: string;
  badgeVariant: string;
  savingsColor: string;
}

export interface ProductPricing {
  // Core pricing data
  effectivePrice: number;
  originalPrice: number;
  priceType: PriceType;
  
  // Savings calculations
  savings: number;
  savingsPercentage: number;
  
  // Display elements
  badges: PricingBadge[];
  displayClasses: PricingDisplayClasses;
  
  // Formatted strings (ready for display)
  formattedPrice: string;
  formattedOriginalPrice: string;
  formattedSavings: string;
  
  // Additional context
  showOriginalPrice: boolean;
  showSavings: boolean;
  showMemberPreview: boolean;
  memberPreviewText?: string;
  
  // Accessibility
  priceDescription: string; // For screen readers
}

export interface UserPricingContext {
  isLoggedIn: boolean;
  isMember: boolean;
  userId?: string;
}

export interface ProductPricingData {
  id: string;
  regularPrice: number;
  memberPrice: number;
  promotionalPrice?: number | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  memberOnlyUntil?: string | null;
  earlyAccessStart?: string | null;
  stockQuantity: number;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  featured?: boolean;
}

export interface PricingServiceConfig {
  currency: string;
  locale: string;
  timezone: string;
  showCents: boolean;
}

export interface PromotionStatus {
  isActive: boolean;
  isScheduled: boolean;
  isMemberOnly: boolean;
  isEarlyAccess: boolean;
  displayText?: string;
}

export interface EarlyAccessStatus {
  isEarlyAccessPromotion: boolean;
  isMemberOnly: boolean;
  hasAccess: boolean;
  accessMessage?: string;
}