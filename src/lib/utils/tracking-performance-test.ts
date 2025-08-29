/**
 * Tracking Performance Testing Utility
 * Load testing and performance validation for tracking refactor
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { performance } from 'perf_hooks';
import {
  getTrackingCacheByOrderId,
  getCacheStatistics,
} from '../services/tracking-cache';
import { trackingJobProcessor } from '../jobs/tracking-job-processor';
import { TrackingRefactorError } from '../types/tracking-refactor';
import { prisma } from '@/lib/db/prisma';

interface PerformanceTestConfig {
  concurrentRequests: number;
  requestCount: number;
  testDurationMs?: number;
  includeWrites?: boolean;
  testTypes: Array<
    'DATABASE_READ' | 'API_RESPONSE' | 'JOB_PROCESSING' | 'CONCURRENT_LOAD'
  >;
}

interface PerformanceTestResult {
  testType: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughputPerSecond: number;
  totalDurationMs: number;
  errors: string[];
}

interface PerformanceTestSummary {
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  totalDurationMs: number;
  results: PerformanceTestResult[];
  recommendations: string[];
  targetsMet: {
    databaseResponseTime: boolean; // < 100ms
    apiResponseTime: boolean; // < 500ms
    jobProcessingTime: boolean; // < 30s per job
    concurrentLoad: boolean; // Handle 100+ concurrent requests
  };
}

/**
 * Run comprehensive performance tests
 */
export async function runPerformanceTests(
  config: PerformanceTestConfig
): Promise<PerformanceTestSummary> {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting tracking system performance tests...');

  const overallStartTime = performance.now();
  const results: PerformanceTestResult[] = [];
  const recommendations: string[] = [];

  try {
    // Run each test type
    for (const testType of config.testTypes) {
      // eslint-disable-next-line no-console
      console.log(`\n🔄 Running ${testType} test...`);

      let result: PerformanceTestResult;

      switch (testType) {
        case 'DATABASE_READ':
          result = await testDatabaseRead(config);
          break;
        case 'API_RESPONSE':
          result = await testApiResponse(config);
          break;
        case 'JOB_PROCESSING':
          result = await testJobProcessing(config);
          break;
        case 'CONCURRENT_LOAD':
          result = await testConcurrentLoad(config);
          break;
        default:
          throw new TrackingRefactorError(
            `Unknown test type: ${testType}`,
            'INVALID_TEST_TYPE'
          );
      }

      results.push(result);

      // eslint-disable-next-line no-console
      console.log(`✅ ${testType} test completed:`);
      // eslint-disable-next-line no-console
      console.log(
        `  - Average response time: ${result.averageResponseTime.toFixed(2)}ms`
      );
      // eslint-disable-next-line no-console
      console.log(
        `  - Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`
      );
      // eslint-disable-next-line no-console
      console.log(
        `  - Throughput: ${result.throughputPerSecond.toFixed(2)} req/s`
      );
    }

    // Analyze results and generate recommendations
    const targetsMet = analyzeResults(results, recommendations);

    const overallDurationMs = performance.now() - overallStartTime;
    const overallStatus = determineOverallStatus(results, targetsMet);

    // eslint-disable-next-line no-console
    console.log(
      `\n📊 Performance test summary (${overallDurationMs.toFixed(2)}ms):`
    );
    // eslint-disable-next-line no-console
    console.log(`Status: ${overallStatus}`);

    if (recommendations.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => {
        // eslint-disable-next-line no-console
        console.log(`  - ${rec}`);
      });
    }

    return {
      overallStatus,
      totalDurationMs: overallDurationMs,
      results,
      recommendations,
      targetsMet,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Performance testing failed:', error);
    throw new TrackingRefactorError(
      `Performance testing failed: ${error.message}`,
      'PERFORMANCE_TEST_ERROR',
      500
    );
  }
}

/**
 * Test database read performance
 */
async function testDatabaseRead(
  config: PerformanceTestConfig
): Promise<PerformanceTestResult> {
  const { requestCount } = config;
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successfulRequests = 0;

  // Get sample order IDs for testing
  const sampleOrders = await prisma.order.findMany({
    where: {
      trackingCache: { isNot: null },
    },
    select: { id: true },
    take: Math.min(requestCount, 100),
  });

  if (sampleOrders.length === 0) {
    throw new TrackingRefactorError(
      'No orders with tracking cache found for testing',
      'NO_TEST_DATA'
    );
  }

  const startTime = performance.now();

  for (let i = 0; i < requestCount; i++) {
    const orderId = sampleOrders[i % sampleOrders.length].id;
    const requestStart = performance.now();

    try {
      await getTrackingCacheByOrderId(orderId);
      const requestTime = performance.now() - requestStart;
      responseTimes.push(requestTime);
      successfulRequests++;
    } catch (error) {
      const requestTime = performance.now() - requestStart;
      responseTimes.push(requestTime);
      errors.push(error.message);
    }
  }

  const totalDuration = performance.now() - startTime;

  return calculateTestResult(
    'DATABASE_READ',
    requestCount,
    successfulRequests,
    responseTimes,
    totalDuration,
    errors
  );
}

/**
 * Test API response performance (simulated customer requests)
 */
async function testApiResponse(
  config: PerformanceTestConfig
): Promise<PerformanceTestResult> {
  const { requestCount } = config;
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successfulRequests = 0;

  // Get sample tracking data for testing
  const sampleCaches = await prisma.trackingCache.findMany({
    where: {
      isActive: true,
    },
    include: {
      order: {
        select: { orderNumber: true, guestEmail: true },
      },
    },
    take: Math.min(requestCount, 100),
  });

  if (sampleCaches.length === 0) {
    throw new TrackingRefactorError(
      'No active tracking caches found for testing',
      'NO_TEST_DATA'
    );
  }

  const startTime = performance.now();

  for (let i = 0; i < requestCount; i++) {
    const cache = sampleCaches[i % sampleCaches.length];
    const requestStart = performance.now();

    try {
      // Simulate the full API request process
      const trackingCache = await getTrackingCacheByOrderId(cache.orderId);

      if (trackingCache) {
        // Simulate response formatting and filtering
        const filteredEvents = Array.isArray(trackingCache.trackingEvents)
          ? (trackingCache.trackingEvents as Record<string, any>[]).slice(0, 10)
          : [];

        // Simulate response preparation (unused for performance testing)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const _responseData = {
          orderNumber: trackingCache.order.orderNumber,
          currentStatus: trackingCache.currentStatus,
          events: filteredEvents,
          cacheAge: Date.now() - trackingCache.lastApiUpdate.getTime(),
        };
      }

      const requestTime = performance.now() - requestStart;
      responseTimes.push(requestTime);
      successfulRequests++;
    } catch (error) {
      const requestTime = performance.now() - requestStart;
      responseTimes.push(requestTime);
      errors.push(error.message);
    }
  }

  const totalDuration = performance.now() - startTime;

  return calculateTestResult(
    'API_RESPONSE',
    requestCount,
    successfulRequests,
    responseTimes,
    totalDuration,
    errors
  );
}

/**
 * Test job processing performance
 */
async function testJobProcessing(
  config: PerformanceTestConfig
): Promise<PerformanceTestResult> {
  const { requestCount } = config;
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successfulRequests = 0;

  const startTime = performance.now();

  // Test job processing in smaller batches
  const batchSize = 5;
  const batches = Math.ceil(requestCount / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = performance.now();

    try {
      // Process a small batch of jobs
      const result = await trackingJobProcessor.processJobs();

      const batchTime = performance.now() - batchStart;
      responseTimes.push(batchTime);

      if (result.successfulJobs > 0 || result.totalJobs === 0) {
        successfulRequests++;
      } else {
        errors.push(
          `Batch failed: ${result.failedJobs}/${result.totalJobs} jobs failed`
        );
      }
    } catch (error) {
      const batchTime = performance.now() - batchStart;
      responseTimes.push(batchTime);
      errors.push(error.message);
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const totalDuration = performance.now() - startTime;

  return calculateTestResult(
    'JOB_PROCESSING',
    batches,
    successfulRequests,
    responseTimes,
    totalDuration,
    errors
  );
}

/**
 * Test concurrent load handling
 */
async function testConcurrentLoad(
  config: PerformanceTestConfig
): Promise<PerformanceTestResult> {
  const { concurrentRequests, requestCount } = config;
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successfulRequests = 0;

  // Get sample data for concurrent testing
  const sampleOrders = await prisma.order.findMany({
    where: {
      trackingCache: { isNot: null },
    },
    select: { id: true },
    take: 50,
  });

  if (sampleOrders.length === 0) {
    throw new TrackingRefactorError(
      'No orders found for concurrent load testing',
      'NO_TEST_DATA'
    );
  }

  const startTime = performance.now();

  // Create batches of concurrent requests
  const batchCount = Math.ceil(requestCount / concurrentRequests);

  for (let batch = 0; batch < batchCount; batch++) {
    const batchPromises: Promise<void>[] = [];

    // Create concurrent requests
    for (
      let i = 0;
      i < concurrentRequests && batch * concurrentRequests + i < requestCount;
      i++
    ) {
      const orderId = sampleOrders[i % sampleOrders.length].id;

      batchPromises.push(
        (async () => {
          const requestStart = performance.now();
          try {
            await getTrackingCacheByOrderId(orderId);
            const requestTime = performance.now() - requestStart;
            responseTimes.push(requestTime);
            successfulRequests++;
          } catch (error) {
            const requestTime = performance.now() - requestStart;
            responseTimes.push(requestTime);
            errors.push(error.message);
          }
        })()
      );
    }

    // Wait for all concurrent requests to complete
    await Promise.all(batchPromises);
  }

  const totalDuration = performance.now() - startTime;

  return calculateTestResult(
    'CONCURRENT_LOAD',
    requestCount,
    successfulRequests,
    responseTimes,
    totalDuration,
    errors
  );
}

/**
 * Calculate test result statistics
 */
function calculateTestResult(
  testType: string,
  totalRequests: number,
  successfulRequests: number,
  responseTimes: number[],
  totalDurationMs: number,
  errors: string[]
): PerformanceTestResult {
  const sortedTimes = responseTimes.sort((a, b) => a - b);

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  const minResponseTime =
    responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxResponseTime =
    responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p99Index = Math.floor(sortedTimes.length * 0.99);

  const p95ResponseTime =
    sortedTimes.length > 0 ? sortedTimes[p95Index] || maxResponseTime : 0;
  const p99ResponseTime =
    sortedTimes.length > 0 ? sortedTimes[p99Index] || maxResponseTime : 0;

  const throughputPerSecond =
    totalDurationMs > 0 ? totalRequests / (totalDurationMs / 1000) : 0;

  return {
    testType,
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    throughputPerSecond,
    totalDurationMs,
    errors: errors.slice(0, 10), // Limit error samples
  };
}

/**
 * Analyze results and generate recommendations
 */
function analyzeResults(
  results: PerformanceTestResult[],
  recommendations: string[]
): PerformanceTestSummary['targetsMet'] {
  const targets = {
    databaseResponseTime: true,
    apiResponseTime: true,
    jobProcessingTime: true,
    concurrentLoad: true,
  };

  for (const result of results) {
    const successRate =
      (result.successfulRequests / result.totalRequests) * 100;

    // Check database performance (< 100ms average)
    if (result.testType === 'DATABASE_READ') {
      if (result.averageResponseTime > 100) {
        targets.databaseResponseTime = false;
        recommendations.push(
          `Database queries are slow (${result.averageResponseTime.toFixed(2)}ms avg). Consider indexing optimization.`
        );
      }
    }

    // Check API performance (< 500ms average)
    if (result.testType === 'API_RESPONSE') {
      if (result.averageResponseTime > 500) {
        targets.apiResponseTime = false;
        recommendations.push(
          `API responses are slow (${result.averageResponseTime.toFixed(2)}ms avg). Optimize response formatting.`
        );
      }
    }

    // Check job processing (< 30s average)
    if (result.testType === 'JOB_PROCESSING') {
      if (result.averageResponseTime > 30000) {
        targets.jobProcessingTime = false;
        recommendations.push(
          `Job processing is slow (${(result.averageResponseTime / 1000).toFixed(2)}s avg). Optimize job logic.`
        );
      }
    }

    // Check concurrent load handling (> 95% success rate)
    if (result.testType === 'CONCURRENT_LOAD') {
      if (successRate < 95) {
        targets.concurrentLoad = false;
        recommendations.push(
          `Concurrent load handling is poor (${successRate.toFixed(2)}% success). Check connection pooling.`
        );
      }
    }

    // General recommendations
    if (successRate < 90) {
      recommendations.push(
        `${result.testType} has low success rate (${successRate.toFixed(2)}%). Investigate error patterns.`
      );
    }

    if (result.p99ResponseTime > result.averageResponseTime * 5) {
      recommendations.push(
        `${result.testType} has high response time variance. Check for performance outliers.`
      );
    }
  }

  return targets;
}

/**
 * Determine overall test status
 */
function determineOverallStatus(
  results: PerformanceTestResult[],
  targetsMet: PerformanceTestSummary['targetsMet']
): 'PASS' | 'FAIL' | 'WARNING' {
  const allTargetsMet = Object.values(targetsMet).every(met => met);

  if (allTargetsMet) {
    // Check for any major failures
    const hasFailures = results.some(
      result => result.successfulRequests / result.totalRequests < 0.8
    );

    if (hasFailures) {
      return 'WARNING';
    }

    return 'PASS';
  }

  return 'FAIL';
}

/**
 * Run quick performance validation
 */
export async function validatePerformance(): Promise<{
  isValid: boolean;
  issues: string[];
  metrics: Record<string, number>;
}> {
  const issues: string[] = [];
  const metrics: Record<string, number> = {};

  try {
    // Test basic database performance
    const dbStart = performance.now();
    await getCacheStatistics();
    const dbTime = performance.now() - dbStart;
    metrics.databaseResponseTime = dbTime;

    if (dbTime > 200) {
      issues.push(`Database queries are slow: ${dbTime.toFixed(2)}ms`);
    }

    // Test memory usage (approximate)
    if (
      process.memoryUsage &&
      process.memoryUsage().heapUsed > 512 * 1024 * 1024
    ) {
      issues.push('High memory usage detected');
    }

    return {
      isValid: issues.length === 0,
      issues,
      metrics,
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Performance validation failed: ${error.message}`],
      metrics,
    };
  }
}
