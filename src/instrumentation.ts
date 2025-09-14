/**
 * Next.js Instrumentation - Server Initialization
 * This file runs once when the server starts to initialize critical services
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server instrumentation starting...');

    try {
      // Import and initialize simplified Telegram service
      const { simplifiedTelegramService } = await import(
        '@/lib/telegram/simplified-telegram-service'
      );

      // Force load configuration and start health checks
      await simplifiedTelegramService.reloadConfiguration();
      console.log('✅ Simplified Telegram service initialized');

      // Initialize cron-based background services for production readiness
      const { trackingCronManager } = await import('@/lib/jobs/tracking-cron');

      // Check if cron manager is already running
      const currentStatus = trackingCronManager.getStatus();

      if (currentStatus.isRunning) {
        console.log('✅ Tracking cron manager already running');
      } else {
        console.log('⏰ Starting tracking cron manager for automatic cleanup...');
        await trackingCronManager.start();

        console.log('✅ Cron-based cleanup system started successfully');
        console.log('📋 Automatic services now active:');
        console.log('  - Chat session cleanup: Every 15 minutes');
        console.log('  - Urgent jobs processing: Every 15 minutes');
        console.log('  - Regular updates: Every hour');
        console.log('  - Cleanup tasks: Every 6 hours');
        console.log('  - Daily maintenance: Every 24 hours');
      }

      // Register cleanup handlers for graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, stopping background services...');
        trackingCronManager.stop();
        console.log('✅ Cron-based services stopped');
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, stopping background services...');
        trackingCronManager.stop();
        console.log('✅ Cron-based services stopped');
      });

      console.log('✅ Server instrumentation completed');
    } catch (error) {
      console.error('❌ Error during server instrumentation:', error);
    }
  }
}
