/**
 * NRIC Validation Utilities - Ultra-KISS Edition
 * Malaysia National Registration Identity Card validation
 *
 * @CLAUDE.md Compliance:
 * - No hardcoding: All values in constants
 * - Type safety: Explicit types everywhere
 * - DRY: Centralized validation logic
 */

import { z } from 'zod';

export const NRIC_VALIDATION_RULES = {
  LENGTH: 12,
  PATTERN: /^\d{12}$/,
  ERROR_MESSAGES: {
    REQUIRED: 'NRIC is required for membership activation',
    LENGTH: 'NRIC must be exactly 12 digits',
    FORMAT: 'NRIC must contain only numbers (no dashes or symbols)',
    DUPLICATE: 'This NRIC is already registered. Contact support if this is incorrect.',
  },
} as const;

export const nricSchema = z.object({
  nric: z
    .string()
    .length(NRIC_VALIDATION_RULES.LENGTH, NRIC_VALIDATION_RULES.ERROR_MESSAGES.LENGTH)
    .regex(NRIC_VALIDATION_RULES.PATTERN, NRIC_VALIDATION_RULES.ERROR_MESSAGES.FORMAT),
});

export function validateNRIC(nric: string): { valid: boolean; error?: string } {
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) {
    return { valid: false, error: NRIC_VALIDATION_RULES.ERROR_MESSAGES.LENGTH };
  }

  if (!NRIC_VALIDATION_RULES.PATTERN.test(nric)) {
    return { valid: false, error: NRIC_VALIDATION_RULES.ERROR_MESSAGES.FORMAT };
  }

  return { valid: true };
}

export function maskNRIC(nric: string): string {
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) {
    return '••••••••••••';
  }
  return '••••••••' + nric.slice(-4);
}

export function formatNRIC(nric: string | null | undefined): string {
  if (!nric) return 'N/A';
  if (nric.length !== NRIC_VALIDATION_RULES.LENGTH) return 'Invalid';
  return nric;
}
