/**
 * Next.js Instrumentation - Server Initialization
 * This file runs once when the server starts to initialize critical services
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server instrumentation starting...');
    
    try {
      // Import and initialize Telegram service
      const { telegramService } = await import('@/lib/telegram/telegram-service');
      
      // Force load configuration and start health checks
      await telegramService.reloadConfiguration();
      
      console.log('✅ Telegram service initialized');
      
      // Register cleanup handlers for graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, cleaning up...');
        telegramService.cleanup();
      });
      
      process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, cleaning up...');
        telegramService.cleanup();
      });
      
      console.log('✅ Server instrumentation completed');
    } catch (error) {
      console.error('❌ Error during server instrumentation:', error);
    }
  }
}