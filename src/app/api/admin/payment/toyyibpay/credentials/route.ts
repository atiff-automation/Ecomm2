/**
 * toyyibPay Credentials Management API
 * Admin endpoints for managing toyyibPay API credentials
 * Following the same pattern as EasyParcel credentials API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { toyyibPayCredentialsService } from '@/lib/services/toyyibpay-credentials';
import { z } from 'zod';

// Validation schemas
const storeCredentialsSchema = z.object({
  userSecretKey: z.string().min(1, 'User Secret Key is required'),
  environment: z.enum(['sandbox', 'production']),
  categoryCode: z.string().optional(),
});

const switchEnvironmentSchema = z.object({
  environment: z.enum(['sandbox', 'production']),
});

const testCredentialsSchema = z.object({
  userSecretKey: z.string().min(1, 'User Secret Key is required'),
  environment: z.enum(['sandbox', 'production']),
});

/**
 * GET - Get credential status
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔍 Admin requesting toyyibPay credential status');

    // Get credential status
    const status = await toyyibPayCredentialsService.getCredentialStatus();

    return NextResponse.json({
      success: true,
      status: status,
    });
  } catch (error) {
    console.error('Error getting toyyibPay credential status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get credential status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Store or update credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(
      '🔍 Admin storing toyyibPay credentials for environment:',
      body.environment
    );

    // Validate request body
    const validationResult = storeCredentialsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { userSecretKey, environment, categoryCode } = validationResult.data;

    // Test credentials before storing
    console.log('🔍 Testing credentials before storing...');
    const testResult = await toyyibPayCredentialsService.validateCredentials(
      userSecretKey,
      environment
    );

    if (!testResult.isValid) {
      console.log('❌ Credential validation failed:', testResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials - could not connect to toyyibPay API',
          details: testResult.error,
          responseTime: testResult.responseTime,
          endpoint: testResult.endpoint,
        },
        { status: 400 }
      );
    }

    console.log('✅ Credentials validated successfully, storing...');

    // Store credentials
    await toyyibPayCredentialsService.storeCredentials(
      {
        userSecretKey,
        environment,
        categoryCode,
      },
      session.user.id
    );

    // Log the operation
    await toyyibPayCredentialsService.logCredentialOperation(
      'STORE',
      session.user.id,
      {
        environment,
        hasCategory: !!categoryCode,
        validationResponseTime: testResult.responseTime,
      }
    );

    console.log('✅ toyyibPay credentials stored successfully');

    // Get updated status
    const updatedStatus =
      await toyyibPayCredentialsService.getCredentialStatus();

    return NextResponse.json({
      success: true,
      message: 'Credentials stored and validated successfully',
      status: updatedStatus,
      validation: {
        responseTime: testResult.responseTime,
        endpoint: testResult.endpoint,
      },
    });
  } catch (error) {
    console.error('Error storing toyyibPay credentials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to store credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Switch environment
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log(
      '🔍 Admin switching toyyibPay environment to:',
      body.environment
    );

    // Validate request body
    const validationResult = switchEnvironmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { environment } = validationResult.data;

    // Switch environment
    await toyyibPayCredentialsService.switchEnvironment(
      environment,
      session.user.id
    );

    // Log the operation
    await toyyibPayCredentialsService.logCredentialOperation(
      'SWITCH_ENVIRONMENT',
      session.user.id,
      {
        newEnvironment: environment,
        previousEnvironment:
          environment === 'sandbox' ? 'production' : 'sandbox',
      }
    );

    console.log(`✅ toyyibPay environment switched to: ${environment}`);

    // Get updated status
    const updatedStatus =
      await toyyibPayCredentialsService.getCredentialStatus();

    return NextResponse.json({
      success: true,
      message: `Environment switched to ${environment}`,
      status: updatedStatus,
    });
  } catch (error) {
    console.error('Error switching toyyibPay environment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to switch environment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear credentials
 */
export async function DELETE() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔍 Admin clearing toyyibPay credentials');

    // Clear credentials
    await toyyibPayCredentialsService.clearCredentials();

    // Log the operation
    await toyyibPayCredentialsService.logCredentialOperation(
      'CLEAR',
      session.user.id,
      { action: 'credentials_cleared' }
    );

    console.log('✅ toyyibPay credentials cleared successfully');

    // Get updated status
    const updatedStatus =
      await toyyibPayCredentialsService.getCredentialStatus();

    return NextResponse.json({
      success: true,
      message: 'Credentials cleared successfully',
      status: updatedStatus,
    });
  } catch (error) {
    console.error('Error clearing toyyibPay credentials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear credentials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
