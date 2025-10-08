/**
 * Date Utilities for Shipping
 *
 * Functions for calculating next business day, validating pickup dates,
 * and handling Malaysian public holidays.
 *
 * @module shipping/utils/date-utils
 */

import { PICKUP_CONFIG, MALAYSIAN_PUBLIC_HOLIDAYS_2025 } from '../constants';

/**
 * Get next business day for pickup scheduling
 *
 * Skips Sundays and Malaysian public holidays.
 * Returns next valid business day starting from tomorrow.
 *
 * @param fromDate - Starting date (default: today)
 * @returns Next business day as Date object
 *
 * @example
 * // If today is Saturday, Oct 11, 2025
 * getNextBusinessDay() // Returns Monday, Oct 13, 2025
 */
export function getNextBusinessDay(fromDate: Date = new Date()): Date {
  // Start from tomorrow
  const nextDay = new Date(fromDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  let currentDate = new Date(nextDay);
  const maxAttempts = 14; // Prevent infinite loop (check up to 2 weeks ahead)
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Check if day is business day
    if (isBusinessDay(currentDate)) {
      return currentDate;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    attempts++;
  }

  // Fallback: return tomorrow if no business day found (shouldn't happen)
  console.error('[DateUtils] Could not find business day within 14 days, using fallback');
  return nextDay;
}

/**
 * Check if date is a business day
 *
 * Business day = not Sunday AND not public holiday
 *
 * @param date - Date to check
 * @returns True if business day
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();

  // Check if Sunday (0) or any excluded day
  if (PICKUP_CONFIG.EXCLUDED_DAYS.includes(dayOfWeek)) {
    return false;
  }

  // Check if public holiday
  if (isPublicHoliday(date)) {
    return false;
  }

  return true;
}

/**
 * Check if date is a Malaysian public holiday
 *
 * @param date - Date to check
 * @returns True if public holiday
 */
export function isPublicHoliday(date: Date): boolean {
  const dateString = formatDateISO(date);
  return MALAYSIAN_PUBLIC_HOLIDAYS_2025.includes(dateString);
}

/**
 * Validate pickup date
 *
 * Rules:
 * - Must be business day
 * - Must be at least MIN_ADVANCE_HOURS hours from now
 * - Cannot be more than MAX_ADVANCE_DAYS days ahead
 *
 * @param pickupDate - Date to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePickupDate(pickupDate: Date): {
  isValid: boolean;
  error?: string;
} {
  const now = new Date();
  const minDate = new Date(now.getTime() + PICKUP_CONFIG.MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + PICKUP_CONFIG.MAX_ADVANCE_DAYS);

  // Check if date is in the past
  if (pickupDate < minDate) {
    return {
      isValid: false,
      error: `Pickup date must be at least ${PICKUP_CONFIG.MIN_ADVANCE_HOURS} hours from now`,
    };
  }

  // Check if date is too far in the future
  if (pickupDate > maxDate) {
    return {
      isValid: false,
      error: `Pickup date cannot be more than ${PICKUP_CONFIG.MAX_ADVANCE_DAYS} days ahead`,
    };
  }

  // Check if business day
  if (!isBusinessDay(pickupDate)) {
    return {
      isValid: false,
      error: 'Pickup date must be a business day (not Sunday or public holiday)',
    };
  }

  return { isValid: true };
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 *
 * @param date - Date to format
 * @returns ISO date string
 *
 * @example
 * formatDateISO(new Date('2025-10-07')) // "2025-10-07"
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (friendly format)
 *
 * @param date - Date to format
 * @returns Formatted date string
 *
 * @example
 * formatDateDisplay(new Date('2025-10-07')) // "Oct 7, 2025"
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get date range for pickup date picker
 *
 * @returns Object with minDate and maxDate
 */
export function getPickupDateRange(): {
  minDate: Date;
  maxDate: Date;
} {
  const now = new Date();
  const minDate = new Date(now.getTime() + PICKUP_CONFIG.MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + PICKUP_CONFIG.MAX_ADVANCE_DAYS);

  return { minDate, maxDate };
}

/**
 * Check if date is today
 *
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is tomorrow
 *
 * @param date - Date to check
 * @returns True if date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}
