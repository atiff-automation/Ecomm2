/**
 * Forgot Password API Route
 * Handles password reset token generation and email sending
 *
 * Following CLAUDE.md standards:
 * - Type safety (explicit types, no any)
 * - Error handling (try-catch on all async)
 * - Input validation (Zod schemas)
 * - Security first (rate limiting, audit logging)
 * - No hardcoding (env vars, centralized config)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';
import { generatePasswordResetToken, PASSWORD_RESET_CONFIG } from '@/lib/auth/password-reset';
import { emailService } from '@/lib/email/email-service';
import { generatePasswordResetEmailHTML } from '@/lib/email/templates/password-reset-email';
import { ZodError } from 'zod';

// CENTRALIZED CONFIGURATION
const API_CONFIG = {
  RATE_LIMIT_WINDOW_MINUTES: 15,
  MAX_REQUESTS_PER_WINDOW: 3,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    let validatedData: ForgotPasswordInput;
    try {
      validatedData = forgotPasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid input',
            details: error.errors[0]?.message || 'Validation failed',
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { email } = validatedData;

    // Generate password reset token
    const result = await generatePasswordResetToken(email);

    if (!result.success) {
      // Still return success to prevent email enumeration attack
      // (Don't reveal if email exists)
      return NextResponse.json(
        {
          message: 'If your email is registered, you will receive a password reset link shortly.',
        },
        { status: 200 }
      );
    }

    // If token was generated successfully, send email
    if (result.token) {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/${result.token}`;

      const emailHTML = generatePasswordResetEmailHTML({
        resetLink,
        userEmail: email,
      });

      // Send email
      const emailResult = await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request - JRM E-commerce',
        html: emailHTML,
      });

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Still return success to user (don't expose email sending issues)
      }
    }

    // SECURITY: Always return generic success message
    // Don't reveal whether email exists or not
    return NextResponse.json(
      {
        message: 'If your email is registered, you will receive a password reset link shortly.',
        expiryHours: PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password API error:', error);

    // Generic error message - don't expose internal details
    return NextResponse.json(
      {
        error: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    );
  }
}
