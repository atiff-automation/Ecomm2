'use client';

import { useEffect } from 'react';

/**
 * TelegramHealthCheck Component
 * Ensures Telegram service is initialized and running by calling health check endpoint
 */
export function TelegramHealthCheck() {
  useEffect(() => {
    // Function to check and ensure Telegram service is running
    const checkTelegramHealth = async () => {
      try {
        const response = await fetch('/api/health/telegram');
        const data = await response.json();

        if (data.telegram?.configured) {
          console.log('✅ Telegram service is configured and running');
        } else {
          console.log('⚠️ Telegram service not configured');
        }
      } catch (error) {
        console.error('❌ Failed to check Telegram health:', error);
      }
    };

    // Check immediately on mount
    checkTelegramHealth();

    // Check periodically every 5 minutes to ensure service stays alive
    const interval = setInterval(checkTelegramHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything visible
  return null;
}
