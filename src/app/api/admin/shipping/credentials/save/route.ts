/**
 * Admin Shipping Credentials Save API
 * Handles storing EasyParcel API credentials with endpoint URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';

interface SaveCredentialsRequest {
  apiKey: string;
  endpoint: string;
}

/**
 * POST - Save EasyParcel API credentials with endpoint
 * Following @CLAUDE.md systematic approach - single source of truth
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

    const data: SaveCredentialsRequest = await request.json();

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

    // Store credentials using the centralized service
    await easyParcelCredentialsService.storeCredentials(
      {
        apiKey: data.apiKey.trim(),
        endpoint: data.endpoint.trim(),
      },
      session.user.id
    );

    // CRITICAL FIX: Refresh EasyParcel service to use new credentials immediately
    console.log('🔄 Refreshing EasyParcel service after credential save');
    await easyParcelService.refreshCredentials();

    // Log the operation for audit trail
    await easyParcelCredentialsService.logCredentialOperation(
      'SAVE',
      session.user.id,
      {
        userEmail: session.user.email,
        endpoint: data.endpoint,
        timestamp: new Date().toISOString(),
        serviceRefreshed: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'EasyParcel API credentials saved successfully',
    });
  } catch (error) {
    console.error('❌ Credential save error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}