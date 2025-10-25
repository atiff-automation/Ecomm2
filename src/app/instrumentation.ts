/**
 * Instrumentation - Malaysian E-commerce Platform
 * Server-side initialization for caching, monitoring, and crash detection systems
 */

import { initializeCache } from '@/lib/cache/cache-init';
import { initializeMonitoring } from '@/lib/monitoring/monitoring-init';
import { crashLogger } from '@/lib/monitoring/crash-logger';

// Store interval references for cleanup
let healthCheckInterval: NodeJS.Timeout | null = null;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Starting server-side initialization...');

    // Initialize crash logger FIRST to catch any initialization errors
    crashLogger.initialize();
    console.log('✅ Crash logger initialized');

    try {
      // Initialize cache system
      console.log('📦 Initializing cache system...');
      const cacheResult = await initializeCache({
        enableRedis: process.env.NODE_ENV === 'production',
        enableWarmup: true,
        warmupTasks: [
          'featured-products',
          'product-categories',
          'top-selling-products',
        ],
        healthCheck: true,
      });

      if (cacheResult.success) {
        console.log('✅ Cache system initialized successfully');
        console.log(`   - Redis: ${cacheResult.redis ? '✅' : '❌'}`);
        console.log(`   - Memory: ${cacheResult.memory ? '✅' : '❌'}`);

        if (cacheResult.errors.length > 0) {
          console.warn('⚠️ Cache initialization warnings:', cacheResult.errors);
        }
      } else {
        console.error(
          '❌ Cache system initialization failed:',
          cacheResult.errors
        );
      }

      // Initialize monitoring system - Systematic configuration via environment variables
      console.log(
        '📊 Initializing monitoring system with environment controls...'
      );
      const monitoringResult = await initializeMonitoring({
        enableErrorReporting: process.env.ENABLE_ERROR_MONITORING === 'true',
        enablePerformanceMonitoring:
          process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
        enableUserTracking: process.env.ENABLE_USER_TRACKING === 'true',
        sampleRate:
          process.env.MONITORING_EMERGENCY_DISABLE === 'true'
            ? 0
            : process.env.NODE_ENV === 'production'
              ? 0.1
              : 1.0,
      });

      if (monitoringResult.success) {
        console.log('✅ Monitoring system initialized successfully');
        console.log(
          `   - Error Reporting: ${monitoringResult.errorReporting ? '✅' : '❌'}`
        );
        console.log(
          `   - Performance: ${monitoringResult.performanceMonitoring ? '✅' : '❌'}`
        );
        console.log(
          `   - User Tracking: ${monitoringResult.userTracking ? '✅' : '❌'}`
        );

        if (monitoringResult.errors.length > 0) {
          console.warn(
            '⚠️ Monitoring initialization warnings:',
            monitoringResult.errors
          );
        }
      } else {
        console.error(
          '❌ Monitoring system initialization failed:',
          monitoringResult.errors
        );
      }

      // Log environment information
      console.log('🌍 Environment Configuration:');
      console.log(`   - Node ENV: ${process.env.NODE_ENV}`);
      console.log(`   - Next Runtime: ${process.env.NEXT_RUNTIME}`);
      console.log(
        `   - Build ID: ${process.env.NEXT_PUBLIC_BUILD_ID || 'development'}`
      );

      // Schedule periodic health checks in production
      if (process.env.NODE_ENV === 'production') {
        healthCheckInterval = setInterval(
          async () => {
            try {
              const { getMonitoringHealth } = await import(
                '@/lib/monitoring/monitoring-init'
              );
              const health = await getMonitoringHealth();

              if (health.status === 'unhealthy') {
                console.error('🚨 System health check failed:', health);
                crashLogger.logCustomEvent('Health check failed', { health });
              } else if (health.status === 'degraded') {
                console.warn('⚠️ System health degraded:', health);
                crashLogger.logCustomEvent('Health check degraded', { health });
              }
            } catch (error) {
              console.error('❌ Health check error:', error);
              crashLogger.logCustomEvent('Health check error', {
                error: error instanceof Error ? error.message : String(error)
              });
            }
          },
          5 * 60 * 1000
        ); // Every 5 minutes
      }

      // Setup cleanup on shutdown
      setupCleanupHandlers();

      console.log('🎉 Server-side initialization completed successfully');
    } catch (error) {
      console.error('❌ Server-side initialization failed:', error);
      crashLogger.logCustomEvent('Instrumentation initialization failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Don't crash the application, just log the error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
    }
  }
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers() {
  const cleanup = () => {
    console.log('🧹 Cleaning up instrumentation resources...');

    // Clear health check interval
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
      console.log('✅ Health check interval cleared');
    }
  };

  // These handlers are registered by crash-logger.ts already
  // We just add our specific cleanup logic
  process.once('beforeExit', cleanup);
}
