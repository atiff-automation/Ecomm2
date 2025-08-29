/**
 * Address Validation API
 * Validates Malaysian postal codes and returns city/state information
 */

import { NextRequest, NextResponse } from 'next/server';
import { malaysianPostcodeService } from '@/lib/shipping/malaysian-postcode-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postcode, state } = body;

    if (!postcode) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Postcode is required',
        },
        { status: 400 }
      );
    }

    // Validate the postcode
    const validation = malaysianPostcodeService.validatePostcode(postcode);

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
          formatted: validation.formatted,
        },
        { status: 400 }
      );
    }

    // Get location data
    const location = malaysianPostcodeService.getLocationByPostcode(
      validation.formatted
    );

    if (!location) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid postcode - no location found',
          formatted: validation.formatted,
        },
        { status: 400 }
      );
    }

    // Optional state validation
    if (state && state !== location.state) {
      return NextResponse.json(
        {
          valid: false,
          error: `Postcode ${validation.formatted} belongs to ${location.stateName}, not ${state}`,
          formatted: validation.formatted,
          correctState: location.stateName,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      formatted: validation.formatted,
      city: location.city,
      state: location.state,
      stateName: location.stateName,
      stateCode: location.stateCode,
      zone: location.zone,
      area: location.area,
    });
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET method for quick postcode lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Postcode parameter is required',
        },
        { status: 400 }
      );
    }

    const validation = malaysianPostcodeService.validatePostcode(postcode);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
        formatted: validation.formatted,
      });
    }

    const location = malaysianPostcodeService.getLocationByPostcode(
      validation.formatted
    );

    if (!location) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid postcode - no location found',
        formatted: validation.formatted,
      });
    }

    return NextResponse.json({
      valid: true,
      formatted: validation.formatted,
      city: location.city,
      state: location.state,
      stateName: location.stateName,
      stateCode: location.stateCode,
      zone: location.zone,
      area: location.area,
    });
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
