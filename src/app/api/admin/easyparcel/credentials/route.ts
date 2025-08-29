/**
 * EasyParcel Credentials Management API
 * Secure endpoint for managing EasyParcel API credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';
import { z } from 'zod';

// Request validation schemas
const updateCredentialsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
  environment: z.enum(['sandbox', 'production']),
});

const switchEnvironmentSchema = z.object({
  environment: z.enum(['sandbox', 'production']),
});

/**
 * GET - Get credential status (masked)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Get credential status (never returns actual credentials)
    const status = await easyParcelCredentialsService.getCredentialStatus();

    // Log the access
    await easyParcelCredentialsService.logCredentialOperation(
      'STATUS_CHECK',
      session.user.id,
      {
        hasCredentials: status.hasCredentials,
        environment: status.environment,
        isUsingEnvFallback: status.isUsingEnvFallback,
      }
    );

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error getting credential status:', error);
    return NextResponse.json(
      { error: 'Failed to get credential status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update credentials or switch environment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'update_credentials': {
        // Validate request
        const validatedData = updateCredentialsSchema.parse(body);

        // Test credentials before storing
        const testResult =
          await easyParcelCredentialsService.validateCredentials(
            validatedData.apiKey,
            validatedData.apiSecret,
            validatedData.environment
          );

        if (!testResult.isValid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid credentials',
              details: testResult.error,
            },
            { status: 400 }
          );
        }

        // Store credentials
        await easyParcelCredentialsService.storeCredentials(
          {
            apiKey: validatedData.apiKey,
            apiSecret: validatedData.apiSecret,
            environment: validatedData.environment,
          },
          session.user.id
        );

        // CRITICAL: Force refresh of EasyParcel service cache
        const { easyParcelService } = await import(
          '@/lib/shipping/easyparcel-service'
        );
        await easyParcelService.refreshCredentials();

        // Log the operation
        await easyParcelCredentialsService.logCredentialOperation(
          'CREDENTIALS_UPDATED',
          session.user.id,
          {
            environment: validatedData.environment,
            testResult: {
              responseTime: testResult.responseTime,
              servicesFound: testResult.servicesFound,
            },
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Credentials updated successfully',
          testResult: {
            responseTime: testResult.responseTime,
            servicesFound: testResult.servicesFound,
          },
        });
      }

      case 'switch_environment': {
        // Validate request
        const validatedData = switchEnvironmentSchema.parse(body);

        // Switch environment
        await easyParcelCredentialsService.switchEnvironment(
          validatedData.environment,
          session.user.id
        );

        // CRITICAL: Force refresh of EasyParcel service cache
        const { easyParcelService } = await import(
          '@/lib/shipping/easyparcel-service'
        );
        await easyParcelService.refreshCredentials();

        // Log the operation
        await easyParcelCredentialsService.logCredentialOperation(
          'ENVIRONMENT_SWITCHED',
          session.user.id,
          {
            newEnvironment: validatedData.environment,
          }
        );

        return NextResponse.json({
          success: true,
          message: `Environment switched to ${validatedData.environment}`,
        });
      }

      case 'test_current': {
        // Force refresh to get latest credentials
        const { easyParcelService } = await import(
          '@/lib/shipping/easyparcel-service'
        );
        await easyParcelService.refreshCredentials();

        // Get current credentials and test them
        const credentials =
          await easyParcelCredentialsService.getCredentialsForService();

        if (!credentials) {
          return NextResponse.json(
            {
              success: false,
              error: 'No credentials configured',
            },
            { status: 400 }
          );
        }

        const environment = credentials.isSandbox ? 'sandbox' : 'production';
        const testResult =
          await easyParcelCredentialsService.validateCredentials(
            credentials.apiKey,
            credentials.apiSecret,
            environment
          );

        // Log the test
        await easyParcelCredentialsService.logCredentialOperation(
          'CREDENTIALS_TESTED',
          session.user.id,
          {
            environment,
            source: credentials.source,
            testResult: {
              isValid: testResult.isValid,
              responseTime: testResult.responseTime,
              servicesFound: testResult.servicesFound,
              error: testResult.error,
            },
          }
        );

        return NextResponse.json({
          success: testResult.isValid,
          testResult: {
            ...testResult,
            endpoint: testResult.endpoint,
            environment: environment,
          },
          credentialSource: credentials.source,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in credentials API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear stored credentials (fallback to env vars)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Clear credentials
    await easyParcelCredentialsService.clearCredentials();

    // Log the operation
    await easyParcelCredentialsService.logCredentialOperation(
      'CREDENTIALS_CLEARED',
      session.user.id,
      {
        fallbackToEnv: !!(
          process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET
        ),
      }
    );

    return NextResponse.json({
      success: true,
      message:
        'Credentials cleared. System will use environment variables if available.',
    });
  } catch (error) {
    console.error('Error clearing credentials:', error);
    return NextResponse.json(
      { error: 'Failed to clear credentials' },
      { status: 500 }
    );
  }
}
