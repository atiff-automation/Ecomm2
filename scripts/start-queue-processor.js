#!/usr/bin/env node

// Simple script to start the webhook queue processor
const { queueProcessor } = require('../src/lib/chat/queue-processor');

console.log('🚀 Starting Chat Webhook Queue Processor...');
console.log('📍 Processing queued webhooks every 5 seconds');
console.log('🔄 Press Ctrl+C to stop');

// Start the processor
queueProcessor.start();

// Keep the process running
process.stdin.resume();