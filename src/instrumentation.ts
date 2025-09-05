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

      // Register cleanup handlers for graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, cleaning up...');
        // No cleanup needed for simplified service
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, cleaning up...');
        // No cleanup needed for simplified service
      });

      console.log('✅ Server instrumentation completed');
    } catch (error) {
      console.error('❌ Error during server instrumentation:', error);
    }
  }
}
