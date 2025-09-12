#!/usr/bin/env npx tsx

import { queueProcessor } from '../src/lib/chat/queue-processor';

console.log('🚀 Starting Chat Webhook Queue Processor...');
console.log('📍 Processing queued webhooks every 5 seconds');
console.log('🔄 Press Ctrl+C to stop');

// Start the processor
queueProcessor.start();

// Get initial stats
setInterval(async () => {
  try {
    const stats = await queueProcessor.getQueueStats();
    const circuitStatus = queueProcessor.getCircuitBreakerStatus();
    
    console.log(`📊 Queue Stats: Pending: ${stats.pending}, Processing: ${stats.processing}, Completed: ${stats.completed}, Failed: ${stats.failed} | Circuit: ${circuitStatus.state}`);
  } catch (error) {
    console.error('Error getting stats:', error);
  }
}, 30000); // Show stats every 30 seconds

// Keep the process running
process.stdin.resume();