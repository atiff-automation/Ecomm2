/**
 * Test Connection API Route
 * Tests EasyParcel API connection with provided credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  EasyParcelService,
  EasyParcelError,
} from '@/lib/shipping/easyparcel-service';

const testConnectionSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  environment: z.enum(['sandbox', 'production']),
});

/**
 * POST /api/admin/shipping/test-connection
 * Test EasyParcel API connection
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = testConnectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { apiKey, environment } = validation.data;

    console.log('[TestConnection] Testing EasyParcel connection...', {
      environment,
      apiKeyPreview: `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`,
    });

    // Create EasyParcel service instance
    const easyParcelService = new EasyParcelService(apiKey, environment);

    // Test connection by checking account balance
    try {
      const balanceResponse = await easyParcelService.getBalance();

      if (balanceResponse.success && balanceResponse.data) {
        console.log('[TestConnection] ✅ Connection successful', {
          balance: balanceResponse.data.balance,
        });

        return NextResponse.json({
          success: true,
          message: 'Connection successful! EasyParcel API is working.',
          data: {
            balance: balanceResponse.data.balance,
            currency: balanceResponse.data.currency || 'MYR',
          },
        });
      } else {
        console.error(
          '[TestConnection] ❌ Connection failed:',
          balanceResponse.error
        );

        return NextResponse.json(
          {
            success: false,
            message:
              balanceResponse.error || 'Failed to connect to EasyParcel API',
          },
          { status: 400 }
        );
      }
    } catch (apiError) {
      console.error('[TestConnection] ❌ API Error:', apiError);

      if (apiError instanceof EasyParcelError) {
        return NextResponse.json(
          {
            success: false,
            message: apiError.message,
            code: apiError.code,
          },
          { status: 400 }
        );
      }

      throw apiError;
    }
  } catch (error) {
    console.error('[TestConnection] ❌ Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to test connection. Please check your API key and try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
