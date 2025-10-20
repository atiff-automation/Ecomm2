/**
 * Verify Reset Token API Route
 * Validates password reset token before allowing password change
 *
 * Following CLAUDE.md standards:
 * - Type safety (explicit types, no any)
 * - Error handling (try-catch on all async)
 * - Input validation (Zod schemas)
 * - Security first (token validation)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { verifyTokenSchema, type VerifyTokenInput } from '@/lib/validation/auth';
import { verifyPasswordResetToken } from '@/lib/auth/password-reset';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    let validatedData: VerifyTokenInput;
    try {
      validatedData = verifyTokenSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            valid: false,
            message: error.errors[0]?.message || 'Invalid token format',
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { token } = validatedData;

    // Verify token
    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          message: result.message || 'Invalid or expired token',
        },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        valid: true,
        message: 'Token is valid',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification API error:', error);

    return NextResponse.json(
      {
        valid: false,
        message: 'An error occurred while verifying the token',
      },
      { status: 500 }
    );
  }
}
