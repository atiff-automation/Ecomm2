/**
 * Next.js Instrumentation - Server Initialization
 * This file runs once when the server starts to initialize critical services
 * FOLLOWS @CLAUDE.md: Crash Detection | Process Monitoring | Error Tracking
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server instrumentation starting...');

    try {
      // Initialize crash detector FIRST (for error tracking)
      const { crashDetector } = await import('../lib/monitoring/crash-detector');
      console.log('✅ Crash detector initialized');

      // Track deployment start
      crashDetector.trackDeployment('start', {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        railway: process.env.RAILWAY_ENVIRONMENT || 'local',
      });

      // Import and initialize simplified Telegram service
      const { simplifiedTelegramService } = await import(
        '@/lib/telegram/simplified-telegram-service'
      );

      // Force load configuration and start health checks
      await simplifiedTelegramService.reloadConfiguration();
      console.log('✅ Simplified Telegram service initialized');

      // Track successful deployment
      crashDetector.trackDeployment('success', {
        timestamp: new Date().toISOString(),
        services: ['telegram', 'crash-detector'],
      });

      console.log('✅ Server instrumentation completed');
    } catch (error) {
      console.error('❌ Error during server instrumentation:', error);

      // Track deployment failure
      try {
        const { crashDetector } = await import('../lib/monitoring/crash-detector');
        crashDetector.trackDeployment('failure', {
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      } catch {
        // Fallback if crash detector itself fails
        console.error('Failed to track deployment failure');
      }
    }
  }
}
