/**

export const dynamic = 'force-dynamic';

 * Admin Shipping Credentials Validation API
 * Tests EasyParcel API credentials without saving to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';

interface ValidateCredentialsRequest {
  apiKey: string;
  endpoint: string;
}

/**
 * POST - Validate EasyParcel API credentials without saving
 * Following @CLAUDE.md systematic approach - test before save
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: ValidateCredentialsRequest = await request.json();

    // Validate required fields
    if (!data.apiKey || !data.endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields. API Key and Endpoint URL are required.'
        },
        { status: 400 }
      );
    }

    // Validate endpoint URL format
    try {
      new URL(data.endpoint);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid endpoint URL format. Please enter a valid URL.'
        },
        { status: 400 }
      );
    }

    // Test the credentials using the validation service
    const validationResult = await easyParcelCredentialsService.validateCredentials(
      data.apiKey.trim(),
      data.endpoint.trim()
    );

    if (validationResult.isValid) {
      return NextResponse.json({
        success: true,
        message: 'EasyParcel API credentials validated successfully',
        responseTime: validationResult.responseTime,
        servicesFound: validationResult.servicesFound,
        endpoint: validationResult.endpoint,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || 'API credentials validation failed',
          responseTime: validationResult.responseTime,
          endpoint: validationResult.endpoint,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Credential validation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}