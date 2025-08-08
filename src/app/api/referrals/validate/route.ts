/**
 * Referral Validation API Route - Malaysian E-commerce Platform
 * Public endpoint to validate referral codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateReferralCode } from '@/lib/referrals/referral-utils';

// GET /api/referrals/validate?code=XXX - Validate referral code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { message: 'Referral code is required' },
        { status: 400 }
      );
    }

    const referral = await validateReferralCode(code);

    if (!referral) {
      return NextResponse.json(
        { message: 'Invalid referral code', isValid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      referralCode: referral.referralCode,
      referrer: referral.referrer,
      isValid: true,
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { message: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}