/**

export const dynamic = 'force-dynamic';

 * toyyibPay Connection Test API
 * Admin endpoint for testing toyyibPay API connectivity and credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { toyyibPayCredentialsService } from '@/lib/services/toyyibpay-credentials';
import { toyyibPayService } from '@/lib/payments/toyyibpay-service';
import { z } from 'zod';

// Validation schema
const testConnectionSchema = z.object({
  userSecretKey: z.string().min(1, 'User Secret Key is required').optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
  useStoredCredentials: z.boolean().default(true),
});

/**
 * POST - Test connection to toyyibPay API
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
    console.log('🔍 Admin testing toyyibPay connection');

    // Validate request body
    const validationResult = testConnectionSchema.safeParse(body);
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

    const { userSecretKey, environment, useStoredCredentials } =
      validationResult.data;

    let testUserSecretKey: string;
    let testEnvironment: 'sandbox' | 'production';

    if (useStoredCredentials) {
      // Use stored credentials
      console.log('🔍 Testing with stored credentials');
      const credentials =
        await toyyibPayCredentialsService.getCredentialsForService();

      if (!credentials) {
        return NextResponse.json(
          {
            success: false,
            error: 'No stored credentials found',
            details: 'Please configure toyyibPay credentials first',
          },
          { status: 400 }
        );
      }

      testUserSecretKey = credentials.userSecretKey;
      testEnvironment = credentials.environment;
    } else {
      // Use provided credentials for testing
      console.log('🔍 Testing with provided credentials');
      if (!userSecretKey || !environment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing credentials for testing',
            details: 'Please provide userSecretKey and environment for testing',
          },
          { status: 400 }
        );
      }

      testUserSecretKey = userSecretKey;
      testEnvironment = environment;
    }

    console.log(
      `🔍 Testing toyyibPay API with environment: ${testEnvironment}`
    );

    // Perform comprehensive test
    const testResults = await performComprehensiveTest(
      testUserSecretKey,
      testEnvironment,
      session.user.id
    );

    // Log the test operation
    await toyyibPayCredentialsService.logCredentialOperation(
      'CONNECTION_TEST',
      session.user.id,
      {
        environment: testEnvironment,
        useStoredCredentials,
        success: testResults.overallSuccess,
        responseTime: testResults.basicTest.responseTime,
        endpoint: testResults.basicTest.endpoint,
      }
    );

    return NextResponse.json({
      success: testResults.overallSuccess,
      message: testResults.overallSuccess
        ? 'Connection test completed successfully'
        : 'Connection test failed',
      results: testResults,
    });
  } catch (error) {
    console.error('Error testing toyyibPay connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current connection status
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

    console.log('🔍 Admin requesting toyyibPay connection status');

    // Get current configuration status
    const configStatus = await toyyibPayService.getConfigurationStatus();
    const credentialStatus =
      await toyyibPayCredentialsService.getCredentialStatus();

    return NextResponse.json({
      success: true,
      status: {
        isConfigured: configStatus.isConfigured,
        environment: configStatus.environment,
        baseURL: configStatus.baseURL,
        hasCategoryCode: configStatus.hasCategoryCode,
        hasCredentials: credentialStatus.hasCredentials,
        lastUpdated: credentialStatus.lastUpdated,
        updatedBy: credentialStatus.updatedBy,
      },
    });
  } catch (error) {
    console.error('Error getting toyyibPay connection status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get connection status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Perform comprehensive test of toyyibPay API
 */
async function performComprehensiveTest(
  userSecretKey: string,
  environment: 'sandbox' | 'production',
  userId: string
): Promise<{
  overallSuccess: boolean;
  basicTest: any;
  categoryTest: any;
  serviceTest: any;
  summary: any;
}> {
  const startTime = Date.now();
  const results = {
    overallSuccess: false,
    basicTest: {},
    categoryTest: {},
    serviceTest: {},
    summary: {},
  };

  try {
    console.log('🧪 Starting comprehensive toyyibPay API test');

    // Test 1: Basic credential validation
    console.log('🧪 Test 1: Basic credential validation');
    results.basicTest = await toyyibPayCredentialsService.validateCredentials(
      userSecretKey,
      environment
    );

    if (!results.basicTest.isValid) {
      results.overallSuccess = false;
      results.summary = {
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        totalTime: Date.now() - startTime,
        criticalError: 'Basic credential validation failed',
      };
      return results;
    }

    // Test 2: Category functionality test
    console.log('🧪 Test 2: Category functionality test (DIRECT APPROACH)');
    try {
      // Test using direct credential validation approach (same as basic test)
      const testCategoryName = `TEST_${Date.now()}`;

      // Use the exact same approach as the working validation
      const baseUrl =
        environment === 'sandbox'
          ? process.env.TOYYIBPAY_SANDBOX_URL || 'https://dev.toyyibpay.com'
          : process.env.TOYYIBPAY_PRODUCTION_URL || 'https://toyyibpay.com';

      const formData = new FormData();
      formData.append('userSecretKey', userSecretKey);
      formData.append('catname', testCategoryName);
      formData.append(
        'catdescription',
        'Test category for connection validation'
      );

      const response = await fetch(`${baseUrl}/index.php/api/createCategory`, {
        method: 'POST',
        body: formData,
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`🔍 Direct category test response: ${responseText}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        results.categoryTest = {
          success: false,
          error: 'Invalid JSON response from category test',
          testCategoryName: testCategoryName,
        };
        return;
      }

      // Check for success (CategoryCode returned) or expected error
      if (data[0]?.CategoryCode || (data.status && data.CategoryCode)) {
        results.categoryTest = {
          success: true,
          categoryCode: data[0]?.CategoryCode || data.CategoryCode,
          testCategoryName: testCategoryName,
        };
      } else if (data.status) {
        results.categoryTest = {
          success: false,
          error: data.status,
          testCategoryName: testCategoryName,
        };
      } else {
        results.categoryTest = {
          success: false,
          error: 'Unexpected response format',
          testCategoryName: testCategoryName,
        };
      }
    } catch (error) {
      results.categoryTest = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in category test',
      };
    }

    // Test 3: Service configuration test
    console.log('🧪 Test 3: Service configuration test');
    try {
      // Refresh service configuration and test
      await toyyibPayService.refreshConfiguration();
      const serviceStatus = await toyyibPayService.getConfigurationStatus();

      results.serviceTest = {
        success: serviceStatus.isConfigured,
        environment: serviceStatus.environment,
        baseURL: serviceStatus.baseURL,
        hasCategoryCode: serviceStatus.hasCategoryCode,
        error: serviceStatus.error,
      };
    } catch (error) {
      results.serviceTest = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error in service test',
      };
    }

    // Calculate overall results
    const totalTests = 3;
    const passedTests = [
      results.basicTest.isValid,
      results.categoryTest.success,
      results.serviceTest.success,
    ].filter(Boolean).length;

    results.overallSuccess = passedTests >= 2; // At least basic test and one other must pass
    results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalTime: Date.now() - startTime,
      environment,
      endpoint: results.basicTest.endpoint,
      overallResponseTime: results.basicTest.responseTime,
    };

    console.log(`🧪 Test completed: ${passedTests}/${totalTests} tests passed`);

    return results;
  } catch (error) {
    console.error('Error in comprehensive test:', error);

    results.overallSuccess = false;
    results.summary = {
      totalTests: 3,
      passedTests: 0,
      failedTests: 3,
      totalTime: Date.now() - startTime,
      criticalError: error instanceof Error ? error.message : 'Unknown error',
    };

    return results;
  }
}
