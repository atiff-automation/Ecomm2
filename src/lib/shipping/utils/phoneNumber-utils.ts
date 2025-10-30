/**
 * Malaysian Phone Number Utilities
 *
 * Handles normalization and validation of Malaysian mobile phone numbers.
 * Accepts multiple input formats and normalizes to international format (+60).
 *
 * @module shipping/utils/phoneNumber-utils
 */

/**
 * Normalize Malaysian phone number to international format (+60XXXXXXXXX)
 *
 * Accepts all valid Malaysian mobile number formats:
 * - 0123456789 (local 10-digit) → +60123456789
 * - 01234567899 (local 11-digit) → +601234567899
 * - +60123456789 (already normalized) → +60123456789
 * - +601234567899 (already normalized) → +601234567899
 * - 60123456789 (no +) → +60123456789
 * - 601234567899 (no +) → +601234567899
 * - "0123 456 789" (with spaces) → +60123456789
 * - "0123-456-789" (with hyphens) → +60123456789
 *
 * @param phoneNumber - Raw phone number input from user
 * @returns Normalized phone number in +60XXXXXXXXX format
 * @throws Error if phone number format is invalid or unrecognizable
 *
 * @example
 * normalizePhoneNumber('0123456789') // → '+60123456789'
 * normalizePhoneNumber('60123456789') // → '+60123456789'
 * normalizePhoneNumber('+60123456789') // → '+60123456789'
 * normalizePhoneNumber('0123 456 789') // → '+60123456789'
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove spaces and hyphens
  const cleaned = phoneNumber.trim().replace(/[\s\-]/g, '');

  // Validate: must be non-empty after cleaning
  if (!cleaned) {
    throw new Error('Phone number cannot be empty');
  }

  // Case 1: Already in international format with +
  // Pattern: +60[01]XXXXXXX or +60[01]XXXXXXXX (8-9 digits after +60)
  if (cleaned.startsWith('+60')) {
    return cleaned;
  }

  // Case 2: International format without + (60-prefix)
  // Pattern: 60[01]XXXXXXX or 60[01]XXXXXXXX (8-9 digits after 60)
  if (cleaned.startsWith('60')) {
    return `+${cleaned}`;
  }

  // Case 3: Local format with 0-prefix
  // Pattern: 0[01]XXXXXXXX or 0[01]XXXXXXXXX (10-11 digits total)
  if (cleaned.startsWith('0')) {
    // Remove leading 0 and add +60
    return `+60${cleaned.substring(1)}`;
  }

  // Invalid format
  throw new Error(
    `Invalid phone number format: "${phoneNumber}". ` +
      'Please enter a Malaysian number in one of these formats: ' +
      '0123456789, 60123456789, or +60123456789'
  );
}

/**
 * Validate if a phone number is in a valid Malaysian format
 *
 * This is a convenience function for checking validity before normalization.
 * It uses the same validation rules as the Zod schema.
 *
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidMalaysianPhoneNumber('0123456789') // → true
 * isValidMalaysianPhoneNumber('123456789') // → false (too short)
 */
export function isValidMalaysianPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.trim().replace(/[\s\-]/g, '');

  // Local format: 0[01]XXXXXXXX or 0[01]XXXXXXXXX (10-11 digits total)
  if (/^0[01]\d{8,9}$/.test(cleaned)) {
    return true;
  }

  // International with +: +60[01]XXXXXXX or +60[01]XXXXXXXX (8-9 digits after +60)
  if (/^\+60[01]\d{7,8}$/.test(cleaned)) {
    return true;
  }

  // International without +: 60[01]XXXXXXX or 60[01]XXXXXXXX (8-9 digits after 60)
  if (/^60[01]\d{7,8}$/.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Format phone number for display purposes
 *
 * Takes a normalized +60-format phone number and formats it nicely.
 *
 * @param phoneNumber - Phone number in +60XXXXXXXXX format
 * @returns Formatted phone number (e.g., +60 12-3456 789)
 *
 * @example
 * formatPhoneNumberForDisplay('+60123456789') // → '+60 12-3456 789'
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // Ensure it's normalized first
  if (!phoneNumber.startsWith('+60')) {
    return phoneNumber; // Return as-is if not normalized
  }

  // Format: +60 XX-XXXX XXX (for 8 digits after +60)
  // or      +60 XX-XXXXX XXX (for 9 digits after +60)
  const match = phoneNumber.match(/^\+60(.{2})(.{4})(.{3,4})$/);
  if (match) {
    return `+60 ${match[1]}-${match[2]} ${match[3]}`;
  }

  return phoneNumber; // Return as-is if format doesn't match expected pattern
}

/**
 * Convert normalized phone number back to local format
 *
 * Converts +60XXXXXXXXX to 0XXXXXXXXX for display in Malaysia context.
 *
 * @param phoneNumber - Phone number in +60XXXXXXXXX format
 * @returns Phone number in 0XXXXXXXXX format
 *
 * @example
 * convertToLocalFormat('+60123456789') // → '0123456789'
 */
export function convertToLocalFormat(phoneNumber: string): string {
  if (phoneNumber.startsWith('+60')) {
    return `0${phoneNumber.substring(3)}`;
  }

  if (phoneNumber.startsWith('60')) {
    return `0${phoneNumber.substring(2)}`;
  }

  return phoneNumber; // Already in local format or unrecognized
}
