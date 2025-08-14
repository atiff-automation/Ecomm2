/**
 * Currency Utilities - Malaysian E-commerce Platform
 * Consistent currency formatting and calculations
 */

import config from '@/lib/config/app-config';

/**
 * Format price in Malaysian Ringgit
 */
export function formatPrice(
  price: number | string,
  options: {
    showSymbol?: boolean;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    locale = 'en-MY',
    minimumFractionDigits = config.business.pricing.decimalPlaces,
    maximumFractionDigits = config.business.pricing.decimalPlaces,
  } = options;

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return showSymbol ? `${config.business.pricing.currencySymbol} 0.00` : '0.00';
  }

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: config.business.pricing.currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericPrice);

  return formattedPrice;
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  options?: Parameters<typeof formatPrice>[1]
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, options);
  }
  
  return `${formatPrice(minPrice, options)} - ${formatPrice(maxPrice, options)}`;
}

/**
 * Calculate percentage savings
 */
export function calculateSavingsPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(
  originalPrice: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0 || discountPercentage > 100) {
    return 0;
  }
  
  return (originalPrice * discountPercentage) / 100;
}

/**
 * Apply discount to price
 */
export function applyDiscount(
  originalPrice: number,
  discountPercentage: number
): number {
  const discountAmount = calculateDiscountAmount(originalPrice, discountPercentage);
  return Math.max(0, originalPrice - discountAmount);
}

/**
 * Calculate tax amount
 */
export function calculateTax(
  amount: number,
  taxRate: number = config.business.pricing.taxRate
): number {
  return (amount * taxRate) / 100;
}

/**
 * Add tax to amount
 */
export function addTax(
  amount: number,
  taxRate: number = config.business.pricing.taxRate
): number {
  return amount + calculateTax(amount, taxRate);
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and spaces
  const cleanPrice = priceString
    .replace(/[RM$,\s]/g, '')
    .replace(/[^\d.-]/g, '');
    
  const parsed = parseFloat(cleanPrice);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if price is valid
 */
export function isValidPrice(price: number): boolean {
  return !isNaN(price) && price >= 0 && isFinite(price);
}

/**
 * Round price to currency precision
 */
export function roundPrice(price: number): number {
  const factor = Math.pow(10, config.business.pricing.decimalPlaces);
  return Math.round(price * factor) / factor;
}

/**
 * Compare prices with tolerance for floating point errors
 */
export function pricesEqual(price1: number, price2: number, tolerance: number = 0.01): boolean {
  return Math.abs(price1 - price2) < tolerance;
}

/**
 * Get price display classes based on type
 */
export function getPriceDisplayClasses(priceType: 'regular' | 'sale' | 'member'): string {
  switch (priceType) {
    case 'sale':
      return 'text-red-600 font-semibold';
    case 'member':
      return 'text-green-600 font-semibold';
    default:
      return 'text-gray-900 font-medium';
  }
}

/**
 * Format price for display with appropriate styling
 */
export function formatPriceDisplay(
  price: number,
  type: 'regular' | 'sale' | 'member' = 'regular'
): {
  formatted: string;
  classes: string;
} {
  return {
    formatted: formatPrice(price),
    classes: getPriceDisplayClasses(type),
  };
}