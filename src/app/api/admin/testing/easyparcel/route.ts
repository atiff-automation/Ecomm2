/**
 * Admin EasyParcel Testing API
 * Comprehensive testing endpoints for sandbox environment
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EasyParcelTestSuite } from '@/lib/testing/easyparcel-test-suite';
import { z } from 'zod';

const testRequestSchema = z.object({
  testSuite: z.enum(['full', 'rates', 'booking', 'tracking', 'tax', 'errors', 'states']).optional(),
  generateReport: z.boolean().optional().default(true),
  includeDetailedLogs: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testSuite = 'full', generateReport, includeDetailedLogs } = testRequestSchema.parse(body);

    const testSuiteRunner = new EasyParcelTestSuite();
    
    console.log(`[EasyParcel Testing] Starting ${testSuite} test suite...`);
    const startTime = Date.now();

    let results;

    switch (testSuite) {
      case 'full':
        results = await testSuiteRunner.runFullTestSuite();
        break;
      
      case 'rates':
        const rateResults = await (testSuiteRunner as any).testRateCalculation();
        results = {
          overallResult: rateResults.failed > 0 ? 'FAIL' : (rateResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [rateResults],
          summary: {
            totalTests: rateResults.totalTests,
            totalPassed: rateResults.passed,
            totalFailed: rateResults.failed,
            totalWarnings: rateResults.warnings,
            totalDuration: rateResults.duration
          }
        };
        break;

      case 'booking':
        const bookingResults = await (testSuiteRunner as any).testShipmentBooking();
        results = {
          overallResult: bookingResults.failed > 0 ? 'FAIL' : (bookingResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [bookingResults],
          summary: {
            totalTests: bookingResults.totalTests,
            totalPassed: bookingResults.passed,
            totalFailed: bookingResults.failed,
            totalWarnings: bookingResults.warnings,
            totalDuration: bookingResults.duration
          }
        };
        break;

      case 'tracking':
        const trackingResults = await (testSuiteRunner as any).testTrackingUpdates();
        results = {
          overallResult: trackingResults.failed > 0 ? 'FAIL' : (trackingResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [trackingResults],
          summary: {
            totalTests: trackingResults.totalTests,
            totalPassed: trackingResults.passed,
            totalFailed: trackingResults.failed,
            totalWarnings: trackingResults.warnings,
            totalDuration: trackingResults.duration
          }
        };
        break;

      case 'tax':
        const taxResults = await (testSuiteRunner as any).testTaxCalculation();
        results = {
          overallResult: taxResults.failed > 0 ? 'FAIL' : (taxResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [taxResults],
          summary: {
            totalTests: taxResults.totalTests,
            totalPassed: taxResults.passed,
            totalFailed: taxResults.failed,
            totalWarnings: taxResults.warnings,
            totalDuration: taxResults.duration
          }
        };
        break;

      case 'errors':
        const errorResults = await (testSuiteRunner as any).testErrorHandling();
        results = {
          overallResult: errorResults.failed > 0 ? 'FAIL' : (errorResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [errorResults],
          summary: {
            totalTests: errorResults.totalTests,
            totalPassed: errorResults.passed,
            totalFailed: errorResults.failed,
            totalWarnings: errorResults.warnings,
            totalDuration: errorResults.duration
          }
        };
        break;

      case 'states':
        const stateResults = await (testSuiteRunner as any).testMalaysianStates();
        results = {
          overallResult: stateResults.failed > 0 ? 'FAIL' : (stateResults.warnings > 0 ? 'WARNING' : 'PASS'),
          suiteResults: [stateResults],
          summary: {
            totalTests: stateResults.totalTests,
            totalPassed: stateResults.passed,
            totalFailed: stateResults.failed,
            totalWarnings: stateResults.warnings,
            totalDuration: stateResults.duration
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid test suite specified' },
          { status: 400 }
        );
    }

    const executionTime = Date.now() - startTime;
    console.log(`[EasyParcel Testing] ${testSuite} test suite completed in ${executionTime}ms`);

    // Generate detailed report if requested
    let report = null;
    if (generateReport) {
      report = testSuiteRunner.generateTestReport(results.suiteResults);
    }

    // Filter out detailed error logs unless specifically requested
    let filteredResults = results;
    if (!includeDetailedLogs) {
      filteredResults = {
        ...results,
        suiteResults: results.suiteResults.map(suite => ({
          ...suite,
          results: suite.results.map(result => ({
            ...result,
            error: result.error ? 'Error details available in logs' : undefined
          }))
        }))
      };
    }

    // Environment and configuration info
    const testEnvironment = {
      sandbox: process.env.EASYPARCEL_SANDBOX === 'true',
      baseUrl: process.env.EASYPARCEL_BASE_URL,
      hasApiKey: !!process.env.EASYPARCEL_API_KEY,
      hasApiSecret: !!process.env.EASYPARCEL_API_SECRET,
      testRunId: `test-${Date.now()}`,
      executedBy: session.user.email,
      executedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      testSuite,
      results: filteredResults,
      report,
      environment: testEnvironment,
      performance: {
        executionTimeMs: executionTime,
        testsPerSecond: (results.summary.totalTests / (executionTime / 1000)).toFixed(2)
      },
      recommendations: generateRecommendations(results)
    });

  } catch (error) {
    console.error('Error running EasyParcel tests:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to run EasyParcel tests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') === 'true';

    if (status) {
      // Return testing environment status
      const testEnvironment = {
        sandbox: process.env.EASYPARCEL_SANDBOX === 'true',
        baseUrl: process.env.EASYPARCEL_BASE_URL,
        hasApiKey: !!process.env.EASYPARCEL_API_KEY,
        hasApiSecret: !!process.env.EASYPARCEL_API_SECRET,
        configured: !!(process.env.EASYPARCEL_API_KEY && process.env.EASYPARCEL_API_SECRET),
        lastTestRun: null // Could be stored in database for persistence
      };

      const availableTestSuites = [
        {
          id: 'full',
          name: 'Complete Test Suite',
          description: 'All tests including rates, booking, tracking, tax, errors, and Malaysian states',
          estimatedDuration: '2-5 minutes'
        },
        {
          id: 'rates',
          name: 'Rate Calculation Tests',
          description: 'Test shipping rate calculations across Malaysian states and parcel sizes',
          estimatedDuration: '30-60 seconds'
        },
        {
          id: 'booking',
          name: 'Shipment Booking Tests',
          description: 'Test shipment booking and cancellation functionality',
          estimatedDuration: '20-40 seconds'
        },
        {
          id: 'tracking',
          name: 'Tracking & Webhook Tests',
          description: 'Test tracking API and webhook configuration',
          estimatedDuration: '15-30 seconds'
        },
        {
          id: 'tax',
          name: 'Tax Calculation Tests',
          description: 'Test Malaysian SST integration with shipping costs',
          estimatedDuration: '10-20 seconds'
        },
        {
          id: 'errors',
          name: 'Error Handling Tests',
          description: 'Test API error handling with invalid inputs',
          estimatedDuration: '20-40 seconds'
        },
        {
          id: 'states',
          name: 'Malaysian States Coverage Tests',
          description: 'Test shipping rates across all Malaysian states',
          estimatedDuration: '30-60 seconds'
        }
      ];

      return NextResponse.json({
        success: true,
        environment: testEnvironment,
        availableTestSuites,
        ready: testEnvironment.configured,
        message: testEnvironment.configured 
          ? 'Testing environment is ready' 
          : 'EasyParcel API credentials not configured'
      });
    }

    // Return basic endpoint info
    return NextResponse.json({
      success: true,
      endpoint: 'EasyParcel Testing API',
      methods: ['GET', 'POST'],
      description: 'Comprehensive testing for EasyParcel API integration',
      usage: {
        'GET ?status=true': 'Get testing environment status',
        'POST': 'Run specific test suite'
      }
    });

  } catch (error) {
    console.error('Error in EasyParcel testing status:', error);
    return NextResponse.json(
      { error: 'Failed to get testing status' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results: any): string[] {
  const recommendations: string[] = [];

  if (results.summary.totalFailed > 0) {
    recommendations.push('Review failed tests and check API credentials');
    recommendations.push('Verify EasyParcel sandbox environment configuration');
  }

  if (results.summary.totalWarnings > 0) {
    recommendations.push('Review warning messages for potential issues');
  }

  if (results.summary.totalPassed === 0) {
    recommendations.push('Check network connectivity and API endpoint availability');
    recommendations.push('Verify EasyParcel API credentials in environment variables');
  }

  const successRate = results.summary.totalTests > 0 
    ? (results.summary.totalPassed / results.summary.totalTests) * 100 
    : 0;

  if (successRate < 50) {
    recommendations.push('Consider reviewing EasyParcel integration implementation');
  } else if (successRate < 80) {
    recommendations.push('Address failing tests before production deployment');
  } else if (successRate >= 95) {
    recommendations.push('Integration appears ready for production testing');
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passed successfully!');
    recommendations.push('Ready to proceed with production deployment');
  }

  return recommendations;
}