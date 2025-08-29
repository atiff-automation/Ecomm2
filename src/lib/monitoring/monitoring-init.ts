/**
 * Monitoring Initialization - Malaysian E-commerce Platform
 * Initialize monitoring systems on application startup
 */

import { errorMonitor } from './error-monitor';

interface MonitoringInitOptions {
  enableErrorReporting?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableUserTracking?: boolean;
  enableBreadcrumbs?: boolean;
  sampleRate?: number;
}

/**
 * Initialize monitoring system
 */
export async function initializeMonitoring(
  options: MonitoringInitOptions = {}
): Promise<{
  success: boolean;
  errorReporting: boolean;
  performanceMonitoring: boolean;
  userTracking: boolean;
  errors: string[];
}> {
  const results = {
    success: false,
    errorReporting: false,
    performanceMonitoring: false,
    userTracking: false,
    errors: [] as string[],
  };

  console.log('🚀 Initializing monitoring system...');

  try {
    // Update monitoring configuration
    const config = {
      enableErrorReporting: options.enableErrorReporting !== false,
      enablePerformanceMonitoring:
        options.enablePerformanceMonitoring !== false,
      enableUserTracking: options.enableUserTracking !== false,
      sampleRate:
        options.sampleRate ||
        (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
      endpoints: {
        errors: '/api/monitoring/errors',
        performance: '/api/monitoring/performance',
        events: '/api/monitoring/events',
      },
      maxBreadcrumbs: 50,
      ignoredErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'ChunkLoadError',
        /^Non-Error promise rejection captured/,
        /Loading chunk \\d+ failed/,
        /Script error/,
      ],
    };

    errorMonitor.updateConfig(config);

    results.errorReporting = config.enableErrorReporting;
    results.performanceMonitoring = config.enablePerformanceMonitoring;
    results.userTracking = config.enableUserTracking;

    // Add initialization breadcrumb
    errorMonitor.addBreadcrumb('Monitoring system initialized', 'info');

    // Test API endpoints in production
    if (process.env.NODE_ENV === 'production') {
      await testMonitoringEndpoints();
    }

    results.success = true;
    console.log('✅ Monitoring system initialized successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`Monitoring initialization failed: ${errorMessage}`);
    console.error('❌ Monitoring system initialization failed:', error);
  }

  return results;
}

/**
 * Test monitoring endpoints
 */
async function testMonitoringEndpoints(): Promise<void> {
  const endpoints = [
    '/api/monitoring/errors',
    '/api/monitoring/performance',
    '/api/monitoring/events',
  ];

  const testPromises = endpoints.map(async endpoint => {
    try {
      const response = await fetch(endpoint, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Endpoint ${endpoint} returned ${response.status}`);
      }
      console.log(`✅ Monitoring endpoint ${endpoint} is healthy`);
    } catch (error) {
      console.warn(`⚠️ Monitoring endpoint ${endpoint} test failed:`, error);
      throw error;
    }
  });

  await Promise.all(testPromises);
}

/**
 * Get monitoring system health
 */
export async function getMonitoringHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    errorMonitor: 'healthy' | 'unhealthy';
    apiEndpoints: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: number;
  };
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();

  try {
    // Check error monitor
    const stats = errorMonitor.getStats();
    const errorMonitorStatus = stats ? 'healthy' : 'unhealthy';

    // Check API endpoints
    let apiEndpointsStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let healthyEndpoints = 0;
    const totalEndpoints = 3;

    const endpointChecks = [
      '/api/monitoring/errors',
      '/api/monitoring/performance',
      '/api/monitoring/events',
    ].map(async endpoint => {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (response.ok) {
          healthyEndpoints++;
        }
      } catch {
        // Endpoint is unhealthy
      }
    });

    await Promise.all(endpointChecks);

    // Determine API status
    if (healthyEndpoints === totalEndpoints) {
      apiEndpointsStatus = 'healthy';
    } else if (healthyEndpoints > 0) {
      apiEndpointsStatus = 'degraded';
    } else {
      apiEndpointsStatus = 'unhealthy';
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (
      errorMonitorStatus === 'unhealthy' ||
      apiEndpointsStatus === 'unhealthy'
    ) {
      overallStatus = 'unhealthy';
    } else if (apiEndpointsStatus === 'degraded') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      details: {
        errorMonitor: errorMonitorStatus,
        apiEndpoints: apiEndpointsStatus,
        memoryUsage,
      },
      timestamp,
    };
  } catch (error) {
    console.error('Error checking monitoring health:', error);

    return {
      status: 'unhealthy',
      details: {
        errorMonitor: 'unhealthy',
        apiEndpoints: 'unhealthy',
        memoryUsage: 0,
      },
      timestamp,
    };
  }
}

/**
 * Shutdown monitoring system
 */
export async function shutdownMonitoring(): Promise<void> {
  console.log('🔄 Shutting down monitoring system...');

  try {
    errorMonitor.addBreadcrumb('Monitoring system shutting down', 'info');

    // Clear any remaining breadcrumbs
    errorMonitor.clearBreadcrumbs();

    console.log('✅ Monitoring system shutdown completed');
  } catch (error) {
    console.error('❌ Error during monitoring shutdown:', error);
  }
}

/**
 * Create monitoring health check middleware
 */
export function createMonitoringHealthCheck() {
  return async (req: any, res: any, next: any) => {
    try {
      const health = await getMonitoringHealth();

      // Add monitoring health to request context
      req.monitoringHealth = health;

      // Log degraded status
      if (health.status === 'degraded') {
        console.warn(
          '⚠️ Monitoring system is in degraded state:',
          health.details
        );
      } else if (health.status === 'unhealthy') {
        console.error('❌ Monitoring system is unhealthy:', health.details);
      }

      next();
    } catch (error) {
      console.error('Monitoring health check failed:', error);
      // Don't block the request
      req.monitoringHealth = {
        status: 'unhealthy',
        details: { error: 'Health check failed' },
        timestamp: new Date().toISOString(),
      };
      next();
    }
  };
}
