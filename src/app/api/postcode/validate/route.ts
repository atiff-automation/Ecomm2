/**
 * Postcode Validation API Endpoint
 * Provides client-side access to database-driven postcode validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServerPostcodeService } from '@/lib/shipping/server-postcode-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode parameter is required' },
        { status: 400 }
      );
    }

    const postcodeService = ServerPostcodeService.getInstance();
    const validation = await postcodeService.validatePostcode(postcode);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Postcode validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}