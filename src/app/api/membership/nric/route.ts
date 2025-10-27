/**
 * NRIC Validation Endpoint - Ultra-KISS Edition
 * Single endpoint that handles NRIC validation and duplicate check
 *
 * @CLAUDE.md Compliance:
 * - CENTRALIZED: All NRIC validation in one place
 * - SIMPLE: Does one thing well - validate NRIC
 * - TYPE SAFE: Uses Zod schemas and explicit types
 * - SECURE: CSRF protected, session auth, three-layer validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { nricSchema } from '@/lib/validation/nric';

// Type-safe validation schema
const submitNricSchema = z.object({
  nric: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // ✅ Layer 1: Session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ Layer 2: Input parsing
    const body = await request.json();
    const { nric } = submitNricSchema.parse(body);

    // ✅ Layer 3: NRIC format validation (Zod schema)
    const nricValidation = nricSchema.safeParse({ nric });
    if (!nricValidation.success) {
      return NextResponse.json(
        {
          message: 'Invalid NRIC format',
          errors: nricValidation.error.errors,
        },
        { status: 400 }
      );
    }

    // ✅ Layer 4: Duplicate check (Database validation)
    const existingUser = await prisma.user.findUnique({
      where: { nric },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        {
          code: 'DUPLICATE_NRIC',
          message: 'This NRIC is already registered. Contact support if this is incorrect.',
        },
        { status: 409 }
      );
    }

    // ✅ KISS: Return success
    // Actual pendingMembership creation happens in /api/orders
    // This endpoint only validates - keeps it simple
    return NextResponse.json({
      success: true,
      message: 'NRIC validated successfully',
    });
  } catch (error) {
    console.error('Error validating NRIC:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
