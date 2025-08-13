/**
 * Server-side initialization utilities
 * Ensures critical services are running
 */

let initialized = false;

export async function ensureServerInitialized() {
  // Prevent multiple initializations
  if (initialized || typeof window !== 'undefined') {
    return;
  }

  try {
    console.log('🔧 Ensuring server services are initialized...');

    // Import and ensure Telegram service is running
    const { telegramService } = await import('@/lib/telegram/telegram-service');

    // Check if configuration is loaded and service is healthy
    const isConfigured = await telegramService.isConfigured();
    if (isConfigured) {
      console.log('✅ Telegram service is configured and running');
    } else {
      console.log(
        '⚠️ Telegram service not configured (missing bot token or chat IDs)'
      );
    }

    initialized = true;
    console.log('✅ Server initialization check completed');
  } catch (error) {
    console.error('❌ Error during server initialization check:', error);
  }
}
