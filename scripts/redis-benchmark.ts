/**
 * Redis Performance Benchmarking Script
 * Following @REDIS_PRODUCTION_IMPLEMENTATION_PLAN.md benchmarking approach
 * Following @CLAUDE.md: Comprehensive performance testing, systematic measurement
 * 
 * Measures cache performance, throughput, and identifies bottlenecks
 */

import { ServerPostcodeService } from '../src/lib/shipping/server-postcode-service';
import { ProductCacheService } from '../src/lib/cache/product-cache-service';
import { RedisMonitor } from '../src/lib/monitoring/redis-metrics';
import { getRedisConfig } from '../src/lib/config/redis.config';

interface BenchmarkResult {
  testName: string;
  operations: number;
  duration: number;
  operationsPerSecond: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  successRate: number;
  errors: number;
}

interface BenchmarkSuite {
  suiteName: string;
  results: BenchmarkResult[];
  totalOperations: number;
  totalDuration: number;
  overallOpsPerSecond: number;
}

/**
 * Comprehensive Redis Performance Benchmark Suite
 * Following @CLAUDE.md: Systematic performance measurement
 */
class RedisBenchmark {
  private results: BenchmarkSuite[] = [];
  private Redis: any;
  private redis: any;

  constructor() {
    try {
      this.Redis = require('ioredis');
      this.redis = new this.Redis(getRedisConfig());
    } catch (error) {
      console.error('❌ Redis not available for benchmarking');
    }
  }

  /**
   * Execute comprehensive Redis performance benchmarks
   */
  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting Redis Performance Benchmark Suite');
    console.log('=' .repeat(70));
    
    const startTime = Date.now();
    
    // Benchmark suites in order of complexity
    await this.benchmarkBasicOperations();
    await this.benchmarkPostcodeCaching();
    await this.benchmarkProductCaching();
    await this.benchmarkConcurrentOperations();
    await this.benchmarkMemoryPressure();
    
    const totalDuration = Date.now() - startTime;
    await this.generatePerformanceReport(totalDuration);
    
    // Cleanup
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Benchmark basic Redis operations
   * Following plan: Baseline performance measurement
   */
  private async benchmarkBasicOperations(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Basic Redis Operations',
      results: [],
      totalOperations: 0,
      totalDuration: 0,
      overallOpsPerSecond: 0,
    };

    console.log(`\n⚡ Benchmarking: ${suite.suiteName}`);
    console.log('-'.repeat(50));

    if (!this.redis) {
      console.log('  ⏭️ Skipped - Redis not available');
      this.results.push(suite);
      return;
    }

    // Benchmark 1: SET operations
    await this.runBenchmark(suite, 'SET Operations', 1000, async (index) => {
      await this.redis.set(`bench:set:${index}`, `value-${index}`);
    });

    // Benchmark 2: GET operations (after SET)
    await this.runBenchmark(suite, 'GET Operations', 1000, async (index) => {
      await this.redis.get(`bench:set:${index}`);
    });

    // Benchmark 3: DELETE operations
    await this.runBenchmark(suite, 'DELETE Operations', 1000, async (index) => {
      await this.redis.del(`bench:set:${index}`);
    });

    // Benchmark 4: PING operations
    await this.runBenchmark(suite, 'PING Operations', 500, async () => {
      await this.redis.ping();
    });

    this.results.push(suite);
  }

  /**
   * Benchmark postcode caching performance
   * Following plan: Real-world usage simulation
   */
  private async benchmarkPostcodeCaching(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Postcode Caching Performance',
      results: [],
      totalOperations: 0,
      totalDuration: 0,
      overallOpsPerSecond: 0,
    };

    console.log(`\n📮 Benchmarking: ${suite.suiteName}`);
    console.log('-'.repeat(50));

    const postcodeService = ServerPostcodeService.getInstance();
    
    // Popular Malaysian postcodes for realistic testing
    const testPostcodes = [
      '50000', // Kuala Lumpur
      '10000', // Georgetown, Penang
      '80000', // Johor Bahru
      '01000', // Kangar, Perlis
      '70000', // Seremban
      '30000', // Ipoh
      '05000', // Alor Setar
      '20000', // Kuala Terengganu
      '15000', // Kota Bharu
      '25000', // Kuantan
    ];

    // Benchmark 1: Cold cache (first-time lookups)
    await this.runBenchmark(suite, 'Cold Cache Lookups', testPostcodes.length * 5, async (index) => {
      const postcode = testPostcodes[index % testPostcodes.length];
      await postcodeService.validatePostcode(postcode);
    });

    // Benchmark 2: Warm cache (repeat lookups)
    await this.runBenchmark(suite, 'Warm Cache Lookups', testPostcodes.length * 10, async (index) => {
      const postcode = testPostcodes[index % testPostcodes.length];
      await postcodeService.validatePostcode(postcode);
    });

    // Benchmark 3: Mixed cache (80% hits, 20% misses)
    await this.runBenchmark(suite, 'Mixed Cache Access', 200, async (index) => {
      if (index % 5 === 0) {
        // 20% cache misses - new postcode
        await postcodeService.validatePostcode(`${50000 + index}`);
      } else {
        // 80% cache hits - existing postcode
        const postcode = testPostcodes[index % testPostcodes.length];
        await postcodeService.validatePostcode(postcode);
      }
    });

    this.results.push(suite);
  }

  /**
   * Benchmark product caching performance
   * Following plan: Product-specific performance testing
   */
  private async benchmarkProductCaching(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Product Caching Performance',
      results: [],
      totalOperations: 0,
      totalDuration: 0,
      overallOpsPerSecond: 0,
    };

    console.log(`\n🛍️ Benchmarking: ${suite.suiteName}`);
    console.log('-'.repeat(50));

    const productService = new ProductCacheService();
    
    // Generate test product data
    const generateTestProduct = (id: string) => ({
      id,
      name: `Benchmark Product ${id}`,
      slug: `benchmark-product-${id}`,
      regularPrice: Math.round(Math.random() * 1000 * 100) / 100,
      memberPrice: Math.round(Math.random() * 900 * 100) / 100,
      stockQuantity: Math.floor(Math.random() * 100),
      category: 'Electronics',
      status: 'ACTIVE',
      featured: Math.random() > 0.8,
      isPromotional: Math.random() > 0.9,
      images: [
        { url: `/product-${id}-1.jpg`, isPrimary: true },
        { url: `/product-${id}-2.jpg`, isPrimary: false },
      ],
      lastUpdated: Date.now(),
    });

    // Benchmark 1: Product cache writes
    await this.runBenchmark(suite, 'Product Cache Writes', 100, async (index) => {
      const productId = `bench-product-${index}`;
      const product = generateTestProduct(productId);
      await productService.setCachedProduct(productId, product);
    });

    // Benchmark 2: Product cache reads (after writes)
    await this.runBenchmark(suite, 'Product Cache Reads', 200, async (index) => {
      const productId = `bench-product-${index % 100}`;
      await productService.getCachedProduct(productId);
    });

    // Benchmark 3: Batch product operations
    await this.runBenchmark(suite, 'Batch Product Operations', 10, async (index) => {
      const batchData = [];
      for (let i = 0; i < 10; i++) {
        const productId = `batch-${index}-${i}`;
        batchData.push({
          productId,
          data: generateTestProduct(productId),
        });
      }
      await productService.setCachedProducts(batchData);
    });

    this.results.push(suite);
  }

  /**
   * Benchmark concurrent operations
   * Following plan: Concurrency performance testing
   */
  private async benchmarkConcurrentOperations(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Concurrent Operations',
      results: [],
      totalOperations: 0,
      totalDuration: 0,
      overallOpsPerSecond: 0,
    };

    console.log(`\n🔄 Benchmarking: ${suite.suiteName}`);
    console.log('-'.repeat(50));

    const postcodeService = ServerPostcodeService.getInstance();
    const productService = new ProductCacheService();

    // Benchmark 1: Concurrent postcode lookups
    await this.runConcurrentBenchmark(suite, 'Concurrent Postcode Lookups', 50, 10, async (index) => {
      const postcode = ['50000', '10000', '80000', '01000', '70000'][index % 5];
      await postcodeService.validatePostcode(postcode);
    });

    // Benchmark 2: Mixed concurrent operations
    await this.runConcurrentBenchmark(suite, 'Mixed Concurrent Operations', 30, 8, async (index) => {
      if (index % 3 === 0) {
        // Postcode validation
        await postcodeService.validatePostcode('50000');
      } else if (index % 3 === 1) {
        // Product cache read
        await productService.getCachedProduct(`bench-product-${index % 100}`);
      } else {
        // Product cache write
        const product = {
          id: `concurrent-${index}`,
          name: `Concurrent Product ${index}`,
          slug: `concurrent-product-${index}`,
          regularPrice: 99.99,
          memberPrice: 89.99,
          stockQuantity: 10,
          category: 'Test',
          status: 'ACTIVE',
          featured: false,
          isPromotional: false,
          images: [],
          lastUpdated: Date.now(),
        };
        await productService.setCachedProduct(`concurrent-${index}`, product);
      }
    });

    this.results.push(suite);
  }

  /**
   * Benchmark memory pressure scenarios
   * Following plan: Memory utilization testing
   */
  private async benchmarkMemoryPressure(): Promise<void> {
    const suite: BenchmarkSuite = {
      suiteName: 'Memory Pressure Scenarios',
      results: [],
      totalOperations: 0,
      totalDuration: 0,
      overallOpsPerSecond: 0,
    };

    console.log(`\n🧠 Benchmarking: ${suite.suiteName}`);
    console.log('-'.repeat(50));

    if (!this.redis) {
      console.log('  ⏭️ Skipped - Redis not available');
      this.results.push(suite);
      return;
    }

    // Benchmark 1: Large value storage
    await this.runBenchmark(suite, 'Large Value Storage', 50, async (index) => {
      const largeValue = 'x'.repeat(10000); // 10KB values
      await this.redis.set(`large:${index}`, largeValue);
    });

    // Benchmark 2: Many small keys
    await this.runBenchmark(suite, 'Many Small Keys', 1000, async (index) => {
      await this.redis.set(`small:key:${index}`, `value-${index}`);
    });

    // Benchmark 3: Memory cleanup
    await this.runBenchmark(suite, 'Memory Cleanup', 50, async (index) => {
      await this.redis.del(`large:${index}`);
    });

    this.results.push(suite);
  }

  /**
   * Run individual benchmark with timing
   */
  private async runBenchmark(
    suite: BenchmarkSuite,
    testName: string,
    operations: number,
    operation: (index: number) => Promise<void>
  ): Promise<void> {
    const latencies: number[] = [];
    let errors = 0;
    
    console.log(`  📊 Running ${testName} (${operations} ops)...`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < operations; i++) {
      const opStart = Date.now();
      try {
        await operation(i);
        latencies.push(Date.now() - opStart);
      } catch (error) {
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    const successfulOps = operations - errors;
    const opsPerSecond = successfulOps / (duration / 1000);
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const successRate = (successfulOps / operations) * 100;
    
    const result: BenchmarkResult = {
      testName,
      operations,
      duration,
      operationsPerSecond: Math.round(opsPerSecond),
      averageLatency: Math.round(avgLatency * 100) / 100,
      minLatency,
      maxLatency,
      successRate: Math.round(successRate * 100) / 100,
      errors,
    };
    
    suite.results.push(result);
    suite.totalOperations += operations;
    suite.totalDuration += duration;
    
    console.log(`    ⚡ ${Math.round(opsPerSecond)} ops/sec | ⏱️ ${avgLatency.toFixed(1)}ms avg | ✅ ${successRate.toFixed(1)}%`);
  }

  /**
   * Run concurrent benchmark
   */
  private async runConcurrentBenchmark(
    suite: BenchmarkSuite,
    testName: string,
    operations: number,
    concurrency: number,
    operation: (index: number) => Promise<void>
  ): Promise<void> {
    console.log(`  🔄 Running ${testName} (${operations} ops, ${concurrency} concurrent)...`);
    
    const startTime = Date.now();
    const promises: Promise<void>[] = [];
    let errors = 0;
    
    // Create batches for concurrency control
    const batchSize = Math.ceil(operations / concurrency);
    
    for (let batch = 0; batch < concurrency; batch++) {
      const batchPromise = async () => {
        for (let i = batch * batchSize; i < Math.min((batch + 1) * batchSize, operations); i++) {
          try {
            await operation(i);
          } catch (error) {
            errors++;
          }
        }
      };
      promises.push(batchPromise());
    }
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    const successfulOps = operations - errors;
    const opsPerSecond = successfulOps / (duration / 1000);
    const successRate = (successfulOps / operations) * 100;
    
    const result: BenchmarkResult = {
      testName,
      operations,
      duration,
      operationsPerSecond: Math.round(opsPerSecond),
      averageLatency: duration / operations,
      minLatency: 0,
      maxLatency: 0,
      successRate: Math.round(successRate * 100) / 100,
      errors,
    };
    
    suite.results.push(result);
    suite.totalOperations += operations;
    suite.totalDuration += duration;
    
    console.log(`    ⚡ ${Math.round(opsPerSecond)} ops/sec | 🔄 ${concurrency} concurrent | ✅ ${successRate.toFixed(1)}%`);
  }

  /**
   * Generate comprehensive performance report
   */
  private async generatePerformanceReport(totalDuration: number): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('📊 REDIS PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(70));
    
    let totalOperations = 0;
    
    // Detailed results by suite
    this.results.forEach(suite => {
      console.log(`\n🚀 ${suite.suiteName}:`);
      console.log('-'.repeat(50));
      
      suite.results.forEach(result => {
        console.log(`  📊 ${result.testName}:`);
        console.log(`     Operations: ${result.operations.toLocaleString()}`);
        console.log(`     Duration: ${result.duration}ms`);
        console.log(`     Throughput: ${result.operationsPerSecond.toLocaleString()} ops/sec`);
        console.log(`     Latency: ${result.averageLatency}ms avg (${result.minLatency}-${result.maxLatency}ms range)`);
        console.log(`     Success Rate: ${result.successRate}%`);
        if (result.errors > 0) {
          console.log(`     Errors: ${result.errors}`);
        }
        console.log();
      });
      
      // Suite summary
      const suiteTotalOps = suite.results.reduce((sum, r) => sum + r.operations, 0);
      const suiteAvgOpsPerSec = suite.results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / suite.results.length;
      const suiteAvgLatency = suite.results.reduce((sum, r) => sum + r.averageLatency, 0) / suite.results.length;
      
      console.log(`  📈 Suite Summary: ${suiteTotalOps.toLocaleString()} ops | ${Math.round(suiteAvgOpsPerSec).toLocaleString()} avg ops/sec | ${suiteAvgLatency.toFixed(1)}ms avg latency`);
      
      totalOperations += suiteTotalOps;
    });
    
    // Overall performance summary
    console.log('\n' + '='.repeat(70));
    console.log('📈 OVERALL PERFORMANCE SUMMARY:');
    console.log('-'.repeat(70));
    console.log(`Total Operations: ${totalOperations.toLocaleString()}`);
    console.log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    console.log(`Overall Throughput: ${Math.round(totalOperations / (totalDuration / 1000)).toLocaleString()} ops/sec`);
    
    // Performance grades
    const overallOpsPerSec = totalOperations / (totalDuration / 1000);
    let performanceGrade = '';
    let recommendations: string[] = [];
    
    if (overallOpsPerSec > 5000) {
      performanceGrade = '🏆 EXCELLENT';
      recommendations.push('Performance is excellent - system ready for production');
    } else if (overallOpsPerSec > 2000) {
      performanceGrade = '✅ GOOD';
      recommendations.push('Good performance - monitor under production load');
    } else if (overallOpsPerSec > 1000) {
      performanceGrade = '⚠️ FAIR';
      recommendations.push('Consider Redis optimization or hardware upgrade');
      recommendations.push('Review cache key design and TTL policies');
    } else {
      performanceGrade = '❌ POOR';
      recommendations.push('Performance issues detected - investigate Redis configuration');
      recommendations.push('Check network latency and hardware resources');
      recommendations.push('Consider Redis clustering or connection pooling');
    }
    
    console.log(`Performance Grade: ${performanceGrade}`);
    
    // Redis health metrics
    if (this.redis) {
      try {
        const monitor = new RedisMonitor(this.redis);
        const metrics = await monitor.getMetrics();
        const healthCheck = await monitor.performHealthCheck();
        
        console.log('\n📊 CURRENT REDIS METRICS:');
        console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
        console.log(`Memory Used: ${metrics.memoryUsedHuman}`);
        console.log(`Connected Clients: ${metrics.connectedClients}`);
        console.log(`Operations/Second: ${metrics.operationsPerSecond}`);
        console.log(`Health Status: ${healthCheck.status.toUpperCase()} (Score: ${healthCheck.score}/100)`);
      } catch (error) {
        console.log('⚠️ Could not collect Redis metrics');
      }
    }
    
    // Recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 Redis Performance Benchmark Complete');
    console.log('='.repeat(70));
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const benchmark = new RedisBenchmark();
    await benchmark.runAllBenchmarks();
    process.exit(0);
  } catch (error) {
    console.error('❌ Benchmark execution failed:', error);
    process.exit(1);
  }
}

// Run benchmarks if this script is executed directly
if (require.main === module) {
  main();
}