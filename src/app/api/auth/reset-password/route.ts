/**
 * Reset Password API Route
 * Handles password reset with valid token
 *
 * Following CLAUDE.md standards:
 * - Type safety (explicit types, no any)
 * - Error handling (try-catch on all async)
 * - Input validation (Zod schemas)
 * - Security first (token validation, password hashing, audit logging)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth';
import { checkCSRF } from '@/lib/middleware/with-csrf';
import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    const body = await request.json();

    // Validate input using Zod schema
    let validatedData: ResetPasswordInput;
    try {
      validatedData = resetPasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid input',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { token, password } = validatedData;

    // Reset password using token
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Failed to reset password',
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json(
      {
        message: 'Password reset successful. You can now sign in with your new password.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password API error:', error);

    return NextResponse.json(
      {
        error: 'An error occurred while resetting your password. Please try again.',
      },
      { status: 500 }
    );
  }
}
