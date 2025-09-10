#!/usr/bin/env tsx

/**
 * Chat Webhook Queue Worker
 * Standalone process to handle webhook queue processing
 */

import { queueProcessor } from '../src/lib/chat/queue-processor';
import { webhookService } from '../src/lib/chat/webhook-service';

console.log('🚀 Starting Chat Webhook Queue Worker...');

async function startWorker() {
  try {
    // Perform health check before starting
    const health = await webhookService.healthCheck();
    console.log('📊 Service Health Check:', {
      status: health.status,
      queueStats: health.queueStats,
      config: health.configStatus
    });

    if (health.status === 'unhealthy') {
      console.error('❌ Service is unhealthy, cannot start worker');
      console.error('Configuration status:', health.configStatus);
      process.exit(1);
    }

    if (health.status === 'degraded') {
      console.warn('⚠️  Service is degraded but starting anyway...');
    }

    // Start the queue processor
    queueProcessor.start();

    console.log('✅ Chat Webhook Queue Worker started successfully');
    console.log('📈 Queue Statistics:', health.queueStats);

    // Set up periodic health checks and cleanup
    setInterval(async () => {
      try {
        const stats = await queueProcessor.getQueueStats();
        console.log('📊 Queue Stats:', stats);
        
        // Clean up completed items older than 7 days
        if (stats.completed > 100) {
          await queueProcessor.cleanupCompletedItems(7);
        }
      } catch (error) {
        console.error('❌ Periodic health check failed:', error);
      }
    }, 60000); // Every minute

    // Clean up completed items on startup
    const cleanedCount = await queueProcessor.cleanupCompletedItems(7);
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old completed items`);
    }

  } catch (error) {
    console.error('❌ Failed to start queue worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  queueProcessor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  queueProcessor.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  queueProcessor.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  queueProcessor.stop();
  process.exit(1);
});

// Start the worker
startWorker();