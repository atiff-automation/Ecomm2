/**
 * EasyParcel Performance Benchmark API
 * Performance testing and benchmarking for EasyParcel integration
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelService } from '@/lib/shipping/easyparcel-service';
import { TaxInclusiveShippingCalculator } from '@/lib/shipping/tax-inclusive-shipping-calculator';
import { z } from 'zod';

const benchmarkRequestSchema = z.object({
  testType: z.enum(['rate_calculation', 'tax_calculation', 'concurrent_requests', 'load_test']),
  iterations: z.number().min(1).max(100).optional().default(10),
  concurrency: z.number().min(1).max(20).optional().default(5),
  includeDetailedMetrics: z.boolean().optional().default(false),
});

interface BenchmarkResult {
  testType: string;
  iterations: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  requestsPerSecond: number;
  errors: string[];
  detailedMetrics?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testType, iterations, concurrency, includeDetailedMetrics } = benchmarkRequestSchema.parse(body);

    console.log(`[EasyParcel Benchmark] Starting ${testType} with ${iterations} iterations...`);
    const startTime = Date.now();

    let benchmarkResult: BenchmarkResult;

    switch (testType) {
      case 'rate_calculation':
        benchmarkResult = await benchmarkRateCalculation(iterations, includeDetailedMetrics);
        break;
      
      case 'tax_calculation':
        benchmarkResult = await benchmarkTaxCalculation(iterations, includeDetailedMetrics);
        break;
      
      case 'concurrent_requests':
        benchmarkResult = await benchmarkConcurrentRequests(concurrency, includeDetailedMetrics);
        break;
      
      case 'load_test':
        benchmarkResult = await benchmarkLoadTest(iterations, concurrency, includeDetailedMetrics);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type specified' },
          { status: 400 }
        );
    }

    const totalExecutionTime = Date.now() - startTime;
    console.log(`[EasyParcel Benchmark] ${testType} completed in ${totalExecutionTime}ms`);

    // Performance analysis
    const analysis = {
      performance: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
      bottlenecks: [] as string[],
      recommendations: [] as string[]
    };

    // Analyze performance
    if (benchmarkResult.averageDuration > 5000) {
      analysis.performance = 'poor';
      analysis.bottlenecks.push('High average response time');
      analysis.recommendations.push('Check network connectivity and API endpoint performance');
    } else if (benchmarkResult.averageDuration > 2000) {
      analysis.performance = 'fair';
      analysis.bottlenecks.push('Moderate response times');
      analysis.recommendations.push('Consider implementing caching for frequently accessed data');
    } else if (benchmarkResult.averageDuration < 500) {
      analysis.performance = 'excellent';
    }

    if (benchmarkResult.successRate < 95) {
      analysis.bottlenecks.push('Low success rate');
      analysis.recommendations.push('Investigate and fix failing requests');
    }

    if (benchmarkResult.requestsPerSecond < 1) {
      analysis.bottlenecks.push('Low throughput');
      analysis.recommendations.push('Optimize request handling and consider connection pooling');
    }

    // System metrics
    const systemMetrics = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV
    };

    return NextResponse.json({
      success: true,
      benchmark: benchmarkResult,
      analysis,
      systemMetrics,
      executionInfo: {
        executedAt: new Date().toISOString(),
        executedBy: session.user.email,
        totalExecutionTime,
        environment: {
          sandbox: process.env.EASYPARCEL_SANDBOX === 'true',
          hasApiKey: !!process.env.EASYPARCEL_API_KEY
        }
      }
    });

  } catch (error) {
    console.error('Error running EasyParcel benchmark:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid benchmark parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to run benchmark test',
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

    const availableBenchmarks = [
      {
        testType: 'rate_calculation',
        name: 'Rate Calculation Performance',
        description: 'Benchmark shipping rate calculation speed and reliability',
        estimatedDuration: '30-120 seconds',
        defaultIterations: 10
      },
      {
        testType: 'tax_calculation',
        name: 'Tax Calculation Performance',
        description: 'Benchmark Malaysian tax calculation performance',
        estimatedDuration: '15-60 seconds',
        defaultIterations: 20
      },
      {
        testType: 'concurrent_requests',
        name: 'Concurrent Request Handling',
        description: 'Test API performance under concurrent load',
        estimatedDuration: '60-180 seconds',
        defaultConcurrency: 5
      },
      {
        testType: 'load_test',
        name: 'Load Testing',
        description: 'Comprehensive load test with multiple concurrent requests',
        estimatedDuration: '120-300 seconds',
        defaultIterations: 50,
        defaultConcurrency: 10
      }
    ];

    return NextResponse.json({
      success: true,
      availableBenchmarks,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
        sandboxMode: process.env.EASYPARCEL_SANDBOX === 'true'
      }
    });

  } catch (error) {
    console.error('Error getting benchmark info:', error);
    return NextResponse.json(
      { error: 'Failed to get benchmark information' },
      { status: 500 }
    );
  }
}

/**
 * Benchmark rate calculation performance
 */
async function benchmarkRateCalculation(iterations: number, includeDetailedMetrics: boolean): Promise<BenchmarkResult> {
  const durations: number[] = [];
  const errors: string[] = [];
  const detailedMetrics: any[] = [];

  const testRequest = {
    pickup_address: {
      postcode: '50000',
      state: 'KUL',
      city: 'Kuala Lumpur',
      country: 'MY'
    },
    delivery_address: {
      postcode: '40000',
      state: 'SEL',
      city: 'Shah Alam',
      country: 'MY'
    },
    parcel: {
      weight: 1.0,
      content: 'Test package',
      value: 100,
      quantity: 1
    }
  };

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      const result = await easyParcelService.calculateRates(testRequest);
      const duration = Date.now() - startTime;
      durations.push(duration);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          iteration: i + 1,
          duration,
          rateCount: result.rates?.length || 0,
          success: true
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      durations.push(duration);
      errors.push(`Iteration ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          iteration: i + 1,
          duration,
          rateCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return calculateBenchmarkStats('rate_calculation', iterations, durations, errors, detailedMetrics);
}

/**
 * Benchmark tax calculation performance
 */
async function benchmarkTaxCalculation(iterations: number, includeDetailedMetrics: boolean): Promise<BenchmarkResult> {
  const taxCalculator = new TaxInclusiveShippingCalculator();
  const durations: number[] = [];
  const errors: string[] = [];
  const detailedMetrics: any[] = [];

  const testRequest = {
    pickupAddress: {
      postcode: '50000',
      state: 'KUL',
      city: 'Kuala Lumpur'
    },
    deliveryAddress: {
      postcode: '40000',
      state: 'SEL',
      city: 'Shah Alam'
    },
    parcel: {
      weight: 1.0,
      value: 100
    },
    displayTaxInclusive: true
  };

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      const result = await taxCalculator.calculateTaxInclusiveRates(testRequest);
      const duration = Date.now() - startTime;
      durations.push(duration);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          iteration: i + 1,
          duration,
          rateCount: result.length,
          success: true
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      durations.push(duration);
      errors.push(`Iteration ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          iteration: i + 1,
          duration,
          rateCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return calculateBenchmarkStats('tax_calculation', iterations, durations, errors, detailedMetrics);
}

/**
 * Benchmark concurrent request handling
 */
async function benchmarkConcurrentRequests(concurrency: number, includeDetailedMetrics: boolean): Promise<BenchmarkResult> {
  const durations: number[] = [];
  const errors: string[] = [];
  const detailedMetrics: any[] = [];

  const testRequest = {
    pickup_address: {
      postcode: '50000',
      state: 'KUL',
      city: 'Kuala Lumpur',
      country: 'MY'
    },
    delivery_address: {
      postcode: '40000',
      state: 'SEL',
      city: 'Shah Alam',
      country: 'MY'
    },
    parcel: {
      weight: 1.0,
      content: 'Test package',
      value: 100,
      quantity: 1
    }
  };

  const promises = Array(concurrency).fill(null).map(async (_, index) => {
    const startTime = Date.now();
    try {
      const result = await easyParcelService.calculateRates(testRequest);
      const duration = Date.now() - startTime;
      durations.push(duration);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          requestId: index + 1,
          duration,
          rateCount: result.rates?.length || 0,
          success: true
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      durations.push(duration);
      errors.push(`Request ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (includeDetailedMetrics) {
        detailedMetrics.push({
          requestId: index + 1,
          duration,
          rateCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  await Promise.all(promises);

  return calculateBenchmarkStats('concurrent_requests', concurrency, durations, errors, detailedMetrics);
}

/**
 * Benchmark load testing
 */
async function benchmarkLoadTest(iterations: number, concurrency: number, includeDetailedMetrics: boolean): Promise<BenchmarkResult> {
  const durations: number[] = [];
  const errors: string[] = [];
  const detailedMetrics: any[] = [];

  const batches = Math.ceil(iterations / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, iterations - (batch * concurrency));
    const batchResult = await benchmarkConcurrentRequests(batchSize, includeDetailedMetrics);
    
    durations.push(...batchResult.detailedMetrics?.map(m => m.duration) || []);
    errors.push(...batchResult.errors);
    
    if (includeDetailedMetrics && batchResult.detailedMetrics) {
      detailedMetrics.push(...batchResult.detailedMetrics.map(m => ({
        ...m,
        batch: batch + 1,
        requestId: `${batch + 1}-${m.requestId}`
      })));
    }
  }

  return calculateBenchmarkStats('load_test', iterations, durations, errors, detailedMetrics);
}

/**
 * Calculate benchmark statistics
 */
function calculateBenchmarkStats(
  testType: string,
  iterations: number,
  durations: number[],
  errors: string[],
  detailedMetrics: any[]
): BenchmarkResult {
  const successfulRequests = durations.length - errors.length;
  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const averageDuration = durations.length > 0 ? totalDuration / durations.length : 0;
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const successRate = iterations > 0 ? (successfulRequests / iterations) * 100 : 0;
  const requestsPerSecond = totalDuration > 0 ? (successfulRequests / (totalDuration / 1000)) : 0;

  return {
    testType,
    iterations,
    totalDuration,
    averageDuration,
    minDuration,
    maxDuration,
    successRate,
    requestsPerSecond,
    errors,
    detailedMetrics: detailedMetrics.length > 0 ? detailedMetrics : undefined
  };
}