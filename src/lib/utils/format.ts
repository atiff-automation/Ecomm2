/**
 * Formatting Utilities - Malaysian E-commerce Platform
 * Consistent formatting functions for various data types
 */

import config from '@/lib/config/app-config';

/**
 * Format phone number for Malaysian format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle Malaysian phone numbers
  if (digits.startsWith('60')) {
    // International format (+60)
    const local = digits.slice(2);
    if (local.length === 9 || local.length === 10) {
      return `+60 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
    }
  } else if (digits.startsWith('0')) {
    // Local format (0xx)
    if (digits.length === 10 || digits.length === 11) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }
  }

  // Return original if unable to format
  return phone;
}

/**
 * Format postal code
 */
export function formatPostalCode(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, '');
  return digits.slice(0, 5);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = 'en-MY',
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = 'en-MY',
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}): string {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    formatPostalCode(address.postalCode),
    address.country || 'Malaysia',
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format order number
 */
export function formatOrderNumber(orderNumber: string): string {
  // Ensure order number follows the pattern ORD-YYYYMMDD-XXXX
  if (!orderNumber.startsWith(config.business.order.numberPrefix)) {
    return `${config.business.order.numberPrefix}-${orderNumber}`;
  }
  return orderNumber;
}

/**
 * Format SKU
 */
export function formatSKU(sku: string): string {
  return sku.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Format product name for URL slug
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format Malaysian IC/NRIC number
 */
export function formatNRIC(nric: string): string {
  const digits = nric.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  return nric;
}

/**
 * Format search query for display
 */
export function formatSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, 100); // Limit search query length
}

/**
 * Format review rating
 */
export function formatRating(
  rating: number,
  options: {
    showDecimals?: boolean;
    maxRating?: number;
  } = {}
): string {
  const { showDecimals = true, maxRating = 5 } = options;

  const clampedRating = Math.max(0, Math.min(rating, maxRating));

  if (showDecimals) {
    return clampedRating.toFixed(1);
  }

  return Math.round(clampedRating).toString();
}

/**
 * Format list of items for display
 */
export function formatList(
  items: string[],
  options: {
    conjunction?: 'and' | 'or';
    locale?: string;
  } = {}
): string {
  const { conjunction = 'and', locale = 'en-MY' } = options;

  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }

  const formatter = new Intl.ListFormat(locale, {
    style: 'long',
    type: conjunction === 'and' ? 'conjunction' : 'disjunction',
  });

  return formatter.format(items);
}

/**
 * Format code for display (add line breaks, syntax highlighting classes)
 */
export function formatCode(
  code: string,
  language: string = 'text'
): {
  formatted: string;
  language: string;
  lineCount: number;
} {
  const lines = code.split('\n');
  return {
    formatted: code,
    language,
    lineCount: lines.length,
  };
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Format unit of measurement
 */
export function formatUnit(
  value: number,
  unit: string,
  options: {
    showUnit?: boolean;
    plural?: string;
  } = {}
): string {
  const { showUnit = true, plural } = options;

  if (!showUnit) {
    return formatNumber(value);
  }

  const displayUnit = value === 1 ? unit : plural || `${unit}s`;
  return `${formatNumber(value)} ${displayUnit}`;
}
