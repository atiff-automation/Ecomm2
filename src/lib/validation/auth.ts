/**
 * Authentication Validation Schemas
 * SINGLE SOURCE OF TRUTH for auth input validation
 *
 * Following CLAUDE.md standards:
 * - No hardcoding (centralized password rules)
 * - Type safety (exported types)
 * - Input validation (Zod schemas for all user inputs)
 * - Security first (strong password requirements)
 */

import { z } from 'zod';

// PASSWORD VALIDATION RULES - Single Source of Truth
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_LOWERCASE: true,
  REQUIRE_UPPERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  SPECIAL_CHARS: '@$!%*?&#',
} as const;

/**
 * Password schema with comprehensive security requirements
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`)
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(
    new RegExp(`[${PASSWORD_RULES.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`),
    `Must contain at least one special character (${PASSWORD_RULES.SPECIAL_CHARS})`
  );

/**
 * Email schema with normalization
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .transform((email) => email.toLowerCase().trim());

/**
 * Forgot Password Request Schema
 * Used in /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Schema
 * Used in /api/auth/reset-password
 * Ensures password and confirmation match
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Verify Token Schema
 * Used in /api/auth/reset-password/verify
 */
export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Export TypeScript types for use in components and APIs
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
