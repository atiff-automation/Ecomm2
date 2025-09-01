/**
 * Instrumentation - Malaysian E-commerce Platform
 * Server-side initialization for caching and monitoring systems
 */

import { initializeCache } from '@/lib/cache/cache-init';
import { initializeMonitoring } from '@/lib/monitoring/monitoring-init';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Starting server-side initialization...');

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
      console.log('📊 Initializing monitoring system with environment controls...');
      const monitoringResult = await initializeMonitoring({
        enableErrorReporting: process.env.ENABLE_ERROR_MONITORING === 'true',
        enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
        enableUserTracking: process.env.ENABLE_USER_TRACKING === 'true',
        sampleRate: process.env.MONITORING_EMERGENCY_DISABLE === 'true' ? 0 : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
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
        setInterval(
          async () => {
            try {
              const { getMonitoringHealth } = await import(
                '@/lib/monitoring/monitoring-init'
              );
              const health = await getMonitoringHealth();

              if (health.status === 'unhealthy') {
                console.error('🚨 System health check failed:', health);
              } else if (health.status === 'degraded') {
                console.warn('⚠️ System health degraded:', health);
              }
            } catch (error) {
              console.error('❌ Health check error:', error);
            }
          },
          5 * 60 * 1000
        ); // Every 5 minutes
      }

      console.log('🎉 Server-side initialization completed successfully');
    } catch (error) {
      console.error('❌ Server-side initialization failed:', error);

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
